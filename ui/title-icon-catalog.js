/* Data-only Lucide catalog for chat-title icons. Extend ICONS or COLORS to add choices.
 * SVG definitions are bundled, so no remote assets or runtime dependencies are needed.
 * Lucide/Feather notices: third_party/lucide/LICENSE.
 */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Codes are stored in users' titles. Once published, do not repurpose a code.
  const ICONS = Object.freeze([
    { code: "star", lucide: "star", paths: [
      "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
    ] },
    // "code-2" was renamed to "code-xml" in the upstream icon library.
    { code: "dev", lucide: "code-xml", paths: [
      "m18 16 4-4-4-4", "m6 8-4 4 4 4", "m14.5 4-5 16"
    ] },
    { code: "bk", lucide: "book-open", paths: [
      "M12 5v16",
      "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"
    ] },

    // GROUP 2: priority icons (shown after the existing three).
    { code: "set", lucide: "settings", elements: [
      ["path", { d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" }],
      ["circle", { cx: "12", cy: "12", r: "3" }]
    ] },
    { code: "h", lucide: "heart", paths: [
      "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
    ] },
    { code: "clk", lucide: "clock", elements: [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 6v6l4 2" }]
    ] },
    { code: "idea", lucide: "lightbulb", paths: [
      "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      "M9 18h6",
      "M10 22h4"
    ] },
    { code: "f", lucide: "flame", paths: [
      "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
    ] },
    { code: "fg", lucide: "flag", paths: [
      "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"
    ] },
    { code: "ar", lucide: "archive", elements: [
      ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
      ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
      ["path", { d: "M10 12h4" }]
    ] },
    { code: "wrn", lucide: "triangle-exclamation-point", paths: [
      "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      "M12 9v4",
      "M12 17h.01"
    ] },
    { code: "q", lucide: "circle-question-mark", elements: [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M9 9.5a3 2.5 0 016 0c0 2-2 2-3 3.5" }],
      ["path", { d: "M12 17h.01" }]
    ] },
    { code: "bm", lucide: "bookmark", paths: [
      "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
    ] },
    { code: "img", lucide: "image", elements: [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["circle", { cx: "9", cy: "9", r: "2" }],
      ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
    ] },
    { code: "s", lucide: "search", elements: [
      ["path", { d: "m21 21-4.34-4.34" }],
      ["circle", { cx: "11", cy: "11", r: "8" }]
    ] },

    // GROUP 3: the remaining 40 title icons.
    { code: "txt", lucide: "file-text", paths: [
      "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      "M14 2v5a1 1 0 0 0 1 1h5",
      "M10 9H8",
      "M16 13H8",
      "M16 17H8"
    ] },
    { code: "pen", lucide: "pencil", paths: [
      "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      "m15 5 4 4"
    ] },
    { code: "cal", lucide: "calendar-days", elements: [
      ["path", { d: "M8 2v3" }],
      ["path", { d: "M16 2v3" }],
      ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
      ["path", { d: "M3 9h18" }],
      ["path", { d: "M8 13h.01" }],
      ["path", { d: "M12 13h.01" }],
      ["path", { d: "M16 13h.01" }],
      ["path", { d: "M8 17h.01" }],
      ["path", { d: "M12 17h.01" }],
      ["path", { d: "M16 17h.01" }]
    ] },
    { code: "bot", lucide: "bot", elements: [
      ["path", { d: "M12 8V4H8" }],
      ["rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }],
      ["path", { d: "M2 14h2" }],
      ["path", { d: "M20 14h2" }],
      ["path", { d: "M15 13v2" }],
      ["path", { d: "M9 13v2" }]
    ] },
    { code: "mail", lucide: "mail", elements: [
      ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" }],
      ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }]
    ] },
    { code: "lnk", lucide: "link", paths: [
      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
    ] },
    { code: "ok", lucide: "circle-check", elements: [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m16 9-5.5 5.5L8 12" }]
    ] },
    { code: "home", lucide: "house", paths: [
      "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
      "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
    ] },
    { code: "eye", lucide: "eye", elements: [
      ["path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }],
      ["circle", { cx: "12", cy: "12", r: "3" }]
    ] },
    { code: "lock", lucide: "lock-keyhole", elements: [
      ["circle", { cx: "12", cy: "16", r: "1" }],
      ["rect", { x: "3", y: "10", width: "18", height: "12", rx: "2" }],
      ["path", { d: "M7 10V7a5 5 0 0 1 10 0v3" }]
    ] },
    { code: "grad", lucide: "graduation-cap", paths: [
      "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
      "M22 10v6",
      "M6 12.5V16a6 3 0 0 0 12 0v-3.5"
    ] },
    { code: "lang", lucide: "languages", paths: [
      "m5 8 6 6",
      "m4 14 6-6 2-3",
      "M2 5h12",
      "M7 2h1",
      "m22 22-5-10-5 10",
      "M14 18h6"
    ] },
    { code: "work", lucide: "briefcase-business", elements: [
      ["path", { d: "M12 12h.01" }],
      ["path", { d: "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M22 13a18.15 18.15 0 0 1-20 0" }],
      ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
    ] },
    { code: "cpu", lucide: "cpu", elements: [
      ["path", { d: "M12 20v2" }],
      ["path", { d: "M12 2v2" }],
      ["path", { d: "M17 20v2" }],
      ["path", { d: "M17 2v2" }],
      ["path", { d: "M2 12h2" }],
      ["path", { d: "M2 17h2" }],
      ["path", { d: "M2 7h2" }],
      ["path", { d: "M20 12h2" }],
      ["path", { d: "M20 17h2" }],
      ["path", { d: "M20 7h2" }],
      ["path", { d: "M7 20v2" }],
      ["path", { d: "M7 2v2" }],
      ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }],
      ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" }]
    ] },
    { code: "map", lucide: "map", paths: [
      "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",
      "M15 5.764v15",
      "M9 3.236v15"
    ] },
    { code: "pin", lucide: "pin", paths: [
      "M12 17v5",
      "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
    ] },
    { code: "car", lucide: "car", elements: [
      ["path", { d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" }],
      ["circle", { cx: "7", cy: "17", r: "2" }],
      ["path", { d: "M9 17h6" }],
      ["circle", { cx: "17", cy: "17", r: "2" }]
    ] },
    { code: "shop", lucide: "shopping-cart", elements: [
      ["path", { d: "m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" }],
      ["path", { d: "M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" }],
      ["circle", { cx: "18", cy: "20", r: "2" }],
      ["circle", { cx: "8", cy: "20", r: "2" }]
    ] },
    { code: "cam", lucide: "camera", elements: [
      ["path", { d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" }],
      ["circle", { cx: "12", cy: "13", r: "3" }]
    ] },
    { code: "tool", lucide: "wrench", paths: [
      "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"
    ] },
    { code: "cup", lucide: "trophy", paths: [
      "M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2",
      "M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2",
      "M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3",
      "M4 22h16",
      "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",
      "M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"
    ] },
    { code: "art", lucide: "palette", elements: [
      ["path", { d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" }],
      ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor" }]
    ] },
    { code: "fly", lucide: "plane", paths: [
      "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
    ] },
    { code: "gift", lucide: "gift", elements: [
      ["path", { d: "M12 7v14" }],
      ["path", { d: "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
      ["path", { d: "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" }],
      ["rect", { x: "3", y: "7", width: "18", height: "4", rx: "1" }]
    ] },
    { code: "cafe", lucide: "coffee", paths: [
      "M10 2v2",
      "M14 2v2",
      "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",
      "M6 2v2"
    ] },
    { code: "leaf", lucide: "leaf", paths: [
      "M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20",
      "M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13"
    ] },
    { code: "paw", lucide: "paw-print", elements: [
      ["circle", { cx: "11", cy: "4", r: "2" }],
      ["circle", { cx: "18", cy: "8", r: "2" }],
      ["circle", { cx: "20", cy: "16", r: "2" }],
      ["path", { d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" }]
    ] },
    { code: "gym", lucide: "dumbbell", paths: [
      "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",
      "m2.5 21.5 1.4-1.4",
      "m20.1 3.9 1.4-1.4",
      "M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",
      "m9.6 14.4 4.8-4.8"
    ] },
    { code: "wait", lucide: "hourglass", paths: [
      "M5 22h14",
      "M5 2h14",
      "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22",
      "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
    ] },
    { code: "lab", lucide: "flask-conical", paths: [
      "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2",
      "M6.453 15h11.094",
      "M8.5 2h7"
    ] },
    { code: "snow", lucide: "snowflake", paths: [
      "m10 20-1.25-2.5L6 18",
      "M10 4 8.75 6.5 6 6",
      "m14 20 1.25-2.5L18 18",
      "m14 4 1.25 2.5L18 6",
      "m17 21-3-6h-4",
      "m17 3-3 6 1.5 3",
      "M2 12h6.5L10 9",
      "m20 10-1.5 2 1.5 2",
      "M22 12h-6.5L14 15",
      "m4 10 1.5 2L4 14",
      "m7 21 3-6-1.5-3",
      "m7 3 3 6h4"
    ] },
    { code: "story", lucide: "scroll-text", paths: [
      "M15 12h-5",
      "M15 8h-5",
      "M19 17V5a2 2 0 0 0-2-2H4",
      "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
    ] },
    { code: "music", lucide: "eighth-notes", elements: [
      ["path", { d: "M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19" }],
      ["circle", { cx: "18", cy: "16", r: "3" }],
      ["circle", { cx: "6", cy: "19", r: "3" }]
    ] },
    { code: "chess", lucide: "chess-knight", paths: [
      "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z",
      "M16.5 18c1-2 2.5-5 2.5-9a7 7 0 0 0-7-7H6.635a1 1 0 0 0-.768 1.64L7 5l-2.32 5.802a2 2 0 0 0 .95 2.526l2.87 1.456",
      "m15 5 1.425-1.425",
      "m17 8 1.53-1.53",
      "M9.713 12.185 7 18"
    ] },
    { code: "food", lucide: "utensils", paths: [
      "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",
      "M7 2v20",
      "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
    ] },
    { code: "gem", lucide: "gem", paths: [
      "M10.5 3 8 9l4 13 4-13-2.5-6",
      "M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z",
      "M2 9h20"
    ] },
    { code: "party", lucide: "party-popper", paths: [
      "M5.8 11.3 2 22l10.7-3.79",
      "M4 3h.01",
      "M22 8h.01",
      "M15 2h.01",
      "M22 20h.01",
      "m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10",
      "m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17",
      "m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7",
      "M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"
    ] },
    { code: "bell", lucide: "bell", paths: [
      "M10.268 21a2 2 0 0 0 3.464 0",
      "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
    ] },
    { code: "zap", lucide: "zap", paths: [
      "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"
    ] },
    { code: "info", lucide: "info", elements: [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 16v-4" }],
      ["path", { d: "M12 8h.01" }]
    ] }
  ].map(icon => Object.freeze({
    ...icon,
    ...(icon.paths
      ? { paths: Object.freeze([...icon.paths]) }
      : { elements: Object.freeze(icon.elements.map(([tag, attrs]) =>
          Object.freeze([tag, Object.freeze({ ...attrs })]))) })
  })));

  const COLORS = Object.freeze([
    { code: "r", value: "#ef4444", nameKey: "colorNameRed" },
    { code: "g", value: "#22c55e", nameKey: "colorNameGreen" },
    { code: "b", value: "#3b82f6", nameKey: "colorNameBlue" },
    { code: "o", value: "#fc8319", nameKey: "colorNameOrange" },
    { code: "y", value: "#fae719", nameKey: "colorNameYellow" },
    { code: "l", value: "#8fe639", nameKey: "colorNameLime" },
    { code: "c", value: "#18cef2", nameKey: "colorNameCyan" },
    { code: "i", value: "#2414cc", nameKey: "colorNameIndigo" },
    { code: "v", value: "#920abf", nameKey: "colorNameViolet" },
    { code: "p", value: "#cc129e", nameKey: "colorNamePurple" },
    { code: "m", value: "#d916d9", nameKey: "colorNameMagenta" },
    { code: "fs",value: "#ff19c6", nameKey: "colorNameFuchsia" },
    { code: "rb",value: "#d90b72", nameKey: "colorNameRaspberry" },
    { code: "br",value: "#995b2e", nameKey: "colorNameBrown" },
    { code: "gr",value: "#808080", nameKey: "colorNameGray" },
    { code: "w", value: "#e6e6e6", nameKey: "colorNameWhite" },
    { code: "t", value: "#429da6", nameKey: "colorNameTeal" },
    { code: "mt",value: "#30f2b2", nameKey: "colorNameMint" },
    { code: "bg",value: "#f2bb6d", nameKey: "colorNameBeige" },
  ].map(color => Object.freeze(color)));

  const iconByCode = new Map(ICONS.map(icon => [icon.code, icon]));
  const colorByCode = new Map(COLORS.map(color => [color.code, color]));

  function createSvg(iconCode, colorCode, size = 18, doc = document) {
    const icon = iconByCode.get(iconCode);
    const color = colorByCode.get(colorCode);
    if (!icon || !color) return null;
    const svg = doc.createElementNS(SVG_NS, "svg");
    for (const [key, value] of Object.entries({
      width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: color.value, "stroke-width": "2", "stroke-linecap": "round",
      "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false"
    })) svg.setAttribute(key, String(value));
    if (icon.paths) {
      // Fast path for path-only icons, including the original star/dev/bk.
      for (const d of icon.paths) {
        const path = doc.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        svg.append(path);
      }
    } else {
      // Some Lucide icons use circles and rectangles as well as paths.
      // Preserve their original SVG child order and attributes.
      for (const [tag, attrs] of icon.elements) {
        const element = doc.createElementNS(SVG_NS, tag);
        for (const [name, value] of Object.entries(attrs)) {
          element.setAttribute(name, value);
        }
        svg.append(element);
      }
    }
    return svg;
  }

  ns.TitleIconCatalog = Object.freeze({
    icons: ICONS, colors: COLORS,
    getIcon: code => iconByCode.get(code) ?? null,
    getColor: code => colorByCode.get(code) ?? null,
    createSvg
  });
})();
