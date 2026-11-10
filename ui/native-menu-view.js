/* Add one self-contained command to ChatGPT's native Radix menu.
 * We never manipulate React state, remove the native menu, or write to storage.
 */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};

  class NativeMenuView {
    #doc;
    #onToggle;
    #context = null;
    #state = null;
    #button = null;
    #separator = null;
    #busy = false;
    #keyHandler = null;

    constructor({ document: doc = document, onToggle } = {}) {
      this.#doc = doc;
      this.#onToggle = onToggle;
    }

    show(context) {
      if (!context?.menu?.isConnected || !context?.chat) return;
      if (this.#context?.menu !== context.menu) this.#detach();
      this.#context = context;
      this.#render();
    }

    setState(state) {
      this.#state = state;
      this.#render();
    }

    #render() {
      const { menu, chat } = this.#context || {};
      if (!menu?.isConnected || menu.getAttribute("data-state") !== "open" || !this.#state) return;

      const wanted = ns.normalizeChatUrl(chat.url, "https://chatgpt.com/");
      const exists = this.#state.items.some(item =>
        item.type === "chat" && ns.normalizeChatUrl(item.url, "https://chatgpt.com/") === wanted
      );

      if (!this.#button) {
        const separator = this.#doc.createElement("div");
        separator.dataset.chatkeeperNativeSeparator = "";
        separator.setAttribute("role", "separator");
        separator.innerHTML = `<div class="ck-native-separator-line"></div>`;
        this.#separator = separator;

        const button = this.#doc.createElement("button");
        button.type = "button";
        button.dataset.chatkeeperNativeAction = "";
        button.setAttribute("role", "menuitem");
        button.tabIndex = 0;
        button.innerHTML = `${ns.Icons.star()}<span class="ck-native-action-label"></span>`;
        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (this.#busy || !this.#context?.chat) return;
          this.#busy = true;
          button.disabled = true;
          const openMenu = this.#context.menu;
          const selectedChat = this.#context.chat;
          try {
            await this.#onToggle?.(selectedChat);
            // Ask Radix to dismiss itself, instead of removing its DOM behind React's back.
            if (openMenu.isConnected) {
              openMenu.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Escape", code: "Escape", bubbles: true, cancelable: true
              }));
            }
          } catch (error) {
            console.error("[ChatKeeper] Could not update favorite:", error);
            button.title = ns.I18n.t("operationFailed");
          } finally {
            this.#busy = false;
            button.disabled = false;
          }
        });
        this.#button = button;
      }
      this.#button.querySelector(".ck-native-action-label").textContent =
        ns.I18n.t(exists ? "removeFavorite" : "addFavorite");
      this.#button.title = "";
      this.#button.disabled = this.#busy;
      // Reattach if the native React menu replaced its children while staying open.
      if (this.#button.parentElement !== menu) menu.append(this.#separator, this.#button);
      if (!this.#keyHandler) {
        this.#keyHandler = (event) => {
          const nativeItems = [...menu.querySelectorAll('[role="menuitem"]')]
            .filter(el => el !== this.#button && !el.hasAttribute("data-chatkeeper-native-action"));
          const lastNative = nativeItems.at(-1);
          if (event.key === "ArrowDown" && lastNative === this.#doc.activeElement) {
            event.preventDefault();
            event.stopPropagation();
            this.#button.focus();
          } else if (event.key === "ArrowUp" && this.#button === this.#doc.activeElement) {
            event.preventDefault();
            event.stopPropagation();
            lastNative?.focus();
          }
        };
        menu.addEventListener("keydown", this.#keyHandler, true);
      }
    }

    #detach() {
      if (this.#context?.menu && this.#keyHandler) {
        this.#context.menu.removeEventListener("keydown", this.#keyHandler, true);
      }
      this.#button?.remove();
      this.#separator?.remove();
      this.#button = null;
      this.#separator = null;
      this.#context = null;
      this.#keyHandler = null;
      this.#busy = false;
    }
  }
  ns.NativeMenuView = NativeMenuView;
})();
