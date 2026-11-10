/* The only component that writes application data to chrome.storage.local. */
(() => {
  "use strict";

  const ns = globalThis.ChatKeeper ??= {};
  const { CURRENT_KEY, LEGACY_KEY, legacyToV1, validateCurrentState } = ns.Migrations;

  const clone = (value) => structuredClone(value);
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  class Store {
    #area;
    #ready = null;
    #state = null;
    #writeQueue = Promise.resolve();

    constructor(storageArea) {
      this.#area = storageArea;
    }

    async init() {
      if (this.#ready) return this.#ready;
      this.#ready = this.#load().catch((error) => {
        this.#ready = null; // Allow retry after fixing corrupt data.
        throw error;
      });
      return this.#ready;
    }

    async #load() {
      const data = await this.#area.get([CURRENT_KEY, LEGACY_KEY]);

      if (has(data, CURRENT_KEY)) {
        validateCurrentState(data[CURRENT_KEY]);
        this.#state = clone(data[CURRENT_KEY]);
        return;
      }

      if (has(data, LEGACY_KEY)) {
        const converted = legacyToV1(data[LEGACY_KEY]);
        validateCurrentState(converted);
        // Never write to or remove LEGACY_KEY. The original array stays intact.
        await this.#area.set({ [CURRENT_KEY]: converted });
        this.#state = clone(converted);
        return;
      }

      // Fresh install: keep an empty in-memory state, no unnecessary storage write.
      this.#state = { schemaVersion: ns.Migrations.SCHEMA_VERSION, items: [] };
    }

    async getState() {
      await this.init();
      return clone(this.#state); // No writable reference to internal state escapes.
    }

    #mutate(change) {
      const operation = this.#writeQueue.then(async () => {
        await this.init();
        const next = clone(this.#state);
        const changed = change(next);
        if (!changed) return clone(this.#state);
        validateCurrentState(next);
        await this.#area.set({ [CURRENT_KEY]: next });
        this.#state = next;
        return clone(this.#state);
      });

      // A rejected mutation must not permanently block all future operations.
      this.#writeQueue = operation.catch(() => {});
      return operation;
    }

    async pin({ url, title }) {
      return this.#mutate((state) => {
        if (typeof url !== "string" || !url || typeof title !== "string") {
          throw new Error("pin requires a non-empty url and a string title.");
        }
        if (state.items.some((item) => item.url === url)) return false;
        state.items.push({ type: "chat", url, title });
        return true;
      });
    }

    async unpin(url) {
      return this.#mutate((state) => {
        const index = state.items.findIndex((item) => item.url === url);
        if (index < 0) return false;
        state.items.splice(index, 1);
        return true;
      });
    }

    async updateTitle(url, title) {
      return this.#mutate((state) => {
        if (typeof title !== "string") throw new Error("title must be a string");
        const item = state.items.find((item) => item.url === url);
        if (!item || item.title === title) return false;
        item.title = title;
        return true;
      });
    }
  }

  ns.Store = Store;
})();
