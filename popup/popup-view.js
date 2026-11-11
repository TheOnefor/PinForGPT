/* Popup-only UI. No chrome.storage, no Chrome tabs API, no ChatGPT DOM. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const t = (key, args) => ns.I18n.t(key, args);

  class PopupView {
    #items = [];
    #count = 0;
    #current = null;
    #currentExists = false;
    #busy = false;
    #menuOwner = null;
    #onOpen;
    #onRemove;
    #onAddCurrent;
    #list = document.getElementById("chat-list");
    #menu = document.getElementById("row-menu");
    #remove = document.getElementById("menu-remove");
    #currentButton = document.getElementById("add-current");
    #currentHint = document.getElementById("current-hint");
    #status = document.getElementById("status");
    #statusText = document.getElementById("status-text");
    #statusClose = document.getElementById("status-close");
    #statusTimer = null;

    constructor({ onOpen, onRemove, onAddCurrent }) {
      this.#onOpen = onOpen;
      this.#onRemove = onRemove;
      this.#onAddCurrent = onAddCurrent;
      document.documentElement.lang = ns.I18n.language();
      document.getElementById("brand-icon").innerHTML = ns.Icons.star();
      document.getElementById("version").textContent = `v${chrome.runtime.getManifest().version}`;
      const names = { favorites: "popupFavorites", backups: "popupBackups", icons: "popupIcons" };
      for (const [name, key] of Object.entries(names)) {
        const button = document.getElementById(`tab-${name}`);
        button.textContent = t(key);
        button.addEventListener("click", () => this.#activateTab(name));
      }
      this.#placeholder("backups", "popupBackupsTitle", "popupBackupsPlaceholder");
      this.#placeholder("icons", "popupIconsTitle", "popupIconsPlaceholder");
      this.#remove.textContent = t("removeFavorite");
      this.#statusClose.setAttribute("aria-label", t("popupCloseNotification"));
      this.#statusClose.title = t("popupCloseNotification");
      this.#statusClose.addEventListener("click", () => this.hideStatus());

      this.#currentButton.addEventListener("click", async () => {
        if (this.#busy || !this.#current || this.#currentExists) return;
        await this.#execute(() => this.#onAddCurrent(this.#current), "popupAddSuccess");
      });
      this.#remove.addEventListener("click", async () => {
        if (!this.#menuOwner || this.#busy) return;
        const chat = this.#menuOwner;
        this.#closeMenu();
        await this.#execute(() => this.#onRemove(chat), "popupRemoveSuccess");
      });
      document.addEventListener("pointerdown", (event) => {
        if (this.#menu.hidden) return;
        if (this.#menu.contains(event.target) || event.target.closest(".chat-more")) return;
        this.#closeMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.#closeMenu();
      });
      this.setCurrent(null, true);
      this.render();
    }

    #placeholder(tab, titleKey, bodyKey) {
      const element = document.getElementById(`${tab}-placeholder`);
      const icon = document.createElement("div");
      icon.className = "placeholder-icon";
      icon.textContent = tab === "backups" ? "↧" : "✧";
      const title = document.createElement("h2");
      title.textContent = t(titleKey);
      const text = document.createElement("p");
      text.textContent = t(bodyKey);
      element.append(icon, title, text);
    }

    #activateTab(tab) {
      this.#closeMenu();
      for (const name of ["favorites", "backups", "icons"]) {
        const selected = name === tab;
        const btn = document.getElementById(`tab-${name}`);
        btn.classList.toggle("is-active", selected);
        btn.setAttribute("aria-selected", String(selected));
        document.getElementById(`panel-${name}`).hidden = !selected;
      }
    }

    setCurrent(chat, loading = false) {
      this.#current = chat;
      this.#currentExists = !!chat && this.#items.some(item => item.url === chat.url);
      this.#currentButton.disabled = this.#busy || !chat || this.#currentExists || loading;
      this.#currentButton.textContent = this.#currentExists ? t("popupAlreadyFavorite") : t("popupAddCurrent");
      this.#currentHint.textContent = loading ? t("popupCurrentLoading") : (!chat ? t("popupNoCurrentChat") : "");
      this.#currentHint.hidden = !!chat && !loading;
    }

    render({ items = this.#items, uniqueCount = this.#count } = {}) {
      this.#items = items;
      this.#count = uniqueCount;
      document.getElementById("unique-count").textContent = t("popupUniqueCount", { count: this.#count });
      this.#closeMenu();
      const fragment = document.createDocumentFragment();
      for (const chat of items) {
        const row = document.createElement("div");
        row.className = "chat-row";
        const link = document.createElement("a");
        link.className = "chat-link";
        link.href = chat.url;
        link.title = chat.title;
        link.textContent = chat.title;
        link.setAttribute("aria-label", t("popupOpenChat", { title: chat.title }));
        link.addEventListener("click", async (event) => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
          event.preventDefault();
          try { await this.#onOpen(chat); }
          catch (error) { this.showStatus(t("popupOpenFailed"), true); console.error(error); }
        });
        const more = document.createElement("button");
        more.type = "button";
        more.className = "chat-more";
        more.setAttribute("aria-label", t("chatActions", { title: chat.title }));
        more.setAttribute("aria-haspopup", "menu");
        more.innerHTML = ns.Icons.more;
        more.addEventListener("click", () => this.#toggleMenu(chat, more));
        row.append(link, more);
        fragment.append(row);
      }
      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = t("popupNoFavorites");
        fragment.append(empty);
      }
      this.#list.replaceChildren(fragment);
      this.setCurrent(this.#current);
    }

    #toggleMenu(chat, btn) {
      if (!this.#menu.hidden && this.#menuOwner?.url === chat.url) {
        this.#closeMenu();
        return;
      }
      this.#menuOwner = chat;
      this.#menu.hidden = false;
      const r = btn.getBoundingClientRect();
      const mw = this.#menu.offsetWidth, mh = this.#menu.offsetHeight;
      this.#menu.style.left = `${Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8))}px`;
      this.#menu.style.top = `${r.bottom + mh + 6 <= window.innerHeight ? r.bottom + 4 : Math.max(8, r.top - mh - 4)}px`;
      this.#remove.focus({ preventScroll: true });
    }

    #closeMenu() {
      this.#menu.hidden = true;
      this.#menuOwner = null;
    }

    async #execute(action, successKey) {
      this.#busy = true;
      this.#currentButton.disabled = true;
      this.#remove.disabled = true;
      this.#closeMenu();
      try {
        await action();
        this.showStatus(t(successKey));
      } catch (error) {
        console.error("[PinForGPT popup] Action failed:", error);
        this.showStatus(t("operationFailed"), true);
      } finally {
        this.#busy = false;
        this.#remove.disabled = false;
        this.setCurrent(this.#current);
      }
    }

    showStatus(message, isError = false) {
      this.hideStatus(); // Cancel the previous countdown when a newer message arrives.
      if (!message) return;
      this.#statusText.textContent = message;
      this.#status.classList.toggle("is-error", isError);
      this.#status.hidden = false;
      if (!isError) {
        this.#statusTimer = setTimeout(() => this.hideStatus(), 4000);
      }
    }

    hideStatus() {
      if (this.#statusTimer !== null) {
        clearTimeout(this.#statusTimer);
        this.#statusTimer = null;
      }
      this.#status.hidden = true;
    }
  }

  ns.PopupView = PopupView;
})();
