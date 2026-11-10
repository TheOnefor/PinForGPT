/* Built-in interface icons. The chat-title icon catalog is a separate future feature. */
(() => {
  "use strict";

  const ns = globalThis.ChatKeeper ??= {};
  const STAR_PATH = "m12 2 3.1 6.3 7 .9-5.1 5 .9 7-5.9-3.2-5.9 3.2.9-7-5.1-5 7-.9L12 2Z";

  ns.Icons = Object.freeze({
    star(className = "") {
      return `<svg class="${className}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
    },
    chevron: `<svg class="ck-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
    more: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>`
  });
})();
