(() => {
  if (window.__storelabPursuitRuntime) return;
  window.__storelabPursuitRuntime = true;

  const state = { draft: null };
  const stages = [
    "Found",
    "Message Drafted",
    "Connection Sent",
    "Connected",
    "Follow-up Sent",
    "Replied",
    "Demo Proposed",
    "Demo Accepted",
    "Email / Time Requested",
    "Email Captured",
    "Email Sent",
    "Calendar Sent",
    "Demo Booked",
    "Gone Quiet",
    "Parked",
    "Not Relevant",
  ];

  function escapeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showError(message) {
    const error = document.querySelector("[data-pursuit-error]");
    if (!error) return;
    error.textContent = message;
    error.classList.remove("hidden");
  }

  function clearError() {
    const error = document.querySelector("[data-pursuit-error]");
    if (!error) return;
    error.textContent = "";
    error.classList.add("hidden");
  }

  function setReviewBusy(isBusy) {
    const button = document.querySelector("[data-pursuit-review]");
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? "Reading..." : "Review";
  }

  function renderPreview(analysis) {
    state.draft = analysis;
    const target = document.querySelector("[data-pursuit-preview]");
    if (!target) return;

    const personName = `${analysis.person?.firstName || ""} ${analysis.person?.lastName || ""}`.trim() || "New person";
    const options = stages
      .map((stage) => `<option ${stage === analysis.stage ? "selected" : ""}>${stage}</option>`)
      .join("");

    target.innerHTML = `
      <div class="mt-5 border border-white/10 bg-black/25 p-4 sm:p-5" data-pursuit-preview-card>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">Review before saving</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-white">${escapeText(personName)} at ${escapeText(analysis.business?.name || "new company")}</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">${escapeText(analysis.whatChanged)}</p>
          </div>
          <button type="button" data-pursuit-ignore class="border border-white/10 px-4 py-2 text-sm text-slate-500 hover:border-white/25 hover:text-white">Ignore</button>
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">First name</span><input data-draft="person.firstName" value="${escapeText(analysis.person?.firstName)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Last name</span><input data-draft="person.lastName" value="${escapeText(analysis.person?.lastName)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Role</span><input data-draft="person.role" value="${escapeText(analysis.person?.role)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Company</span><input data-draft="business.name" value="${escapeText(analysis.business?.name)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Stage</span><select data-draft="stage" class="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60">${options}</select></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">StoreLab angle</span><input data-draft="storeLabAngle" value="${escapeText(analysis.storeLabAngle)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block md:col-span-2"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Next action</span><textarea data-draft="nextAction" rows="2" class="mt-2 w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/60">${escapeText(analysis.nextAction)}</textarea></label>
          <label class="block md:col-span-2"><span class="text-xs font-medium uppercase tracking-[0.14em] text-cyan-300">Suggested message</span><textarea data-draft="suggestedMessage" rows="3" class="mt-2 w-full resize-none border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/60">${escapeText(analysis.suggestedMessage)}</textarea></label>
        </div>

        <div class="mt-5 flex justify-end">
          <button type="button" data-pursuit-save class="border border-cyan-300 bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-200">Save to memory</button>
        </div>
      </div>
    `;
  }

  function applyDraftInputs() {
    document.querySelectorAll("[data-draft]").forEach((input) => {
      const path = input.getAttribute("data-draft");
      const value = input.value;
      if (!state.draft || !path) return;
      if (path === "person.firstName") state.draft.person.firstName = value;
      if (path === "person.lastName") state.draft.person.lastName = value;
      if (path === "person.role") state.draft.person.role = value;
      if (path === "business.name") state.draft.business.name = value;
      if (path === "stage") state.draft.stage = value;
      if (path === "storeLabAngle") state.draft.storeLabAngle = value;
      if (path === "nextAction") state.draft.nextAction = value;
      if (path === "suggestedMessage") state.draft.suggestedMessage = value;
    });
  }

  async function review() {
    clearError();
    const note = document.querySelector("[data-pursuit-note]");
    const value = note?.value?.trim() || "";
    if (!value) {
      showError("Type what happened on LinkedIn first.");
      return;
    }

    setReviewBusy(true);
    try {
      const response = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Could not read that note.");
      renderPreview(body);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not read that note.");
    } finally {
      setReviewBusy(false);
    }
  }

  async function save() {
    clearError();
    if (!state.draft) return;
    applyDraftInputs();
    const button = document.querySelector("[data-pursuit-save]");
    if (button) {
      button.disabled = true;
      button.textContent = "Saving...";
    }

    try {
      const response = await fetch("/api/pursuits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: state.draft }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not save this pursuit.");
      window.location.reload();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save this pursuit.");
      if (button) {
        button.disabled = false;
        button.textContent = "Save to memory";
      }
    }
  }

  function entryError(card, message) {
    const error = card.querySelector("[data-entry-error]");
    if (!error) return;
    error.textContent = message || "";
    error.classList.toggle("hidden", !message);
  }

  function entryValue(card, name) {
    const field = card.querySelector("[data-entry-field=\"" + name + "\"]");
    return field?.value?.trim() || "";
  }

  async function saveEntry(button) {
    const card = button.closest("[data-entry-card]");
    if (!card) return;

    const pursuitId = card.getAttribute("data-pursuit-id");
    const action = button.getAttribute("data-entry-action");
    if (!pursuitId || !action) return;

    entryError(card, "");
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const stage = entryValue(card, "stage");
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: action === "save" ? undefined : action,
          currentStage: stage || card.getAttribute("data-current-stage"),
          person: {
            firstName: entryValue(card, "firstName"),
            lastName: entryValue(card, "lastName"),
            role: entryValue(card, "role"),
            email: entryValue(card, "email"),
          },
          business: {
            name: entryValue(card, "businessName"),
          },
          stage,
          storeLabAngle: entryValue(card, "storeLabAngle"),
          currentStatus: entryValue(card, "currentStatus"),
          nextAction: entryValue(card, "nextAction"),
          note: action === "save" ? "Edited pursuit details." : action === "park" ? "Skipped for now." : "Marked " + action + ".",
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update this entry.");
      window.location.reload();
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not update this entry.");
      button.disabled = false;
      button.textContent = previousText;
    }
  }
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const example = target.closest("[data-pursuit-example]");
    if (example) {
      const note = document.querySelector("[data-pursuit-note]");
      if (note) note.value = example.getAttribute("data-pursuit-example") || "";
      return;
    }

    if (target.closest("[data-pursuit-review]")) {
      event.preventDefault();
      review();
      return;
    }

    if (target.closest("[data-pursuit-ignore]")) {
      const preview = document.querySelector("[data-pursuit-preview]");
      if (preview) preview.innerHTML = "";
      state.draft = null;
      return;
    }

    if (target.closest("[data-pursuit-save]")) {
      event.preventDefault();
      save();
      return;
    }

    const entryAction = target.closest("[data-entry-action]");
    if (entryAction) {
      event.preventDefault();
      saveEntry(entryAction);
    }
  });
})();




