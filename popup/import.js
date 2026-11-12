/* Dedicated import page: file selection, confirmation and results. Store is the only writer. */
(() => {
  "use strict";
  const ns = globalThis.ChatKeeper;
  const t = (key, values) => ns.I18n.t(key, values);
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const el = id => document.getElementById(id);
  let candidate = null;
  let parsed = null;
  let working = false;

  document.documentElement.lang = ns.I18n.language();
  el("version").textContent = `v${chrome.runtime.getManifest().version}`;
  const strings = {
    title: "importPageTitle",
    description: "importPageDescription",
    "drop-title": "importDropTitle",
    choose: "importChooseFile",
    "merge-label": "importMerge",
    "replace-label": "importReplace",
    "replace-warning": "importWarning",
    submit: "importConfirmButton",
    again: "importBackToSelection",
    "success-note": "importCloseTabHint"
  };
  for (const [id, key] of Object.entries(strings)) el(id).textContent = t(key);
  document.title = `PinForGPT — ${t("importPageTitle")}`;

  function sendStore(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, response => {
        const lastError = chrome.runtime.lastError;
        if (lastError) reject(new Error(lastError.message));
        else if (!response?.ok) reject(new Error(response?.error || "Store unavailable"));
        else resolve(response.data);
      });
    });
  }

  function feedback(text, error = false) {
    el("feedback").textContent = text;
    el("feedback").hidden = !text;
    el("feedback").classList.toggle("error", error);
  }

  function reset() {
    candidate = null;
    parsed = null;
    el("file-input").value = "";
    el("selection").hidden = true;
    el("again").hidden = true;
    el("dropzone").hidden = false;
    el("submit").disabled = false;
    el("submit").textContent = t("importConfirmButton");
    document.querySelector('input[name="mode"][value="merge"]').checked = true;
    updateWarning();
    feedback("");
    el("success-note").hidden = true;
  }

  function updateWarning() {
    el("replace-warning").hidden = document.querySelector('input[name="mode"]:checked')?.value !== "replace";
  }

  for (const radio of document.querySelectorAll('input[name="mode"]')) {
    radio.addEventListener("change", updateWarning);
  }
  el("again").addEventListener("click", reset);
  el("choose").addEventListener("click", () => el("file-input").click());
  el("file-input").addEventListener("change", event => loadFiles(event.target.files));

  async function loadFiles(files) {
    if (working || !files || files.length === 0) return;
    candidate = null;
    parsed = null;
    el("selection").hidden = true;
    el("again").hidden = true;
    el("success-note").hidden = true;
    feedback("");
    if (files.length !== 1) { feedback(t("importOnlyOne"), true); return; }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".json")) {
      feedback(t("importInvalidType"), true);
      return;
    }
    if (file.size > MAX_FILE_SIZE) { feedback(t("importTooLarge"), true); return; }
    working = true;
    try {
      const raw = JSON.parse(await file.text());
      const preview = ns.Backup.parse(raw);
      const state = await sendStore({ type: "store:getState" });
      candidate = raw;
      parsed = preview;
      el("filename").textContent = t("importSelected", { name: file.name });
      el("summary").textContent = t("importFileSummary", {
        count: preview.chats.length,
        duplicates: preview.duplicatesInFile,
        current: state.items.length
      });
      el("selection").hidden = false;
      updateWarning();
    } catch (error) {
      feedback(t("importBadFile", { reason: error.message }), true);
    } finally {
      working = false;
    }
  }

  const dropzone = el("dropzone");
  for (const name of ["dragenter", "dragover"]) {
    dropzone.addEventListener(name, event => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  }
  for (const name of ["dragleave", "drop"]) {
    dropzone.addEventListener(name, event => {
      event.preventDefault();
      dropzone.classList.remove("is-dragover");
    });
  }
  dropzone.addEventListener("drop", event => loadFiles(event.dataTransfer?.files));
  // Prevent the browser from navigating to a dropped JSON file outside our drop zone.
  window.addEventListener("dragover", event => {
    if ([...event.dataTransfer?.items || []].some(item => item.kind === "file")) event.preventDefault();
  });
  window.addEventListener("drop", event => {
    if ([...event.dataTransfer?.items || []].some(item => item.kind === "file")) event.preventDefault();
  });

  el("submit").addEventListener("click", async () => {
    if (working || !candidate || !parsed) { feedback(t("importNoFile"), true); return; }
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    if (mode !== "merge" && mode !== "replace") return;
    working = true;
    el("submit").disabled = true;
    try {
      // Read latest state before asking for confirmation. Background rechecks during write.
      const current = await sendStore({ type: "store:getState" });
      const prompt = mode === "replace"
        ? t("importConfirmReplace", { current: current.items.length, incoming: parsed.chats.length })
        : t("importConfirmMerge");
      if (!window.confirm(prompt)) return;
      const report = await sendStore({ type: "store:importBackup", backup: candidate, mode });
      feedback(mode === "replace"
        ? t("importResultReplace", {
          previous: report.before, total: report.after, duplicates: report.duplicatesInFile
        })
        : t("importResultMerge", {
          added: report.added, existing: report.alreadyExisting,
          duplicates: report.duplicatesInFile, total: report.after
        }));
      candidate = null;
      parsed = null;
      el("selection").hidden = true;
      el("dropzone").hidden = true;
      el("again").hidden = false;
      el("success-note").hidden = false;
    } catch (error) {
      console.error("[PinForGPT import] Import failed:", error);
      feedback(t("importFailed", { reason: error.message }), true);
    } finally {
      working = false;
      el("submit").disabled = false;
    }
  });
})();
