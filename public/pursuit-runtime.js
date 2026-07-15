(() => {
  if (window.__storelabPursuitRuntime) return;
  window.__storelabPursuitRuntime = true;

  const defaults = {
    name: "Joe Blogs",
    business: "7Eleven Australia",
    role: "Marketing Mgr",
    location: "",
    email: "",
    demoType: "Teams",
  };

  const labels = {
    name: "Name",
    business: "Business",
    role: "Role",
    location: "Location",
    email: "Email",
    demoType: "Demo type",
  };

  const actions = {
    found: {
      label: "Found",
      stage: "Message Drafted",
      fields: ["name", "business", "role", "location"],
      needsMessage: true,
      messageLabel: "LinkedIn connection request",
      nextAction: "Review the suggested connection message, then send the LinkedIn request.",
      sentence: (fields) => {
        const location = fields.location ? " in " + fields.location : "";
        return 'Found "' + fields.name + '" from "' + fields.business + '" with role "' + fields.role + '"' + location + ". Message needed.";
      },
    },
    "request-sent": {
      label: "Request sent",
      stage: "Connection Sent",
      fields: ["name"],
      nextAction: "Wait for the connection request to be accepted.",
      sentence: (fields) => 'Connection request sent to "' + fields.name + '" with message.',
    },
    connected: {
      label: "Connected",
      stage: "Connected",
      fields: ["name"],
      needsMessage: true,
      messageLabel: "First warm follow-up",
      nextAction: "Send a warm follow-up and decide whether to softly mention StoreLab.",
      sentence: (fields) => 'Connection accepted with "' + fields.name + '". Follow-up message needed.',
    },
    "demo-proposed": {
      label: "Demo proposed",
      stage: "Demo Proposed",
      fields: ["name", "business"],
      needsMessage: true,
      messageLabel: "Demo suggestion",
      nextAction: "Wait for their reply to the demo suggestion.",
      sentence: (fields) => 'Follow-up message sent to "' + fields.name + '" from "' + fields.business + '" with demo proposed.',
    },
    "demo-accepted": {
      label: "Demo accepted",
      stage: "Demo Accepted",
      fields: ["name"],
      needsMessage: true,
      messageLabel: "Ask for email / next step",
      nextAction: "Ask for their email address and say you will lock in time by email.",
      sentence: (fields) => 'Demo accepted by "' + fields.name + '". Message needed to confirm email address and advise we will lock in time and date via email.',
    },
    "email-received": {
      label: "Email received",
      stage: "Email Captured",
      fields: ["name", "email"],
      nextAction: "Send an email to confirm the demo day, time, and format.",
      sentence: (fields) => '"' + fields.name + '" replied on LinkedIn with their email address "' + fields.email + '".',
    },
    "email-sent": {
      label: "Email sent",
      stage: "Email Sent",
      fields: ["name", "demoType"],
      needsMessage: true,
      messageLabel: "Email body",
      nextAction: "Send the calendar booking once the time is agreed.",
      sentence: (fields) => 'Email sent to "' + fields.name + '" to confirm day and time for "' + fields.demoType + '" demo.',
    },
    "calendar-sent": {
      label: "Calendar sent",
      stage: "Calendar Sent",
      fields: ["name", "demoType"],
      nextAction: "Wait for the calendar booking to be accepted.",
      sentence: (fields) => 'Calendar booking for "' + fields.demoType + '" sent to "' + fields.name + '".',
    },
    booked: {
      label: "Booked",
      stage: "Demo Booked",
      fields: ["name"],
      nextAction: "Prepare the StoreLab demo brief and best angle.",
      sentence: (fields) => 'Calendar booking accepted by "' + fields.name + '" and demo is locked in.',
    },
    parked: {
      label: "Parked",
      stage: "Parked",
      fields: ["name"],
      nextAction: "Leave parked until a stronger signal appears.",
      sentence: (fields) => '"' + fields.name + '" parked for now.',
    },
  };

  const captureState = {
    actionId: "found",
    fields: { ...defaults },
    draftMode: "ai",
    roughDraft: "",
    selectedMessage: "",
    draft: null,
  };

  function escapeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function splitFullName(value) {
    const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" "),
    };
  }

  function currentAction() {
    return actions[captureState.actionId] || actions.found;
  }

  function messageOptions(action, fields) {
    const firstName = (fields.name || "there").trim().split(/\s+/)[0] || "there";
    const business = fields.business || "your team";
    const role = fields.role ? " in your " + fields.role + " role" : "";
    const roughDraft = captureState.roughDraft.trim();

    if (captureState.draftMode === "improve" && roughDraft) {
      return [
        roughDraft + "\n\nA cleaner version: Hi " + firstName + ", thought it would be good to connect. I am interested in how " + business + " is thinking about shopper engagement and retail execution, and your role" + role + " looked relevant.",
        "Hi " + firstName + ", I noticed your work with " + business + role + ". Thought it would be useful to connect and keep in touch around shopper engagement and retail growth.",
        "Hi " + firstName + ", your work at " + business + " caught my eye. I would enjoy connecting and learning more about what you are focused on at the moment.",
      ];
    }

    if (captureState.actionId === "found") {
      return [
        "Hi " + firstName + ", noticed your work at " + business + role + ". I am always interested in how retail and brand teams are thinking about shopper engagement, so thought it would be good to connect.",
        "Hi " + firstName + ", came across your profile and your role at " + business + " looked relevant to the work we do with StoreLab. Thought it would be good to connect.",
        "Hi " + firstName + ", I saw your background at " + business + " and thought it would be useful to connect. I work around retail growth, shopper engagement and demo execution through StoreLab.",
      ];
    }

    if (captureState.actionId === "connected") {
      return [
        "Thanks for connecting " + firstName + ". Keen to keep in touch and hear what you are focused on at " + business + ".",
        "Thanks for connecting " + firstName + ". I work with retail and brand teams through StoreLab, so thought it would be good to stay connected.",
        "Thanks " + firstName + ", appreciate the connection. If shopper engagement or retail execution is ever a focus, happy to share what we are seeing through StoreLab.",
      ];
    }

    if (captureState.actionId === "demo-proposed") {
      return [
        "Hi " + firstName + ", if useful I would be happy to show you a quick StoreLab demo. It might be relevant to how " + business + " is thinking about shopper engagement and retail activity.",
        "Hi " + firstName + ", would a short StoreLab demo be useful? I can keep it practical and focused on what might matter for " + business + ".",
        "Hi " + firstName + ", I think there may be a useful StoreLab angle for " + business + ". Would you be open to a short demo sometime?",
      ];
    }

    if (captureState.actionId === "demo-accepted") {
      return [
        "Great, thanks " + firstName + ". What is the best email address for you? I will send through a couple of times and we can lock in either Teams or onsite at Pymble.",
        "Perfect, thanks " + firstName + ". If you send me your email address I will follow up there and lock in the best time for the StoreLab demo.",
        "Great " + firstName + ". Send me the best email for you and I will organise the next step properly from there.",
      ];
    }

    if (captureState.actionId === "email-sent") {
      return [
        "Hi " + firstName + ", thanks for agreeing to take a look at StoreLab. I have sent through a calendar invite for a " + (fields.demoType || "Teams") + " demo. Looking forward to showing you what we are doing.",
        "Hi " + firstName + ", just confirming I have sent through the StoreLab demo details. Happy to tailor the session around what is most relevant for you.",
        "Hi " + firstName + ", calendar invite is on its way. I will keep the StoreLab demo practical and focused on where it could help your team.",
      ];
    }

    return ["Hi " + firstName + ", thought it would be good to follow up on StoreLab."];
  }

  function sentence() {
    return currentAction().sentence(captureState.fields);
  }

  function renderSmartFields() {
    const container = document.querySelector("[data-smart-fields]");
    if (!container) return;
    container.innerHTML = currentAction().fields.map((field) => `
      <label class="block">
        <span class="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">${escapeText(labels[field])}</span>
        <input data-smart-field="${field}" value="${escapeText(captureState.fields[field] || "")}" placeholder="${escapeText(labels[field])}" class="mt-1 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60" />
      </label>
    `).join("");
  }

  function renderSentence() {
    const target = document.querySelector("[data-sentence-preview]");
    if (target) target.textContent = sentence();
  }

  function renderMessageCoach() {
    const target = document.querySelector("[data-message-coach]");
    if (!target) return;
    const action = currentAction();
    if (!action.needsMessage) {
      target.innerHTML = "";
      target.classList.add("hidden");
      return;
    }

    target.classList.remove("hidden");
    const options = messageOptions(action, captureState.fields);
    const selected = captureState.selectedMessage || options[0] || "";
    target.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-300">Message Coach</p>
          <p class="mt-1 text-sm text-slate-400">${escapeText(action.messageLabel || "Message")}</p>
        </div>
        <div class="grid grid-cols-2 border border-white/10 text-xs">
          <button type="button" data-draft-mode="ai" class="px-3 py-2 ${captureState.draftMode === "ai" ? "bg-cyan-300 text-black" : "text-slate-300"}">AI writes it</button>
          <button type="button" data-draft-mode="improve" class="px-3 py-2 ${captureState.draftMode === "improve" ? "bg-cyan-300 text-black" : "text-slate-300"}">Improve draft</button>
        </div>
      </div>
      ${captureState.draftMode === "improve" ? `<textarea data-rough-draft rows="2" placeholder="Type your rough attempt here..." class="mt-3 w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60">${escapeText(captureState.roughDraft)}</textarea>` : ""}
      <div class="mt-3 space-y-2">
        ${options.map((message) => `
          <div class="border p-3 ${message === selected ? "border-cyan-300/50 bg-cyan-300/[0.06]" : "border-white/10 bg-black/20"}">
            <p class="text-sm leading-6 text-slate-100">${escapeText(message)}</p>
            <div class="mt-2 flex gap-2">
              <button type="button" data-use-message="${escapeText(message)}" class="border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/50">Use</button>
              <button type="button" data-copy-message="${escapeText(message)}" class="border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/50">Copy</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderCapture() {
    renderSmartFields();
    renderSentence();
    renderMessageCoach();
  }

  function showError(message) {
    const error = document.querySelector("[data-pursuit-error]");
    if (!error) return;
    error.textContent = message;
    error.classList.toggle("hidden", !message);
  }

  function setReviewBusy(isBusy) {
    const button = document.querySelector("[data-capture-review]");
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? "Reviewing..." : "Review with AI";
  }

  function applyDraftInputs() {
    document.querySelectorAll("[data-draft]").forEach((input) => {
      const path = input.getAttribute("data-draft");
      if (!captureState.draft || !path) return;
      if (path === "person.firstName") captureState.draft.person.firstName = input.value;
      if (path === "person.lastName") captureState.draft.person.lastName = input.value;
      if (path === "person.role") captureState.draft.person.role = input.value;
      if (path === "business.name") captureState.draft.business.name = input.value;
      if (path === "stage") captureState.draft.stage = input.value;
      if (path === "storeLabAngle") captureState.draft.storeLabAngle = input.value;
      if (path === "nextAction") captureState.draft.nextAction = input.value;
      if (path === "suggestedMessage") captureState.draft.suggestedMessage = input.value;
    });
  }

  function renderPreview(analysis) {
    captureState.draft = analysis;
    const target = document.querySelector("[data-pursuit-preview]");
    if (!target) return;
    const name = ((analysis.person?.firstName || "") + " " + (analysis.person?.lastName || "")).trim() || "New person";
    target.innerHTML = `
      <div class="mt-5 border border-white/10 bg-black/25 p-4 sm:p-5" data-pursuit-preview-card>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">AI Review</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-white">${escapeText(name)} at ${escapeText(analysis.business?.name || "new company")}</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">${escapeText(analysis.whatChanged || analysis.currentStatus || "")}</p>
          </div>
          <button type="button" data-pursuit-ignore class="border border-white/10 px-4 py-2 text-sm text-slate-500 hover:border-white/25 hover:text-white">Ignore</button>
        </div>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">First name</span><input data-draft="person.firstName" value="${escapeText(analysis.person?.firstName)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Last name</span><input data-draft="person.lastName" value="${escapeText(analysis.person?.lastName)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Role</span><input data-draft="person.role" value="${escapeText(analysis.person?.role)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Company</span><input data-draft="business.name" value="${escapeText(analysis.business?.name)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Stage</span><select data-draft="stage" class="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60"><option>${escapeText(analysis.stage)}</option></select></label>
          <label class="block"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">StoreLab angle</span><input data-draft="storeLabAngle" value="${escapeText(analysis.storeLabAngle)}" class="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" /></label>
          <label class="block md:col-span-2"><span class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Next action</span><textarea data-draft="nextAction" rows="2" class="mt-2 w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/60">${escapeText(analysis.nextAction)}</textarea></label>
          <label class="block md:col-span-2"><span class="text-xs font-medium uppercase tracking-[0.14em] text-cyan-300">Message</span><textarea data-draft="suggestedMessage" rows="3" class="mt-2 w-full resize-none border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/60">${escapeText(analysis.suggestedMessage)}</textarea></label>
        </div>
        <div class="mt-5 flex justify-end">
          <button type="button" data-pursuit-save class="border border-cyan-300 bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-200">Approve and save</button>
        </div>
      </div>
    `;
  }

  async function reviewCapture() {
    showError("");
    const action = currentAction();
    if (!captureState.fields.name.trim()) {
      showError("Add the person name first.");
      return;
    }

    setReviewBusy(true);
    try {
      const messages = messageOptions(action, captureState.fields);
      const message = captureState.selectedMessage || messages[0] || "";
      const note = action.needsMessage && message ? sentence() + "\nMessage to use: " + message : sentence();
      const response = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not review this capture.");
      const name = splitFullName(captureState.fields.name);
      const analysis = {
        ...body,
        originalNote: note,
        person: {
          ...body.person,
          firstName: name.firstName || body.person?.firstName || "",
          lastName: name.lastName || body.person?.lastName || "",
          role: captureState.fields.role || body.person?.role || "",
        },
        business: {
          ...body.business,
          name: captureState.fields.business || body.business?.name || "",
        },
        stage: action.stage,
        currentStatus: sentence(),
        whatChanged: sentence(),
        nextAction: action.nextAction,
        suggestedMessage: action.needsMessage ? message : body.suggestedMessage,
        messageText: action.needsMessage ? message : body.messageText,
      };
      renderPreview(analysis);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not review this capture.");
    } finally {
      setReviewBusy(false);
    }
  }

  async function saveCapture() {
    showError("");
    if (!captureState.draft) return;
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
        body: JSON.stringify({ analysis: captureState.draft }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not save this pursuit.");
      window.location.reload();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save this pursuit.");
      if (button) {
        button.disabled = false;
        button.textContent = "Approve and save";
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
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: action === "save" ? undefined : action,
          currentStage: card.getAttribute("data-current-stage"),
          currentStatus: entryValue(card, "currentStatus"),
          nextAction: entryValue(card, "nextAction"),
          note: action === "save" ? "Edited pursuit status." : action === "park" ? "Skipped for now." : "Marked " + action + ".",
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

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-smart-field]")) {
      captureState.fields[target.getAttribute("data-smart-field")] = target.value;
      captureState.selectedMessage = "";
      renderSentence();
      renderMessageCoach();
      return;
    }

    if (target.matches("[data-rough-draft]")) {
      captureState.roughDraft = target.value;
      captureState.selectedMessage = "";
      renderMessageCoach();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-action-select]")) {
      captureState.actionId = target.value;
      captureState.selectedMessage = "";
      captureState.roughDraft = "";
      renderCapture();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("[data-capture-form]")) {
      event.preventDefault();
      reviewCapture();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const mode = target.closest("[data-draft-mode]");
    if (mode) {
      captureState.draftMode = mode.getAttribute("data-draft-mode") || "ai";
      captureState.selectedMessage = "";
      renderMessageCoach();
      return;
    }

    const useMessage = target.closest("[data-use-message]");
    if (useMessage) {
      captureState.selectedMessage = useMessage.getAttribute("data-use-message") || "";
      renderMessageCoach();
      return;
    }

    const copyMessage = target.closest("[data-copy-message]");
    if (copyMessage) {
      navigator.clipboard?.writeText(copyMessage.getAttribute("data-copy-message") || "");
      copyMessage.textContent = "Copied";
      return;
    }

    if (target.closest("[data-pursuit-ignore]")) {
      const preview = document.querySelector("[data-pursuit-preview]");
      if (preview) preview.innerHTML = "";
      captureState.draft = null;
      return;
    }

    if (target.closest("[data-pursuit-save]")) {
      event.preventDefault();
      saveCapture();
      return;
    }

    const entryAction = target.closest("[data-entry-action]");
    if (entryAction) {
      event.preventDefault();
      saveEntry(entryAction);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderCapture, { once: true });
  } else {
    renderCapture();
  }
})();

