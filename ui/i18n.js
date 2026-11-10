/* UI copy only: change language or wording here, not in business logic. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper ??= {};
  const DICTIONARY = Object.freeze({
    uk: Object.freeze({
      favorites: "Обрані",
      addFavorite: "Додати в обране",
      removeFavorite: "Прибрати з обраного",
      chatActions: "Дії чату: {title}",
      emptyFavorites: "Тут поки немає чатів",
      operationFailed: "Не вдалося змінити обране. Спробуй ще раз."
    }),
    en: Object.freeze({
      favorites: "Favorites",
      addFavorite: "Add to favorites",
      removeFavorite: "Remove from favorites",
      chatActions: "Chat actions: {title}",
      emptyFavorites: "No favorite chats yet",
      operationFailed: "Could not update favorites. Please try again."
    })
  });
  ns.I18n = Object.freeze({
    language() {
      const code = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
      return Object.hasOwn(DICTIONARY, code) ? code : "en";
    },
    t(key, values = {}) {
      const template = DICTIONARY[this.language()][key] ?? DICTIONARY.en[key] ?? key;
      return template.replace(/\{([a-zA-Z]+)\}/g, (_match, name) => String(values[name] ?? ""));
    }
  });
})();
