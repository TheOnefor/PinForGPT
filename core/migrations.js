/* Pure data transformations; no DOM and no Chrome APIs. */
(() => {
  "use strict";

  const ns = globalThis.ChatKeeper ??= {};
  const SCHEMA_VERSION = 1;
  const CURRENT_KEY = "chatOrganizerState";
  const LEGACY_KEY = "pinnedChats";

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function validateLegacy(chats) {
    if (!Array.isArray(chats)) {
      throw new Error("Legacy pinnedChats must be an array. No data was changed.");
    }
    for (const [index, chat] of chats.entries()) {
      if (!isRecord(chat) || typeof chat.url !== "string" || !chat.url || typeof chat.title !== "string") {
        throw new Error(`Invalid legacy chat at index ${index}. No data was changed.`);
      }
    }
    return chats;
  }

  function legacyToV1(legacyChats) {
    validateLegacy(legacyChats);
    const items = legacyChats.map(({ url, title }) => ({ type: "chat", url, title }));
    if (items.length !== legacyChats.length) {
      throw new Error("Migration count mismatch. No data was changed.");
    }
    return { schemaVersion: SCHEMA_VERSION, items };
  }

  function validateCurrentState(state) {
    if (!isRecord(state) || !Number.isInteger(state.schemaVersion)) {
      throw new Error("Invalid state or missing schemaVersion. Nothing was overwritten.");
    }
    if (state.schemaVersion > SCHEMA_VERSION) {
      throw new Error(`Data schema ${state.schemaVersion} is newer than supported ${SCHEMA_VERSION}. Nothing was overwritten.`);
    }
    if (state.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(`Unsupported data schema ${state.schemaVersion}. A migration is required.`);
    }
    if (!Array.isArray(state.items)) {
      throw new Error("State.items must be an array.");
    }
    for (const [index, item] of state.items.entries()) {
      if (!isRecord(item) || item.type !== "chat" || typeof item.url !== "string" || !item.url || typeof item.title !== "string") {
        throw new Error(`Invalid item at index ${index}. Nothing was overwritten.`);
      }
    }
    return state;
  }

  // In future versions: migrateV1ToV2(state), migrateV2ToV3(state), ...
  ns.Migrations = Object.freeze({
    SCHEMA_VERSION,
    CURRENT_KEY,
    LEGACY_KEY,
    legacyToV1,
    validateLegacy,
    validateCurrentState
  });
})();
