/* Optional native decoration. React keeps its original text nodes and handlers;
 * our markup is ONLY a sibling representation. No storage, no HTTP, no timers.
 */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const SIDEBAR = "#app-shell-sidebar";
  const LINK = 'a[data-interactive-row-link][href]';
  const TITLE = "[data-thread-title]";
  const HEADER = '[data-app-shell-main-titlebar="true"]';
  const VIEW = '[data-ck-native-title-view]';

  class NativeTitleView {
    #doc;
    constructor({ document: doc = document } = {}) { this.#doc = doc; }

    #syncSource(source) {
      if (!source?.isConnected || !source.parentElement ||
          source.closest('[contenteditable="true"], input, textarea, [role="textbox"]')) return;
      const raw = source.textContent || "";
      const old = source.nextElementSibling?.matches(VIEW) ? source.nextElementSibling : null;
      if (!raw.includes("*") || !ns.TitleCodeSyntax.parseTitle(raw).hasIcons) {
        old?.remove(); // Original becomes visible automatically (CSS :has).
        return;
      }
      const wantedClass = `${source.getAttribute("class") || ""} ck-native-title-view`.trim();
      if (old && old.className !== wantedClass) old.className = wantedClass;
      if (old?.dataset.ckRaw === raw) return; // Idempotent on unrelated React mutations.
      try {
        const view = old || this.#doc.createElement("span");
        view.dataset.ckNativeTitleView = "";
        // Preserve the native typography. In particular, don't make the
        // mirrored label subtly larger than the rest of the sidebar.
        view.className = wantedClass;
        // Do not modify the original's text, classes, attributes or React children.
        if (!ns.TitleRenderer.renderInto(view, raw)) { old?.remove(); return; }
        view.dataset.ckRaw = raw;
        view.title = raw; // Original code remains discoverable on hover.
        if (!old) source.after(view); // Only now does CSS hide the original.
      } catch (error) {
        console.warn("[PinForGPT] Native title decoration skipped:", error);
        old?.remove();
      }
    }

    syncLink(link) {
      const sidebar = this.#doc.querySelector(SIDEBAR);
      if (!link?.isConnected || !sidebar?.contains(link) ||
          !link.matches(LINK) || link.closest("[data-chatkeeper-root]")) return;
      if (!ns.normalizeChatUrl(link.href, this.#doc.location?.href)) return;
      const source = link.querySelector(TITLE);
      if (source) this.#syncSource(source);
      // React can replace only the title span, leaving an old sibling behind.
      for (const view of link.querySelectorAll(VIEW)) {
        if (view.previousElementSibling !== source) view.remove();
      }
    }

    syncLinks(links) { for (const link of links || []) this.syncLink(link); }

    syncSidebar() {
      const sidebar = this.#doc.querySelector(SIDEBAR);
      if (!sidebar) return;
      this.syncLinks(sidebar.querySelectorAll(LINK));
      // A native title may have been removed independently of our sibling.
      for (const view of sidebar.querySelectorAll(VIEW)) {
        if (!view.previousElementSibling?.matches(TITLE)) view.remove();
      }
    }

    syncHeader() {
      // ChatGPT can retain multiple titlebars while navigating without reload.
      // They may be hidden or shown again later; keep each valid native title
      // decorated without changing its React-owned source or menu button.
      const headers = this.#doc.querySelectorAll(HEADER);
      const activeChatUrl = ns.normalizeChatUrl(this.#doc.location?.href, this.#doc.location?.href);
      for (const header of headers) {
        if (!activeChatUrl) {
          for (const view of header.querySelectorAll(VIEW)) view.remove();
          continue;
        }

        // Limit the search to the page-header area when it is present. A
        // preceding invisible titlebar can contain no controls at all.
        const pageHeader = header.querySelector('[data-app-shell-page-header="true"]') || header;
        const button = pageHeader.querySelector('button[aria-haspopup="menu"]');
        // Old ChatGPT: button > span.truncate.
        // New ChatGPT: button > span.contents > ... > span.truncate.
        const source = button?.querySelector('span.min-w-0.truncate');
        const chevron = button?.querySelector(':scope > span:last-child svg');
        if (source && chevron) this.#syncSource(source);

        // A React title replacement may strand a previously injected sibling.
        // Never leave a stale SVG view behind without its exact source span.
        for (const view of header.querySelectorAll(VIEW)) {
          if (!source || view.previousElementSibling !== source) view.remove();
        }
      }
    }
  }

  ns.NativeTitleView = NativeTitleView;
})();
