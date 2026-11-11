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
    chatRow: '[data-sidebar-cycle-item][role="group"]',
    menu: '[role="menu"][data-state="open"][data-radix-menu-content]'
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
    #listeners = { sidebar: new Set(), route: new Set(), menu: new Set() };
    #observer = null;
    #started = false;
    #frame = null;
    #sidebarDirty = false;
    #forceSidebar = false;
    #menuDirty = false;
    #routeDirty = false;
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

      this.#win.addEventListener("popstate", this.#onNavigation);
      this.#win.addEventListener("hashchange", this.#onNavigation);
      this.#win.addEventListener("pageshow", this.#onNavigation);
      // Navigation API detects pushState/replaceState navigations without
      // monkey-patching page JS from an isolated content script.
      this.#win.navigation?.addEventListener?.("currententrychange", this.#onNavigation);

      this.#observer = new this.#win.MutationObserver(records => this.#onMutations(records));
      this.#observer.observe(this.#doc.documentElement, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["data-state", "aria-current"]
      });
    }

    stop() {
      if (!this.#started) return;
      this.#started = false;
      this.#observer?.disconnect();
      this.#observer = null;
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
      this.#sidebarDirty = this.#menuDirty = this.#routeDirty = this.#forceSidebar = false;
    }

    #checkRoute() {
      const url = this.getCurrentChatUrl();
      if (url === this.#lastRoute) return;
      this.#lastRoute = url;
      this.#emit("route", { url });
    }

    #checkSidebar(force = false) {
      const sidebar = this.findSidebar();
      const point = this.findSectionInsertionPoint();
      if (force || sidebar !== this.#lastSidebar
          || point?.parent !== this.#lastPoint?.parent
          || point?.before !== this.#lastPoint?.before) {
        this.#lastSidebar = sidebar;
        this.#lastPoint = point;
        this.#emit("sidebar", { sidebar, point });
      }
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
      // Only React/sidebar changes and menus matter; avoid work on each streamed
      // token in the main conversation. The DOM is never changed by this adapter.
      const sidebarSelector = `${SELECTORS.sidebar}, ${SELECTORS.scroll}, ${SELECTORS.section}, [data-chatkeeper-root]`;
      const menuSelector = '[role="menu"], [data-radix-menu-content]';
      for (const record of records) {
        // Ignore edits performed inside our future SidebarView; otherwise the
        // observer could trigger an accidental render → observer → render loop.
        if (record.target.closest?.("[data-chatkeeper-root]")) continue;
        if (record.type === "attributes") {
          if (record.target.matches?.(menuSelector)) this.#menuDirty = true;
          if (record.attributeName === "aria-current"
              && record.target.closest?.(SELECTORS.sidebar)) this.#routeDirty = true;
          continue;
        }
        if (record.target.closest?.(SELECTORS.sidebar)) this.#sidebarDirty = true;
        for (const node of record.removedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.("[data-chatkeeper-root]") || node.querySelector?.("[data-chatkeeper-root]")) {
            this.#forceSidebar = true; // React removed our future UI; remount it.
          }
        }
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(sidebarSelector) || node.querySelector?.(sidebarSelector)) this.#sidebarDirty = true;
          if (node.matches?.(menuSelector) || node.querySelector?.(menuSelector)) this.#menuDirty = true;
        }
      }
      if (!this.#sidebarDirty && !this.#menuDirty && !this.#routeDirty) return;
      if (this.#frame !== null) return;
      this.#frame = this.#win.requestAnimationFrame(() => {
        this.#frame = null;
        const sidebarDirty = this.#sidebarDirty;
        const forceSidebar = this.#forceSidebar;
        const menuDirty = this.#menuDirty;
        const routeDirty = this.#routeDirty;
        this.#sidebarDirty = false;
        this.#forceSidebar = false;
        this.#menuDirty = false;
        this.#routeDirty = false;
        if (!this.#started) return;
        if (sidebarDirty) {
          this.#checkSidebar(forceSidebar); // Emit if host changed or UI was removed.
        }
        if (sidebarDirty || routeDirty) this.#checkRoute(); // Fallback if Navigation API is unavailable.
        if (menuDirty) this.#checkMenus();
      });
    }
  }

  ns.ChatGPTAdapter = ChatGPTAdapter;
  ns.normalizeChatUrl = normalizeChatUrl;
  ns.ChatGPTSelectors = SELECTORS;
})();
