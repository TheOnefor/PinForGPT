/* Shared title presentation: pure DOM rendering, no storage or host mutations.
 * The input is always the ORIGINAL ChatGPT title, including its codes.
 */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};

  function renderInto(host, rawTitle, { size = 16 } = {}) {
    const parsed = ns.TitleCodeSyntax.parseTitle(rawTitle);
    const fragment = host.ownerDocument.createDocumentFragment();
    for (const piece of parsed.parts) {
      if (piece.type === "text") {
        fragment.append(host.ownerDocument.createTextNode(piece.value));
        continue;
      }
      const svg = ns.TitleIconCatalog.createSvg(piece.code, piece.color, size, host.ownerDocument);
      // A catalog entry without valid SVG must never make text disappear.
      if (!svg) return false;
      svg.classList.add("ck-title-inline-icon");
      // Keep icon-only chat names accessible to screen readers as well.
      svg.removeAttribute("aria-hidden");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", ns.TitleIconCatalog.getIcon(piece.code)?.lucide || piece.code);
      fragment.append(svg);
    }
    host.replaceChildren(fragment);
    return parsed.hasIcons;
  }

  ns.TitleRenderer = Object.freeze({ renderInto });
})();
