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
    messageIndex: 0,
    selectedMessage: "",
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

  function actionById(actionId) {
    return actions[actionId] || actions.found;
  }


  function messageOptions(actionId, fields, draftMode, roughDraft) {
    const firstName = (fields.name || "there").trim().split(/\s+/)[0] || "there";
    const business = fields.business || "your team";
    const role = fields.role ? " in your " + fields.role + " role" : "";
    const draft = String(roughDraft || "").trim();

    if (draftMode === "improve" && draft) {
      return [
        draft + "\n\nA cleaner version: Hi " + firstName + ", thought it would be good to connect. I am interested in how " + business + " is thinking about shopper engagement and retail execution, and your role" + role + " looked relevant.",
        "Hi " + firstName + ", I noticed your work with " + business + role + ". Thought it would be useful to connect and keep in touch around shopper engagement and retail growth.",
        "Hi " + firstName + ", your work at " + business + " caught my eye. I would enjoy connecting and learning more about what you are focused on at the moment.",
      ];
    }

    if (actionId === "found") {
      return [
        "Hi " + firstName + ", noticed your work at " + business + role + ". I am always interested in how retail and brand teams are thinking about shopper engagement, so thought it would be good to connect.",
        "Hi " + firstName + ", came across your profile and your role at " + business + " looked relevant to the work we do with StoreLab. Thought it would be good to connect.",
        "Hi " + firstName + ", I saw your background at " + business + " and thought it would be useful to connect. I work around retail growth, shopper engagement and demo execution through StoreLab.",
      ];
    }

    if (actionId === "connected") {
      return [
        "Thanks for connecting " + firstName + ". Keen to keep in touch and hear what you are focused on at " + business + ".",
        "Thanks for connecting " + firstName + ". I work with retail and brand teams through StoreLab, so thought it would be good to stay connected.",
        "Thanks " + firstName + ", appreciate the connection. If shopper engagement or retail execution is ever a focus, happy to share what we are seeing through StoreLab.",
      ];
    }

    if (actionId === "demo-proposed") {
      return [
        "Hi " + firstName + ", if useful I would be happy to show you a quick StoreLab demo. It might be relevant to how " + business + " is thinking about shopper engagement and retail activity.",
        "Hi " + firstName + ", would a short StoreLab demo be useful? I can keep it practical and focused on what might matter for " + business + ".",
        "Hi " + firstName + ", I think there may be a useful StoreLab angle for " + business + ". Would you be open to a short demo sometime?",
      ];
    }

    if (actionId === "demo-accepted") {
      return [
        "Great, thanks " + firstName + ". What is the best email address for you? I will send through a couple of times and we can lock in either Teams or onsite at Pymble.",
        "Perfect, thanks " + firstName + ". If you send me your email address I will follow up there and lock in the best time for the StoreLab demo.",
        "Great " + firstName + ". Send me the best email for you and I will organise the next step properly from there.",
      ];
    }

    if (actionId === "email-sent") {
      return [
        "Hi " + firstName + ", thanks for agreeing to take a look at StoreLab. I have sent through a calendar invite for a " + (fields.demoType || "Teams") + " demo. Looking forward to showing you what we are doing.",
        "Hi " + firstName + ", just confirming I have sent through the StoreLab demo details. Happy to tailor the session around what is most relevant for you.",
        "Hi " + firstName + ", calendar invite is on its way. I will keep the StoreLab demo practical and focused on where it could help your team.",
      ];
    }

    return ["Hi " + firstName + ", thought it would be good to follow up on StoreLab."];
  }

  function fieldHtml(field, value, scope) {
    return `
      <label class="block">
        <span class="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">${escapeText(labels[field])}</span>
        <input ${scope === "project" ? "data-project-field" : "data-smart-field"}="${field}" value="${escapeText(value || "")}" placeholder="${escapeText(labels[field])}" class="mt-1 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60" />
      </label>
    `;
  }

  function renderMessageCarousel(target, context) {
    const action = actionById(context.actionId);
    if (!action.needsMessage) {
      target.innerHTML = "";
      target.classList.add("hidden");
      return;
    }

    target.classList.remove("hidden");
    const options = messageOptions(context.actionId, context.fields, context.draftMode, context.roughDraft);
    const index = Math.max(0, Math.min(context.messageIndex || 0, options.length - 1));
    const message = context.selectedMessage || options[index] || "";
    const scope = context.scope;

    target.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-300">Message Coach</p>
          <p class="mt-1 text-sm text-slate-400">${escapeText(action.messageLabel || "Message")}</p>
        </div>
        <div class="grid grid-cols-2 border border-white/10 text-xs">
          <button type="button" data-${scope}-draft-mode="ai" class="px-3 py-2 ${context.draftMode === "ai" ? "bg-cyan-300 text-black" : "text-slate-300"}">AI writes it</button>
          <button type="button" data-${scope}-draft-mode="improve" class="px-3 py-2 ${context.draftMode === "improve" ? "bg-cyan-300 text-black" : "text-slate-300"}">Improve draft</button>
        </div>
      </div>
      ${context.draftMode === "improve" ? `<textarea data-${scope}-rough-draft rows="2" placeholder="Type your rough attempt here..." class="mt-3 w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60">${escapeText(context.roughDraft)}</textarea>` : ""}
      <div class="mt-3 border border-cyan-300/40 bg-cyan-300/[0.06] p-3">
        <div class="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Option ${index + 1} of ${options.length}</span>
          <span>${context.selectedMessage ? "Selected" : "Preview"}</span>
        </div>
        <p class="text-sm leading-6 text-slate-100">${escapeText(message)}</p>
        <div class="mt-3 grid grid-cols-4 gap-2">
          <button type="button" data-${scope}-message-nav="prev" class="border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/50">Previous</button>
          <button type="button" data-${scope}-message-nav="next" class="border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/50">Next</button>
          <button type="button" data-${scope}-use-message="${escapeText(message)}" class="border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/50">Use</button>
          <button type="button" data-${scope}-copy-message="${escapeText(message)}" class="border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/50">Copy</button>
        </div>
      </div>
    `;
  }

  function captureSentence() {
    return actionById(captureState.actionId).sentence(captureState.fields);
  }

  function renderCaptureFields() {
    const container = document.querySelector("[data-smart-fields]");
    if (!container) return;
    container.innerHTML = actionById(captureState.actionId).fields.map((field) => fieldHtml(field, captureState.fields[field], "capture")).join("");
  }

  function renderCapture() {
    renderCaptureFields();
    const sentence = document.querySelector("[data-sentence-preview]");
    if (sentence) sentence.textContent = captureSentence();
    const coach = document.querySelector("[data-message-coach]");
    if (coach) renderMessageCarousel(coach, { ...captureState, scope: "capture" });
  }

  function projectContext(card) {
    const actionId = card.querySelector("[data-project-action]")?.value || "connected";
    const fields = {
      ...defaults,
      name: card.dataset.personName || defaults.name,
      business: card.dataset.businessName || defaults.business,
      role: card.dataset.personRole || defaults.role,
    };

    card.querySelectorAll("[data-project-field]").forEach((input) => {
      fields[input.getAttribute("data-project-field")] = input.value;
    });

    return {
      scope: "project",
      actionId,
      fields,
      draftMode: card.dataset.draftMode || "ai",
      roughDraft: card.dataset.roughDraft || "",
      messageIndex: Number(card.dataset.messageIndex || "0"),
      selectedMessage: card.dataset.selectedMessage || "",
    };
  }

  function renderProjectSummary(card) {
    const context = projectContext(card);
    const action = actionById(context.actionId);
    const sentence = card.querySelector("[data-project-sentence]");
    if (sentence) sentence.textContent = action.sentence(context.fields);
    const coach = card.querySelector("[data-project-message-coach]");
    if (coach) renderMessageCarousel(coach, context);
  }

  function renderProjectCard(card) {
    const context = projectContext(card);
    const action = actionById(context.actionId);
    const fieldsContainer = card.querySelector("[data-project-fields]");
    if (fieldsContainer) {
      fieldsContainer.innerHTML = action.fields.map((field) => fieldHtml(field, context.fields[field], "project")).join("");
    }
    renderProjectSummary(card);
  }

  function renderProjects() {
    document.querySelectorAll("[data-project-card]").forEach((card) => renderProjectCard(card));
  }

  function showError(message) {
    const error = document.querySelector("[data-pursuit-error]");
    if (!error) return;
    error.textContent = message;
    error.classList.toggle("hidden", !message);
  }

  function setStartBusy(isBusy) {
    const button = document.querySelector("[data-capture-review]");
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? "Starting..." : "Start pursuit";
  }

  async function startPursuit() {
    showError("");
    const action = actionById(captureState.actionId);
    if (!captureState.fields.name.trim()) {
      showError("Add the person name first.");
      return;
    }

    setStartBusy(true);
    try {
      const options = messageOptions(captureState.actionId, captureState.fields, captureState.draftMode, captureState.roughDraft);
      const message = captureState.selectedMessage || options[captureState.messageIndex] || options[0] || "";
      const note = action.needsMessage && message ? captureSentence() + "\nMessage to use: " + message : captureSentence();
      const analysisResponse = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const body = await analysisResponse.json().catch(() => null);
      if (!analysisResponse.ok) throw new Error(body?.error || "Could not start this pursuit.");
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
        currentStatus: captureSentence(),
        whatChanged: captureSentence(),
        nextAction: action.nextAction,
        suggestedMessage: action.needsMessage ? message : body.suggestedMessage,
        messageText: action.needsMessage ? message : body.messageText,
      };
      const saveResponse = await fetch("/api/pursuits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const saveBody = await saveResponse.json().catch(() => null);
      if (!saveResponse.ok) throw new Error(saveBody?.error || "Could not save this pursuit.");
      window.location.reload();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not start this pursuit.");
    } finally {
      setStartBusy(false);
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

  async function updateProject(card, button) {
    const pursuitId = card.getAttribute("data-pursuit-id");
    if (!pursuitId) return;
    const context = projectContext(card);
    const action = actionById(context.actionId);
    const options = messageOptions(context.actionId, context.fields, context.draftMode, context.roughDraft);
    const message = context.selectedMessage || options[context.messageIndex] || options[0] || "";
    const name = splitFullName(context.fields.name);
    const status = action.sentence(context.fields);
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Updating...";
    entryError(card, "");

    try {
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: action.stage,
          person: {
            firstName: name.firstName,
            lastName: name.lastName,
            role: context.fields.role,
            email: context.fields.email,
          },
          business: {
            name: context.fields.business,
          },
          currentStatus: status,
          nextAction: action.nextAction,
          messageText: action.needsMessage ? message : "",
          note: status,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update this project.");
      window.location.reload();
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not update this project.");
      button.disabled = false;
      button.textContent = previousText;
    }
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
      captureState.messageIndex = 0;
      const sentenceTarget = document.querySelector("[data-sentence-preview]");
      if (sentenceTarget) sentenceTarget.textContent = captureSentence();
      const coach = document.querySelector("[data-message-coach]");
      if (coach) renderMessageCarousel(coach, { ...captureState, scope: "capture" });
      return;
    }

    if (target.matches("[data-capture-rough-draft]")) {
      captureState.roughDraft = target.value;
      captureState.selectedMessage = "";
      captureState.messageIndex = 0;
      renderCapture();
      return;
    }

    if (target.matches("[data-project-field]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        card.dataset.messageIndex = "0";
        renderProjectSummary(card);
      }
      return;
    }

    if (target.matches("[data-project-rough-draft]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.roughDraft = target.value;
        card.dataset.selectedMessage = "";
        card.dataset.messageIndex = "0";
        renderProjectCard(card);
      }
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-action-select]")) {
      captureState.actionId = target.value;
      captureState.selectedMessage = "";
      captureState.roughDraft = "";
      captureState.messageIndex = 0;
      renderCapture();
      return;
    }

    if (target.matches("[data-project-action]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        card.dataset.roughDraft = "";
        card.dataset.messageIndex = "0";
        renderProjectCard(card);
      }
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("[data-capture-form]")) {
      event.preventDefault();
      startPursuit();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const captureMode = target.closest("[data-capture-draft-mode]");
    if (captureMode) {
      captureState.draftMode = captureMode.getAttribute("data-capture-draft-mode") || "ai";
      captureState.selectedMessage = "";
      captureState.messageIndex = 0;
      renderCapture();
      return;
    }

    const captureNav = target.closest("[data-capture-message-nav]");
    if (captureNav) {
      const options = messageOptions(captureState.actionId, captureState.fields, captureState.draftMode, captureState.roughDraft);
      const direction = captureNav.getAttribute("data-capture-message-nav");
      captureState.messageIndex = direction === "next"
        ? Math.min(options.length - 1, captureState.messageIndex + 1)
        : Math.max(0, captureState.messageIndex - 1);
      captureState.selectedMessage = "";
      renderCapture();
      return;
    }

    const captureUse = target.closest("[data-capture-use-message]");
    if (captureUse) {
      captureState.selectedMessage = captureUse.getAttribute("data-capture-use-message") || "";
      renderCapture();
      return;
    }

    const captureCopy = target.closest("[data-capture-copy-message]");
    if (captureCopy) {
      navigator.clipboard?.writeText(captureCopy.getAttribute("data-capture-copy-message") || "");
      captureCopy.textContent = "Copied";
      return;
    }

    const projectMode = target.closest("[data-project-draft-mode]");
    if (projectMode) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.draftMode = projectMode.getAttribute("data-project-draft-mode") || "ai";
        card.dataset.selectedMessage = "";
        card.dataset.messageIndex = "0";
        renderProjectCard(card);
      }
      return;
    }

    const projectNav = target.closest("[data-project-message-nav]");
    if (projectNav) {
      const card = target.closest("[data-project-card]");
      if (card) {
        const context = projectContext(card);
        const options = messageOptions(context.actionId, context.fields, context.draftMode, context.roughDraft);
        const current = Number(card.dataset.messageIndex || "0");
        const direction = projectNav.getAttribute("data-project-message-nav");
        card.dataset.messageIndex = String(direction === "next" ? Math.min(options.length - 1, current + 1) : Math.max(0, current - 1));
        card.dataset.selectedMessage = "";
        renderProjectCard(card);
      }
      return;
    }

    const projectUse = target.closest("[data-project-use-message]");
    if (projectUse) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = projectUse.getAttribute("data-project-use-message") || "";
        renderProjectCard(card);
      }
      return;
    }

    const projectCopy = target.closest("[data-project-copy-message]");
    if (projectCopy) {
      navigator.clipboard?.writeText(projectCopy.getAttribute("data-project-copy-message") || "");
      projectCopy.textContent = "Copied";
      return;
    }

    const projectSave = target.closest("[data-project-save]");
    if (projectSave) {
      const card = target.closest("[data-project-card]");
      if (card) updateProject(card, projectSave);
      return;
    }

    const entryAction = target.closest("[data-entry-action]");
    if (entryAction) {
      event.preventDefault();
      saveEntry(entryAction);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderCapture();
      renderProjects();
    }, { once: true });
  } else {
    renderCapture();
    renderProjects();
  }
})();





