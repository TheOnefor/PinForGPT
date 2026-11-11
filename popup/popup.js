/* Popup controller. Uses the same background Store as the content script. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper;
  let state = { items: [] };
  let currentTabChat = null;
  let refreshTicket = 0;

  // Keep this URL check independent of the ChatGPT DOM. It is deliberately
  // small; in a future cleanup we can share the adapter's URL normalizer.
  function normalizeChatUrl(raw) {
    try {
      const url = new URL(raw);
      if (url.origin !== "https://chatgpt.com") return null;
      const path = url.pathname.replace(/\/$/, "");
      if (!/^\/c\/[^/]+$/.test(path) && !/^\/g\/[^/]+\/c\/[^/]+$/.test(path)) return null;
      return `${url.origin}${path}`;
    } catch { return null; }
  }

  function sendStore(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, response => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else if (!response?.ok) reject(new Error(response?.error || "Store unavailable"));
        else resolve(response.data);
      });
    });
  }

  function normalizedItems(items) {
    return (items || []).filter(item => item?.type === "chat")
      .map(item => ({ url: normalizeChatUrl(item.url), title: item.title }))
      .filter(item => item.url && typeof item.title === "string");
  }

  const view = new ns.PopupView({
    onOpen: async chat => {
      await chrome.tabs.create({ url: chat.url });
      window.close();
    },
    onRemove: async chat => {
      // Preserve exact stored URL, e.g. if an older record had a query string.
      const existing = state.items.find(item => normalizeChatUrl(item.url) === chat.url);
      if (existing) await sendStore({ type: "store:unpin", url: existing.url });
      await refresh();
    },
    onAddCurrent: async chat => {
      if (!chat || !normalizeChatUrl(chat.url)) return;
      const existing = state.items.some(item => normalizeChatUrl(item.url) === chat.url);
      if (!existing) await sendStore({ type: "store:pin", chat });
      await refresh();
    }
  });

  async function refresh() {
    const ticket = ++refreshTicket;
    try {
      const next = await sendStore({ type: "store:getState" });
      if (ticket !== refreshTicket) return;
      state = next;
      const items = normalizedItems(next.items);
      view.render({ items, uniqueCount: new Set(items.map(item => item.url)).size });
      view.setCurrent(currentTabChat);
    } catch (error) {
      console.error("[PinForGPT popup] Store failed:", error);
      view.showStatus(ns.I18n.t("popupLoadFailed"), true);
      throw error;
    }
  }

  async function getActiveChat() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = normalizeChatUrl(tab?.url);
    if (!url) return null;

    // The popup works without ChatGPT, but an available content script can
    // provide a more accurate conversation title than the browser tab title.
    let enriched = null;
    if (Number.isInteger(tab.id)) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "popup:getCurrentChat" });
        if (response?.ok && normalizeChatUrl(response.chat?.url) === url) enriched = response.chat;
      } catch { /* e.g. stale tab, disabled content script, or DOM changed */ }
    }
    let title = enriched?.title?.trim() || tab.title?.trim() || "";
    if (!title || title === "ChatGPT" || title === "ChatGPT - OpenAI") {
      title = ns.I18n.t("popupUnknownTitle", { id: url.split("/").at(-1).slice(0, 8) });
    }
    return { url, title };
  }

  async function init() {
    await refresh().catch(() => {});
    try { currentTabChat = await getActiveChat(); }
    catch (error) { console.warn("[PinForGPT popup] Could not inspect active tab:", error); }
    view.setCurrent(currentTabChat);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.chatOrganizerState) refresh().catch(() => {});
  });

  init();
})();
