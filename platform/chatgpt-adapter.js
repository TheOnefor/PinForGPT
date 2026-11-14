/* ChatGPTAdapter: read-only boundary between ChatGPT's changing DOM and our extension.
 * No chrome.storage, no UI markup, no writes to ChatGPT's DOM.
 * Loaded in the same isolated content-script world as content.js.
 */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};

  const SELECTORS = Object.freeze({
    sidebar: "#app-shell-sidebar",
    scroll: "[data-app-action-sidebar-scroll]",
    section: "[data-app-action-sidebar-section]",
    recentSection: '[data-app-action-sidebar-section-heading="Recents"]',
    projectSection: '[data-app-action-sidebar-section-heading="Projects"]',
    pinnedSection: '[data-app-action-sidebar-section-heading="Pinned"]',
    chatLink: 'a[data-interactive-row-link][href]',
    chatTitle: "[data-thread-title]",
    titlebar: '[data-app-shell-main-titlebar="true"]',
    chatRow: '[data-sidebar-cycle-item][role="group"]',
    menu: '[role="menu"][data-state="open"]'
  });

  function normalizeChatUrl(value, base) {
    try {
      const url = new URL(value, base);
      if (url.origin !== "https://chatgpt.com") return null;
      const path = url.pathname.replace(/\/$/, "");
      // Ordinary chats and project chats. The latter are only supported for URL matching,
      // NOT for injecting into native project menus in this development phase.
      if (!/^\/c\/[^/]+$/.test(path) && !/^\/g\/[^/]+\/c\/[^/]+$/.test(path)) {
        return null;
      }
      return `${url.origin}${path}`; // Query/hash are not part of chat identity.
    } catch {
      return null;
    }
  }

  // Find a direct child of ancestor that contains descendant (for sibling insertion).
  function childUnder(ancestor, descendant) {
    let node = descendant;
    while (node && node.parentElement !== ancestor) node = node.parentElement;
    return node?.parentElement === ancestor ? node : null;
  }

  class ChatGPTAdapter {
    #doc;
    #win;
    #listeners = { sidebar: new Set(), route: new Set(), menu: new Set(), titles: new Set(), header: new Set() };
    #observer = null;
    #titleObserver = null;
    #observedTitleSidebar = null;
    #observedTitleHeaders = [];
    #started = false;
    #frame = null;
    #sidebarDirty = false;
    #forceSidebar = false;
    #menuDirty = false;
    #routeDirty = false;
    #headerDirty = false;
    #changedTitleLinks = new Set();
    #lastSidebar = null;
    #lastPoint = null;
    #lastRoute = undefined;
    #lastMenu = null;
    #lastMenuTrigger = null;
    #onNavigation;

    constructor({ document: doc = document, window: win = window } = {}) {
      this.#doc = doc;
      this.#win = win;
      this.#onNavigation = () => this.#checkRoute();
    }

    onSidebarChange(callback) { return this.#subscribe("sidebar", callback); }
    onRouteChange(callback) { return this.#subscribe("route", callback); }
    onChatMenuOpen(callback) { return this.#subscribe("menu", callback); }
    onNativeTitlesChange(callback) { return this.#subscribe("titles", callback); }
    onHeaderChange(callback) { return this.#subscribe("header", callback); }

    #subscribe(type, callback) {
      if (typeof callback !== "function") throw new TypeError("Expected a callback");
      this.#listeners[type].add(callback);
      return () => this.#listeners[type].delete(callback);
    }

    #emit(type, payload) {
      for (const callback of this.#listeners[type]) {
        try { callback(payload); }
        catch (error) { console.error(`[ChatKeeper] ${type} callback failed:`, error); }
      }
    }

    findSidebar() { return this.#doc.querySelector(SELECTORS.sidebar); }

    // Insertion point ABOVE native Recents, alongside native Pinned and Projects.
    // No DOM mutations here. UI code will use point.parent.insertBefore(root, point.before).
    // If structure is ambiguous, return null instead of guessing the wrong parent.
    findSectionInsertionPoint() {
      const sidebar = this.findSidebar();
      const scroll = sidebar?.querySelector(SELECTORS.scroll);
      if (!scroll) return null;
      const recents = scroll.querySelector(SELECTORS.recentSection);
      const neighbor = scroll.querySelector(SELECTORS.projectSection)
        || scroll.querySelector(SELECTORS.pinnedSection);
      if (!recents || !neighbor) return null;

      for (let parent = neighbor.parentElement; parent && scroll.contains(parent); parent = parent.parentElement) {
        if (!parent.contains(recents)) continue;
        const before = childUnder(parent, recents);
        const neighboringChild = childUnder(parent, neighbor);
        if (before && neighboringChild && before !== neighboringChild) {
          return { parent, before };
        }
      }
      return null;
    }

    getCurrentChatUrl() {
      return normalizeChatUrl(this.#win.location.href, this.#win.location.href);
    }

    // Read-only information for the extension popup. If the sidebar is absent,
    // the popup still has a usable URL and can fall back to the tab title.
    getCurrentChatDetails() {
      const url = this.getCurrentChatUrl();
      if (!url) return null;
      const sidebar = this.findSidebar();
      if (sidebar) {
        for (const link of sidebar.querySelectorAll(SELECTORS.chatLink)) {
          if (normalizeChatUrl(link.href, this.#win.location.href) !== url) continue;
          const chat = this.#chatFromLink(link);
          if (chat) return chat;
        }
      }
      const title = this.#doc.title?.trim();
      return { url, title: title && title !== "ChatGPT" ? title : null };
    }

    // Only names supplied by ChatGPT's native sidebar are authoritative for syncing.
    // Never fall back to link.textContent (which can contain action labels) or
    // document.title (whose format may not be a conversation name).
    #nativeTitleFromLink(link) {
      const sidebar = this.findSidebar();
      if (!link?.isConnected || !sidebar?.contains(link) ||
          link.closest("[data-chatkeeper-root]")) return null;
      const url = normalizeChatUrl(link.href, this.#win.location.href);
      const title = link.querySelector(SELECTORS.chatTitle)?.textContent?.trim();
      if (!url || !title) return null;
      return { url, title };
    }

    getLoadedNativeTitles() {
      const sidebar = this.findSidebar();
      if (!sidebar) return [];
      const found = new Map();
      for (const link of sidebar.querySelectorAll(SELECTORS.chatLink)) {
        const chat = this.#nativeTitleFromLink(link);
        if (chat) found.set(chat.url, chat);
      }
      return [...found.values()];
    }

    getCurrentNativeTitle() {
      const url = this.getCurrentChatUrl();
      if (!url) return null;
      const sidebar = this.findSidebar();
      if (!sidebar) return null;
      for (const link of sidebar.querySelectorAll(SELECTORS.chatLink)) {
        const chat = this.#nativeTitleFromLink(link);
        if (chat?.url === url) return chat;
      }
      return null;
    }

    // Works for a link, a row, or any element inside a row.
    getChatFromElement(element) {
      if (!element || element.nodeType !== 1) return null;
      const link = element.matches(SELECTORS.chatLink)
        ? element
        : element.querySelector(SELECTORS.chatLink);
      return this.#chatFromLink(link);
    }

    #chatFromLink(link) {
      if (!link) return null;
      const url = normalizeChatUrl(link.href, this.#win.location.href);
      if (!url) return null;
      const title = link.querySelector(SELECTORS.chatTitle)?.textContent?.trim()
        || link.getAttribute("title")?.trim()
        || link.textContent?.trim();
      if (!title) return null;
      return { url, title };
    }

    // Radix menu's aria-labelledby points to its opening trigger button.
    // The trigger normally lives inside the matching chat row.
    getChatMenuContext(menu) {
      if (!menu?.matches?.(SELECTORS.menu)) return null;
      const ids = (menu.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean);
      const trigger = ids.map(id => this.#doc.getElementById(id)).find(el => el?.getAttribute("aria-haspopup") === "menu");
      if (!trigger) return null;

      const sidebar = this.findSidebar();
      if (!sidebar?.contains(trigger)) return null; // Ignore unrelated app menus.
      const preferredRow = trigger.closest(SELECTORS.chatRow);
      if (preferredRow) {
        const chat = this.getChatFromElement(preferredRow);
        if (chat) return { menu, trigger, row: preferredRow, chat };
      }

      // Native Pinned and Recents rows differ. Walk upward, but stop before
      // the sidebar or a container with multiple chat links (ambiguous!).
      for (let row = trigger.parentElement; row && row !== sidebar; row = row.parentElement) {
        const links = [...row.querySelectorAll(SELECTORS.chatLink)]
          .filter(link => normalizeChatUrl(link.href, this.#win.location.href));
        if (links.length > 1) break;
        if (links.length === 1) {
          const chat = this.#chatFromLink(links[0]);
          if (chat) return { menu, trigger, row, chat };
        }
      }
      return null;
    }

    start() {
      if (this.#started) return;
      this.#started = true;
      this.#lastRoute = undefined;
      this.#checkRoute();
      this.#checkSidebar(true);
      this.#checkMenus();
      this.#refreshTitleObservers();
      this.#emit("header", {});

      this.#win.addEventListener("popstate", this.#onNavigation);
      this.#win.addEventListener("hashchange", this.#onNavigation);
      this.#win.addEventListener("pageshow", this.#onNavigation);
      // Navigation API detects pushState/replaceState navigations without
      // monkey-patching page JS from an isolated content script.
      this.#win.navigation?.addEventListener?.("currententrychange", this.#onNavigation);

      this.#observer = new this.#win.MutationObserver(records => this.#onMutations(records));
      this.#observer.observe(this.#doc.documentElement, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["data-state", "aria-current", "href"]
      });
    }

    stop() {
      if (!this.#started) return;
      this.#started = false;
      this.#observer?.disconnect();
      this.#observer = null;
      this.#titleObserver?.disconnect();
      this.#titleObserver = null;
      this.#observedTitleSidebar = null;
      this.#observedTitleHeaders = [];
      this.#win.removeEventListener("popstate", this.#onNavigation);
      this.#win.removeEventListener("hashchange", this.#onNavigation);
      this.#win.removeEventListener("pageshow", this.#onNavigation);
      this.#win.navigation?.removeEventListener?.("currententrychange", this.#onNavigation);
      if (this.#frame !== null) this.#win.cancelAnimationFrame(this.#frame);
      this.#frame = null;
      this.#lastMenu = null;
      this.#lastMenuTrigger = null;
      this.#lastSidebar = null;
      this.#lastPoint = null;
      this.#changedTitleLinks.clear();
      this.#sidebarDirty = this.#menuDirty = this.#routeDirty = this.#forceSidebar = this.#headerDirty = false;
    }

    #checkRoute() {
      const url = this.getCurrentChatUrl();
      if (url === this.#lastRoute) return;
      this.#lastRoute = url;
      this.#emit("route", { url });
      // The route event can precede React's header update. Re-check now,
      // then the focused titlebar observer will pick up the later DOM change.
      this.#refreshTitleObservers();
      this.#emit("header", {});
    }

    #checkSidebar(force = false) {
      const sidebar = this.findSidebar();
      this.#refreshTitleObservers();
      const point = this.findSectionInsertionPoint();
      if (force || sidebar !== this.#lastSidebar
          || point?.parent !== this.#lastPoint?.parent
          || point?.before !== this.#lastPoint?.before) {
        this.#lastSidebar = sidebar;
        this.#lastPoint = point;
        this.#emit("sidebar", { sidebar, point });
      }
    }

    #refreshTitleObservers() {
      const sidebar = this.findSidebar();
      const headers = [...this.#doc.querySelectorAll(SELECTORS.titlebar)];
      if (sidebar === this.#observedTitleSidebar &&
          headers.length === this.#observedTitleHeaders.length &&
          headers.every((el, i) => el === this.#observedTitleHeaders[i])) return;
      this.#titleObserver?.disconnect();
      if (!this.#titleObserver) {
        this.#titleObserver = new this.#win.MutationObserver(records => this.#onMutations(records));
      }
      // The sidebar observer remains limited to native title text mutations.
      if (sidebar) this.#titleObserver.observe(sidebar, { characterData: true, subtree: true });
      // SPA navigation retains older titlebars and creates a new one for each
      // previously unseen chat. Observe all of these small regions, never the
      // streamed conversation body. Watch visibility toggles for reused bars.
      for (const header of headers) {
        this.#titleObserver.observe(header, {
          characterData: true, childList: true, subtree: true,
          attributes: true,
          attributeFilter: ["class", "style", "hidden", "aria-hidden"]
        });
      }
      this.#observedTitleSidebar = sidebar;
      this.#observedTitleHeaders = headers;
    }

    #checkMenus() {
      const menus = this.#doc.querySelectorAll(SELECTORS.menu);
      const found = [...menus].map(menu => this.getChatMenuContext(menu)).find(Boolean);
      if (!found) {
        this.#lastMenu = null;
        this.#lastMenuTrigger = null;
        return;
      }
      if (found.menu === this.#lastMenu && found.trigger === this.#lastMenuTrigger) return;
      this.#lastMenu = found.menu;
      this.#lastMenuTrigger = found.trigger;
      this.#emit("menu", found);
    }

    #onMutations(records) {
      // Keep our original sidebar/menu observer. Only collect title candidates
      // from ChatGPT's *native* sidebar; streamed messages elsewhere are ignored.
      const sidebarSelector = `${SELECTORS.sidebar}, ${SELECTORS.scroll}, ${SELECTORS.section}, [data-chatkeeper-root]`;
      const menuSelector = '[role="menu"], [data-radix-menu-content]';
      const sidebar = this.findSidebar();
      for (const record of records) {
        // characterData mutation targets a Text node, not an Element.
        const target = record.target.nodeType === 1
          ? record.target : record.target.parentElement;
        if (!target || target.closest?.("[data-chatkeeper-root], [data-ck-native-title-view]")) continue;
        if (record.type === "childList" && record.addedNodes.length + record.removedNodes.length &&
            [...record.addedNodes, ...record.removedNodes].every(node =>
              node.nodeType === 1 && node.matches?.("[data-ck-native-title-view]"))) {
          // An external React reconciliation can remove our sibling. Rebuild it
          // on the next frame; the addition we perform ourselves is ignored.
          if (record.removedNodes.length) {
            const link = target.closest?.(SELECTORS.chatLink);
            if (sidebar?.contains(target) && link) this.#changedTitleLinks.add(link);
            if (target.closest?.(SELECTORS.titlebar)) this.#headerDirty = true;
          }
          continue;
        }

        if (record.type === "characterData") {
          if (target.closest(SELECTORS.titlebar)) this.#headerDirty = true;
          if (sidebar?.contains(target) && target.closest(SELECTORS.chatTitle)) {
            const link = target.closest(SELECTORS.chatLink);
            if (link) this.#changedTitleLinks.add(link);
          }
          continue;
        }

        if (record.type === "attributes") {
          if (target.closest?.(SELECTORS.titlebar) &&
              ["class", "style", "hidden", "aria-hidden"].includes(record.attributeName)) {
            this.#headerDirty = true;
          }
          if (target.matches?.(menuSelector)) this.#menuDirty = true;
          if (record.attributeName === "aria-current" && sidebar?.contains(target)) {
            this.#routeDirty = true;
          }
          if (record.attributeName === "href" && sidebar?.contains(target) &&
              target.matches?.(SELECTORS.chatLink)) {
            this.#changedTitleLinks.add(target);
          }
          continue;
        }

        if (target.closest?.(SELECTORS.titlebar)) this.#headerDirty = true;
        if (sidebar?.contains(target)) {
          this.#sidebarDirty = true;
          // React can remove/reinsert only the native title; update its mirror too.
          const enclosingLink = target.closest(SELECTORS.chatLink);
          if (enclosingLink) this.#changedTitleLinks.add(enclosingLink);
          // A title's text child was replaced rather than edited in place.
          const title = target.closest(SELECTORS.chatTitle);
          const link = title?.closest(SELECTORS.chatLink);
          if (link) this.#changedTitleLinks.add(link);
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1 || node.matches?.("[data-chatkeeper-root]")) continue;
            // A title element appeared inside an existing link.
            if (node.matches?.(SELECTORS.chatTitle) || node.querySelector?.(SELECTORS.chatTitle)) {
              const enclosingLink = target.closest(SELECTORS.chatLink);
              if (enclosingLink) this.#changedTitleLinks.add(enclosingLink);
            }
            // Entire chat links/rows were created, including lazy loading.
            if (node.matches?.(SELECTORS.chatLink)) this.#changedTitleLinks.add(node);
            for (const nativeLink of node.querySelectorAll?.(SELECTORS.chatLink) || []) {
              this.#changedTitleLinks.add(nativeLink);
            }
          }
        }

        for (const node of record.removedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.("[data-chatkeeper-root]") || node.querySelector?.("[data-chatkeeper-root]")) {
            this.#forceSidebar = true; // React removed our UI; remount it.
          }
        }
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(sidebarSelector) || node.querySelector?.(sidebarSelector)) this.#sidebarDirty = true;
          if (node.matches?.(menuSelector) || node.querySelector?.(menuSelector)) this.#menuDirty = true;
          if (node.matches?.(SELECTORS.titlebar) || node.querySelector?.(SELECTORS.titlebar)) {
            this.#headerDirty = true;
          }
        }
        // If the entire sidebar was added, record.target is outside of it.
        // Its links become candidates, but we do not scan the full page.
        if (!sidebar?.contains(target)) {
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1 || node.matches?.("[data-chatkeeper-root]")) continue;
            if (node.matches?.(SELECTORS.sidebar) || node.querySelector?.(SELECTORS.sidebar)) {
              const nativeSidebar = node.matches?.(SELECTORS.sidebar)
                ? node : node.querySelector(SELECTORS.sidebar);
              for (const link of nativeSidebar.querySelectorAll(SELECTORS.chatLink)) {
                this.#changedTitleLinks.add(link);
              }
            }
          }
        }
      }
      if (!this.#sidebarDirty && !this.#menuDirty && !this.#routeDirty &&
          !this.#headerDirty && !this.#changedTitleLinks.size) return;
      if (this.#frame !== null) return;
      this.#frame = this.#win.requestAnimationFrame(() => {
        this.#frame = null;
        const sidebarDirty = this.#sidebarDirty;
        const forceSidebar = this.#forceSidebar;
        const menuDirty = this.#menuDirty;
        const routeDirty = this.#routeDirty;
        const headerDirty = this.#headerDirty;
        const titleLinks = [...this.#changedTitleLinks];
        this.#changedTitleLinks.clear();
        this.#sidebarDirty = false;
        this.#forceSidebar = false;
        this.#menuDirty = false;
        this.#routeDirty = false;
        this.#headerDirty = false;
        if (!this.#started) return;
        if (sidebarDirty) this.#checkSidebar(forceSidebar);
        if (sidebarDirty || routeDirty) this.#checkRoute();
        if (menuDirty) this.#checkMenus();
        if (headerDirty) { this.#refreshTitleObservers(); this.#emit("header", {}); }
        if (titleLinks.length) {
          const chats = new Map();
          for (const link of titleLinks) {
            const chat = this.#nativeTitleFromLink(link);
            if (chat) chats.set(chat.url, chat);
          }
          this.#emit("titles", { chats: [...chats.values()], links: titleLinks });
        }
      });
    }
  }

  ns.ChatGPTAdapter = ChatGPTAdapter;
  ns.normalizeChatUrl = normalizeChatUrl;
  ns.ChatGPTSelectors = SELECTORS;
})();
