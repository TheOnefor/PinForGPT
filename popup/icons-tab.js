/* Self-contained Icons tab. No storage, network, or ChatGPT DOM access. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const catalog = ns.TitleIconCatalog;
  const syntax = ns.TitleCodeSyntax;
  const t = (key, args) => ns.I18n.t(key, args);

  class IconsTabView {
    #selectedIcon = null;
    #selectedColor = null;
    #iconButtons = new Map();
    #colorButtons = new Map();
    #input = document.getElementById("icon-code-input");
    #preview = document.getElementById("icon-preview-content");
    #error = document.getElementById("icon-code-error");
    #copy = document.getElementById("icon-copy");
    #reset = document.getElementById("icon-reset");
    #status = document.getElementById("icon-copy-status");
    #help = document.getElementById("icon-code-help");
    #feedbackTimer = null;

    constructor() {
      for (const [id, key] of Object.entries({
        "icon-colors-heading": "iconColorsHeading",
        "icon-icons-heading": "iconIconsHeading",
        "icon-code-label": "iconCodeLabel",
        "icon-preview-heading": "iconPreviewHeading",
        "icon-code-help": "iconCodeHelp"
      })) document.getElementById(id).textContent = t(key);

      this.#input.placeholder = "*star:r*";
      this.#input.setAttribute("aria-label", t("iconCodeLabel"));
      this.#copy.textContent = t("iconCopy");
      this.#reset.textContent = t("iconReset");
      this.#status.textContent = "";
      this.#populateColors();
      this.#populateIcons();
      // Vertical mouse wheels don't natively scroll a horizontal-only strip.
      // Translate vertical wheel movement only while the palette can move.
      this.#enablePaletteWheel();
      this.#input.addEventListener("input", () => {
        this.#selectionFromInput();
        this.#render();
      });
      this.#copy.addEventListener("click", () => this.#copyCode());
      this.#reset.addEventListener("click", () => {
        this.#selectedIcon = null;
        this.#selectedColor = null;
        this.#input.value = "";
        this.#clearCopyFeedback();
        this.#render();
        this.#input.focus();
      });
      this.#render();
    }

    #enablePaletteWheel() {
      const host = document.getElementById("icon-colors-list");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      host.addEventListener("wheel", (event) => {
        // Keep native horizontal gestures (e.g. trackpads) and Ctrl+wheel zoom.
        if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
        if (host.scrollWidth <= host.clientWidth) return;

        // Browsers report wheel deltas in pixels, lines or pages.
        const pixels = event.deltaY * (event.deltaMode === 1 ? 16 :
          event.deltaMode === 2 ? host.clientHeight : 1);
        if (!pixels) return;
        const wheelNotch = event.deltaMode !== 0 || Math.abs(pixels) >= 40;
        const cellWidth = host.clientWidth / 10;
        // A mouse-wheel notch moves at most ~110% of one color, not three.
        // Preserve fine-grained, immediate trackpad gestures.
        const distance = wheelNotch
          ? Math.sign(pixels) * Math.min(Math.abs(pixels) * 0.5, cellWidth * 1.5)
          : pixels;
        const max = host.scrollWidth - host.clientWidth;
        if ((distance > 0 && host.scrollLeft >= max - 0.5) ||
            (distance < 0 && host.scrollLeft <= 0.5)) return;

        event.preventDefault();
        host.scrollBy({
          left: distance,
          behavior: wheelNotch && !reducedMotion.matches ? "smooth" : "instant"
        });
      }, { passive: false });
    }

    #populateColors() {
      const host = document.getElementById("icon-colors-list");
      const fragment = document.createDocumentFragment();
      for (const color of catalog.colors) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "icon-color-choice";
        const name = t(color.nameKey);
        button.title = t("iconColorTooltip", { name, code: color.code });
        button.setAttribute("aria-label", t("iconChooseColor", { name, code: color.code }));
        button.setAttribute("aria-pressed", "false");
        // The color stays unobstructed; the short code is below the swatch.
        const swatch = document.createElement("span");
        swatch.className = "icon-color-swatch";
        swatch.style.backgroundColor = color.value;
        swatch.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "icon-color-label";
        label.textContent = color.code;
        button.append(swatch, label);
        button.addEventListener("click", () => {
          // Color-first also creates a usable single-icon code.
          if (!this.#selectedIcon) this.#selectedIcon = catalog.icons[0].code;
          this.#selectedColor = color.code;
          this.#updateCodeFromSelection();
        });
        this.#colorButtons.set(color.code, button);
        fragment.append(button);
      }
      host.replaceChildren(fragment);
    }

    #populateIcons() {
      const host = document.getElementById("icon-icons-list");
      const fragment = document.createDocumentFragment();
      for (const icon of catalog.icons) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "icon-icon-choice";
        button.title = `${icon.code} · ${icon.lucide} (Lucide)`;
        button.setAttribute("aria-label", t("iconChooseIcon", { code: icon.code }));
        button.setAttribute("aria-pressed", "false");
        // Neutral tint in the palette; selected color is shown in the preview.
        const svg = catalog.createSvg(icon.code, catalog.colors[0].code, 21);
        svg.setAttribute("stroke", "currentColor");
        const label = document.createElement("span");
        label.textContent = icon.code;
        button.append(svg, label);
        button.addEventListener("click", () => {
          this.#selectedIcon = icon.code;
          if (!this.#selectedColor) this.#selectedColor = catalog.colors[0].code;
          this.#updateCodeFromSelection();
        });
        this.#iconButtons.set(icon.code, button);
        fragment.append(button);
      }
      host.replaceChildren(fragment);
    }

    #updateCodeFromSelection() {
      // The catalog constructs one group. Manual editing permits more complex groups.
      if (this.#selectedIcon && this.#selectedColor) {
        this.#input.value = `*${this.#selectedIcon}:${this.#selectedColor}*`;
      }
      this.#clearCopyFeedback();
      this.#render();
    }

    #selectionFromInput() {
      const result = syntax.validateCode(this.#input.value);
      const match = /^\*([a-z0-9_-]+):([a-z0-9_-]+)\*$/i.exec(this.#input.value.trim());
      if (result.ok && match && catalog.getIcon(match[1]) && catalog.getColor(match[2])) {
        this.#selectedIcon = match[1];
        this.#selectedColor = match[2];
      } else {
        this.#selectedIcon = null;
        this.#selectedColor = null;
      }
      this.#clearCopyFeedback();
    }

    #render() {
      for (const [code, button] of this.#iconButtons) {
        button.setAttribute("aria-pressed", String(code === this.#selectedIcon));
      }
      for (const [code, button] of this.#colorButtons) {
        button.setAttribute("aria-pressed", String(code === this.#selectedColor));
      }
      const value = this.#input.value;
      const parsed = syntax.validateCode(value);
      const isEmpty = !value.trim();
      this.#input.setAttribute("aria-invalid", String(!parsed.ok && !isEmpty));
      const message = !parsed.ok && !isEmpty
        ? t(parsed.error.key, { code: parsed.error.token }) : "";
      this.#error.textContent = message;
      this.#error.title = message;
      this.#error.hidden = !message;
      this.#help.hidden = !!message;
      this.#copy.disabled = !parsed.ok;
      this.#preview.replaceChildren();
      if (!parsed.ok) {
        const empty = document.createElement("span");
        empty.className = "icon-preview-empty";
        empty.textContent = isEmpty ? t("iconPreviewEmpty") : t("iconPreviewInvalid");
        this.#preview.append(empty);
        return;
      }
      for (const group of parsed.groups) {
        const wrap = document.createElement("span");
        wrap.className = "icon-preview-group";
        for (const item of group) {
          const svg = catalog.createSvg(item.icon, item.color, 17);
          if (svg) wrap.append(svg);
        }
        this.#preview.append(wrap);
      }
      const example = document.createElement("span");
      example.className = "icon-preview-example";
      example.textContent = t("iconPreviewSample");
      this.#preview.append(example);
    }

    #clearCopyFeedback() {
      if (this.#feedbackTimer !== null) clearTimeout(this.#feedbackTimer);
      this.#feedbackTimer = null;
      this.#copy.classList.remove("is-copied", "is-failed");
      this.#copy.textContent = t("iconCopy");
      this.#status.textContent = "";
    }

    #showCopyFeedback(success) {
      this.#clearCopyFeedback();
      this.#copy.classList.add(success ? "is-copied" : "is-failed");
      this.#copy.textContent = t(success ? "iconCopiedShort" : "iconCopyFailedShort");
      this.#status.textContent = t(success ? "iconCopied" : "iconCopyFailed");
      this.#feedbackTimer = setTimeout(() => this.#clearCopyFeedback(), 2000);
    }

    async #copyCode() {
      const value = this.#input.value.trim();
      if (!syntax.validateCode(value).ok) return;
      this.#copy.disabled = true;
      try {
        await navigator.clipboard.writeText(value);
        this.#showCopyFeedback(true);
      } catch (error) {
        console.warn("[PinForGPT] Copy icon code failed:", error);
        this.#showCopyFeedback(false);
      } finally {
        this.#copy.disabled = !syntax.validateCode(this.#input.value).ok;
      }
    }
  }

  ns.IconsTabView = IconsTabView;
})();
