/* App/controller: translates user intent into Store commands, updates Views from state. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper;
  const adapter = new ns.ChatGPTAdapter();
  const pending = new Set();
  let requested = 0;

  function sendStore(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response?.ok) reject(new Error(response?.error || "Store unavailable"));
        else resolve(response.data);
      });
    });
  }

  function findExisting(state, url) {
    const normalized = ns.normalizeChatUrl(url, "https://chatgpt.com/");
    return state?.items.find(item => item.type === "chat" &&
      ns.normalizeChatUrl(item.url, "https://chatgpt.com/") === normalized);
  }

  async function performChatAction(chat, operation) {
    const canonical = ns.normalizeChatUrl(chat.url, "https://chatgpt.com/");
    if (!canonical) throw new Error("Unrecognized ChatGPT conversation URL");
    if (pending.has(canonical)) return; // Double-click guard.
    pending.add(canonical);
    try {
      // Read the freshest version, so another tab changing the list isn't ignored.
      const state = await sendStore({ type: "store:getState" });
      const existing = findExisting(state, canonical);
      if (operation === "remove" || existing) {
        if (existing) await sendStore({ type: "store:unpin", url: existing.url });
      } else {
        await sendStore({ type: "store:pin", chat: { url: canonical, title: chat.title } });
      }
      await refresh();
      sidebar.clearError();
    } finally {
      pending.delete(canonical);
    }
  }

  const sidebar = new ns.SidebarView({
    onRemove: item => performChatAction(item, "remove")
  });
  const nativeMenu = new ns.NativeMenuView({
    onToggle: chat => performChatAction(chat, "toggle")
  });

  function applyState(state) {
    sidebar.setItems(state.items);
    nativeMenu.setState(state);
  }

  async function refresh() {
    const ticket = ++requested;
    try {
      const state = await sendStore({ type: "store:getState" });
      if (ticket !== requested) return;
      applyState(state);
    } catch (error) {
      console.error("[ChatKeeper] Could not load favorites:", error);
      sidebar.showError(ns.I18n.t("operationFailed"));
      throw error;
    }
  }

  adapter.onSidebarChange(({ point }) => {
    if (point) sidebar.mount(point);
  });
  adapter.onRouteChange(({ url }) => sidebar.setActiveUrl(url));
  adapter.onChatMenuOpen(context => nativeMenu.show(context));
  // Optional metadata enrichment for the popup. No data writes or DOM changes.
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "popup:getCurrentChat") return false;
    sendResponse({ ok: true, chat: adapter.getCurrentChatDetails() });
    return false;
  });

  adapter.start();

  refresh().catch(() => {}); // Error is shown in UI; do not generate unhandled rejection.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.chatOrganizerState) {
      refresh().catch(() => {});
    }
  });
})();
