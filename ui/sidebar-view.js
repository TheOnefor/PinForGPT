/* Our own sidebar UI. No ChatGPT selectors, storage reads or storage writes. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};


  class SidebarView {
    #doc;
    #root = null;
    #list = null;
    #heading = null;
    #toggle = null;
    #error = null;
    #expanded = false; // Each page load starts collapsed.
    #items = [];
    #activeUrl = null;
    #rows = new Map();
    #menu = null;
    #menuAction = null;
    #menuOwner = null;
    #onRemove;

    constructor({ document: doc = document, onRemove = null } = {}) {
      this.#doc = doc;
      this.#onRemove = onRemove;
    }

    mount(point) {
      if (!point?.parent?.isConnected || !point?.before?.isConnected ||
          point.before.parentNode !== point.parent) return false;
      if (!this.#root) this.#build();
      if (this.#root.parentNode !== point.parent || this.#root.nextSibling !== point.before) {
        point.parent.insertBefore(this.#root, point.before);
      }
      return true;
    }

    setItems(items) {
      this.#items = Array.isArray(items) ? items : [];
      if (this.#root) this.#render();
    }

    setActiveUrl(url) {
      if (url !== this.#activeUrl) this.#closeMenu(false);
      this.#activeUrl = url;
      this.#updateActive();
    }

    showError(message) {
      if (!this.#root) this.#build();
      this.#error.textContent = message;
      this.#error.hidden = !message;
    }

    clearError() {
      if (this.#error) {
        this.#error.textContent = "";
        this.#error.hidden = true;
      }
    }

    #build() {
      const section = this.#doc.createElement("section");
      section.dataset.chatkeeperRoot = "";
      section.className = "ck-section";
      section.setAttribute("aria-label", ns.I18n.t("favorites"));

      const toggle = this.#doc.createElement("button");
      toggle.type = "button";
      toggle.className = "ck-heading";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = `${ns.Icons.star("ck-star")}<span class="ck-heading-label"></span>${ns.Icons.chevron}`;
      const heading = toggle.querySelector(".ck-heading-label");
      heading.textContent = ns.I18n.t("favorites");

      const list = this.#doc.createElement("div");
      list.className = "ck-list";
      list.id = "ck-favorites-list";
      list.hidden = true;
      toggle.setAttribute("aria-controls", list.id);
      toggle.addEventListener("click", () => {
        this.#expanded = !this.#expanded;
        list.hidden = !this.#expanded;
        toggle.setAttribute("aria-expanded", String(this.#expanded));
        toggle.querySelector(".ck-chevron").classList.toggle("ck-open", this.#expanded);
        if (!this.#expanded) this.#closeMenu(false);
      });

      const error = this.#doc.createElement("div");
      error.className = "ck-error";
      error.setAttribute("role", "alert");
      error.hidden = true;
      section.append(toggle, error, list);

      this.#root = section;
      this.#list = list;
      this.#heading = heading;
      this.#toggle = toggle;
      this.#error = error;

      // One reusable popup menu for the entire list (not 56 separate menus).
      const menu = this.#doc.createElement("div");
      menu.dataset.chatkeeperRowMenu = "";
      menu.setAttribute("role", "menu");
      menu.hidden = true;
      const action = this.#doc.createElement("button");
      action.type = "button";
      action.setAttribute("role", "menuitem");
      action.textContent = ns.I18n.t("removeFavorite");
      action.addEventListener("click", async () => {
        const owner = this.#menuOwner;
        if (!owner || action.disabled) return;
        action.disabled = true;
        try {
          await this.#onRemove?.(owner.item);
          this.#closeMenu(false);
        } catch (error) {
          this.showError(ns.I18n.t("operationFailed"));
          console.error("[ChatKeeper] Could not remove favorite:", error);
          action.disabled = false;
        }
      });
      menu.append(action);
      this.#doc.body.append(menu);
      this.#menu = menu;
      this.#menuAction = action;

      this.#doc.addEventListener("pointerdown", (event) => {
        if (!this.#menuOwner) return;
        if (this.#menu?.contains(event.target)) return;
        if (this.#menuOwner.button.contains(event.target)) return;
        this.#closeMenu(false);
      }, true);
      this.#doc.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.#menuOwner) {
          event.preventDefault();
          event.stopPropagation();
          this.#closeMenu(true);
        }
      }, true);

      this.#render();
    }

    #render() {
      this.#closeMenu(false);
      this.#rows.clear();
      const fragment = this.#doc.createDocumentFragment();
      let shown = 0;
      for (const item of this.#items) {
        if (item?.type !== "chat") continue;
        const url = ns.normalizeChatUrl(item.url, "https://chatgpt.com/");
        if (!url) continue;
        const row = this.#doc.createElement("div");
        row.className = "ck-chat-row";

        const link = this.#doc.createElement("a");
        link.className = "ck-chat";
        link.href = url;
        link.title = item.title;
        link.textContent = item.title;
        link.dataset.ckChatUrl = url;
        link.addEventListener("click", () => this.setActiveUrl(url));

        const more = this.#doc.createElement("button");
        more.type = "button";
        more.className = "ck-more";
        more.setAttribute("aria-label", ns.I18n.t("chatActions", { title: item.title }));
        more.setAttribute("aria-haspopup", "menu");
        more.setAttribute("aria-expanded", "false");
        more.innerHTML = ns.Icons.more;
        more.addEventListener("click", () => this.#toggleMenu(item, more));

        row.append(link, more);
        fragment.append(row);
        if (!this.#rows.has(url)) this.#rows.set(url, []);
        this.#rows.get(url).push(link);
        shown++;
      }
      if (shown === 0) {
        const empty = this.#doc.createElement("div");
        empty.className = "ck-empty";
        empty.textContent = ns.I18n.t("emptyFavorites");
        fragment.append(empty);
      }
      this.#list.replaceChildren(fragment);
      this.#updateActive();
    }

    #toggleMenu(item, button) {
      if (this.#menuOwner?.button === button) {
        this.#closeMenu(true);
        return;
      }
      this.#closeMenu(false);
      this.#menuOwner = { item, button };
      button.setAttribute("aria-expanded", "true");
      this.#menuAction.textContent = ns.I18n.t("removeFavorite");
      this.#menuAction.disabled = false;
      this.#menu.hidden = false;
      this.#positionMenu(button);
      this.#menuAction.focus({ preventScroll: true });
    }

    #positionMenu(button) {
      const rect = button.getBoundingClientRect();
      const menu = this.#menu;
      const width = menu.offsetWidth;
      const height = menu.offsetHeight;
      const viewportW = this.#doc.defaultView.innerWidth;
      const viewportH = this.#doc.defaultView.innerHeight;
      const left = Math.max(8, Math.min(rect.right - width, viewportW - width - 8));
      const below = rect.bottom + 4;
      const top = below + height <= viewportH - 8
        ? below : Math.max(8, rect.top - height - 4);
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    }

    #closeMenu(restoreFocus) {
      if (!this.#menuOwner) return;
      const { button } = this.#menuOwner;
      this.#menuOwner = null;
      if (this.#menu) this.#menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus && button.isConnected) button.focus({ preventScroll: true });
    }

    #updateActive() {
      for (const [url, links] of this.#rows) {
        for (const link of links) {
          if (url === this.#activeUrl) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        }
      }
    }
  }

  ns.SidebarView = SidebarView;
})();
