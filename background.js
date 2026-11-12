/* MV3 service worker: one writer for content scripts and popup pages. */
importScripts("core/migrations.js", "core/backup.js", "core/store.js");

const store = new globalThis.ChatKeeper.Store(chrome.storage.local);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string" || !message.type.startsWith("store:")) {
    return false;
  }

  const actions = {
    "store:getState": () => store.getState(),
    "store:pin": () => store.pin(message.chat),
    "store:unpin": () => store.unpin(message.url),
    "store:updateTitle": () => store.updateTitle(message.url, message.title),
    "store:importBackup": () => store.importBackup(message.backup, message.mode)
  };
  if (!Object.prototype.hasOwnProperty.call(actions, message.type)) {
    sendResponse({ ok: false, error: "Unknown store command" });
    return false;
  }

  Promise.resolve()
    .then(actions[message.type])
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      console.error("[ChatKeeper] Store operation failed:", error);
      sendResponse({ ok: false, error: error.message });
    });
  return true;
});
