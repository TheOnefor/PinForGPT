/* Shared icon markup parser for the popup and complete chat titles.
 * Never mutates source text or ChatGPT DOM.
 */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const catalog = ns.TitleIconCatalog;
  const VALID_CODE = /^[a-z0-9][a-z0-9_-]*$/i;
  const bad = (key, token = "") => ({ ok: false, error: { key, token } });

  function parseGroup(source) {
    if (typeof source !== "string") return bad("iconErrorFormat");
    const parts = source.split(":");
    if (parts.length !== 2) return bad("iconErrorFormat");
    const icons = parts[0].split(",").map(v => v.trim());
    const colors = parts[1].split(",").map(v => v.trim());
    if (icons.some(x => !VALID_CODE.test(x)) || colors.some(x => !VALID_CODE.test(x))) {
      return bad("iconErrorFormat");
    }
    for (const code of icons) {
      if (!catalog.getIcon(code)) return bad("iconErrorUnknownIcon", code);
    }
    for (const code of colors) {
      if (!catalog.getColor(code)) return bad("iconErrorUnknownColor", code);
    }
    return {
      ok: true,
      icons: icons.map((code, i) => ({ icon: code, color: colors[Math.min(i, colors.length - 1)] }))
    };
  }

  // Popup editor accepts one or more complete *group* strings (not an entire title).
  // Spaces between complete groups are allowed. Extra colors are ignored visually.
  function validateCode(value) {
    if (typeof value !== "string" || !value.trim()) return bad("iconErrorEmpty");
    const text = value.trim();
    const icons = [];
    const groups = [];
    let offset = 0;
    while (offset < text.length) {
      while (/\s/.test(text[offset] ?? "") && offset < text.length) offset++;
      if (offset >= text.length) break;
      if (text[offset] !== "*") return bad("iconErrorFormat");
      const close = text.indexOf("*", offset + 1);
      if (close < 0) return bad("iconErrorFormat");
      const group = parseGroup(text.slice(offset + 1, close));
      if (!group.ok) return group;
      groups.push(group.icons);
      icons.push(...group.icons);
      offset = close + 1;
    }
    return icons.length ? { ok: true, groups, icons } : bad("iconErrorFormat");
  }

  // Full chat titles may mix literal text and any number of complete *groups*.
  // If a group is malformed or has an unknown code, keep that exact substring.
  function parseTitle(title) {
    const raw = typeof title === "string" ? title : "";
    const parts = [];
    let hasIcons = false;
    const text = value => {
      if (!value) return;
      const previous = parts.at(-1);
      if (previous?.type === "text") previous.value += value;
      else parts.push({ type: "text", value });
    };
    let from = 0;
    while (from < raw.length) {
      const open = raw.indexOf("*", from);
      if (open < 0) { text(raw.slice(from)); break; }
      text(raw.slice(from, open));
      const close = raw.indexOf("*", open + 1);
      if (close < 0) { text(raw.slice(open)); break; }
      const rawGroup = raw.slice(open, close + 1);
      const group = parseGroup(raw.slice(open + 1, close));
      if (group.ok) {
        for (const { icon, color } of group.icons) {
          parts.push({ type: "icon", code: icon, color });
        }
        hasIcons = true;
      } else text(rawGroup);
      from = close + 1;
    }
    return { parts, hasIcons };
  }

  ns.TitleCodeSyntax = Object.freeze({ parseGroup, validateCode, parseTitle });
})();
