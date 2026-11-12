/* Portable, human-editable backup format. Conversion only; no storage writes. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const FORMAT = "PinForGPTBackup";
  const BACKUP_VERSION = 1;
  const SUPPORTED_SCHEMA = 1;
  const MAX_ITEMS = 50000;

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  // Must NOT depend on ChatGPTAdapter, which is a content script, not a worker.
  // Identity is the normalized URL, never an index or an imported internal ID.
  function normalizeChatUrl(raw) {
    if (typeof raw !== "string") return null;
    try {
      const url = new URL(raw);
      if (url.origin !== "https://chatgpt.com" || url.username || url.password) return null;
      const path = url.pathname.replace(/\/$/, "");
      if (!/^\/c\/[^/]+$/.test(path) && !/^\/g\/[^/]+\/c\/[^/]+$/.test(path)) return null;
      return `${url.origin}${path}`;
    } catch { return null; }
  }

  function create(state, extensionVersion, exportedAt = new Date()) {
    if (!state || state.schemaVersion !== SUPPORTED_SCHEMA || !Array.isArray(state.items)) {
      throw new Error("Unsupported or invalid data schema for backup export.");
    }
    if (typeof extensionVersion !== "string" || !extensionVersion) {
      throw new Error("Missing extension version.");
    }
    const items = state.items.map((item, index) => {
      if (!item || item.type !== "chat" || typeof item.title !== "string" ||
          typeof item.url !== "string" || !item.url) {
        throw new Error(`Invalid chat at position ${index + 1}. No backup was created.`);
      }
      return { type: "chat", title: item.title, url: item.url };
    });
    return {
      format: FORMAT,
      backupVersion: BACKUP_VERSION,
      extensionVersion,
      schemaVersion: state.schemaVersion,
      exportedAt: exportedAt.toISOString(),
      items
    };
  }

  function stringify(backup) {
    return `${JSON.stringify(backup, null, 2)}\n`;
  }

  // Supports both current human-readable backups and old pinnedChats exports.
  // Rejects any unknown/newer format instead of silently dropping information.
  function parse(source) {
    let items;
    let legacy = false;
    if (Array.isArray(source)) {
      items = source;
      legacy = true;
    } else if (isRecord(source) && source.format === FORMAT) {
      if (source.backupVersion !== BACKUP_VERSION || source.schemaVersion !== SUPPORTED_SCHEMA) {
        throw new Error("Unsupported backup or data schema version. Nothing was changed.");
      }
      if (typeof source.extensionVersion !== "string" ||
          typeof source.exportedAt !== "string" || !Array.isArray(source.items)) {
        throw new Error("Incomplete PinForGPT backup. Nothing was changed.");
      }
      items = source.items;
    } else if (isRecord(source) && !Object.hasOwn(source, "format") && Array.isArray(source.pinnedChats)) {
      items = source.pinnedChats;
      legacy = true;
    } else {
      throw new Error("Unrecognized backup format. Nothing was changed.");
    }

    if (items.length > MAX_ITEMS) throw new Error("Too many chat records in backup.");
    const chats = [];
    const seen = new Set();
    let duplicatesInFile = 0;
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (!isRecord(item) || (!legacy && item.type !== "chat") ||
          typeof item.title !== "string" || typeof item.url !== "string") {
        throw new Error(`Invalid chat at item ${index + 1}. Nothing was changed.`);
      }
      const url = normalizeChatUrl(item.url);
      if (!url) throw new Error(`Invalid ChatGPT URL at item ${index + 1}. Nothing was changed.`);
      if (seen.has(url)) {
        duplicatesInFile++;
        continue;
      }
      seen.add(url);
      chats.push({ type: "chat", url, title: item.title });
    }
    return { chats, duplicatesInFile, sourceCount: items.length };
  }

  ns.Backup = Object.freeze({ FORMAT, BACKUP_VERSION, create, stringify, parse, normalizeChatUrl });
})();
