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
      operationFailed: "Не вдалося змінити обране. Спробуй ще раз.",
      popupFavorites: "Обрані",
      popupBackups: "Копії",
      popupIcons: "Іконки",
      popupUniqueCount: "Унікальних чатів: {count}",
      popupAddCurrent: "Додати поточний чат",
      popupAlreadyFavorite: "Поточний чат уже в обраному",
      popupNoCurrentChat: "Відкрий розмову ChatGPT, щоб додати її",
      popupCurrentLoading: "Визначаємо поточний чат…",
      popupOpenChat: "Відкрити чат: {title}",
      popupBackupsTitle: "Резервні копії",
      popupBackupsPlaceholder: "Експорт та імпорт JSON додамо наступним кроком версії 1.2.",
      popupIconsTitle: "Іконки та кольори",
      popupIconsPlaceholder: "Каталог кодів з’явиться у версії 1.3.",
      popupNoFavorites: "Тут ще немає обраних чатів",
      popupAddSuccess: "Чат додано в обране",
      popupRemoveSuccess: "Чат прибрано з обраного",
      popupLoadFailed: "Не вдалося завантажити обрані чати",
      popupOpenFailed: "Не вдалося відкрити чат",
      popupCloseNotification: "Закрити повідомлення",
      popupUnknownTitle: "Чат {id}"
    }),
    en: Object.freeze({
      favorites: "Favorites",
      addFavorite: "Add to favorites",
      removeFavorite: "Remove from favorites",
      chatActions: "Chat actions: {title}",
      emptyFavorites: "No favorite chats yet",
      operationFailed: "Could not update favorites. Please try again.",
      popupFavorites: "Favorites",
      popupBackups: "Backups",
      popupIcons: "Icons",
      popupUniqueCount: "Unique chats: {count}",
      popupAddCurrent: "Add current chat",
      popupAlreadyFavorite: "Current chat is already a favorite",
      popupNoCurrentChat: "Open a ChatGPT conversation to add it",
      popupCurrentLoading: "Checking the current chat…",
      popupOpenChat: "Open chat: {title}",
      popupBackupsTitle: "Backups",
      popupBackupsPlaceholder: "JSON export and import are coming in the next step of version 1.2.",
      popupIconsTitle: "Icons and colors",
      popupIconsPlaceholder: "The code catalog is coming in version 1.3.",
      popupNoFavorites: "No favorite chats yet",
      popupAddSuccess: "Chat added to favorites",
      popupRemoveSuccess: "Chat removed from favorites",
      popupLoadFailed: "Could not load favorites",
      popupOpenFailed: "Could not open this chat",
      popupCloseNotification: "Close notification",
      popupUnknownTitle: "Chat {id}"
    })
  });
  ns.I18n = Object.freeze({
    language() {
      const code = (document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase();
      return Object.hasOwn(DICTIONARY, code) ? code : "en";
    },
    t(key, values = {}) {
      const template = DICTIONARY[this.language()][key] ?? DICTIONARY.en[key] ?? key;
      return template.replace(/\{([a-zA-Z]+)\}/g, (_match, name) => String(values[name] ?? ""));
    }
  });
})();
