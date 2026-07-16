(() => {
  if (window.__storelabPursuitRuntime) return;
  window.__storelabPursuitRuntime = true;

  const examples = {
    name: "Joe Blogs",
    business: "7Eleven Australia",
    role: "Marketing Mgr",
    location: "Sydney",
    email: "joe@business.com",
    demoType: "Teams",
    sourcePath: "LinkedIn / cold",
    sourceContext: "Cc with existing customer",
    linkedinUrl: "https://www.linkedin.com/in/joe-blogs",
  };

  const defaults = {
    name: "",
    business: "",
    role: "",
    location: "",
    email: "",
    demoType: "",
    sourcePath: "linkedin",
    sourceContext: "",
    linkedinUrl: "",
  };

  const labels = {
    name: "Name",
    business: "Business",
    role: "Role",
    location: "Location",
    email: "Email",
    demoType: "Demo type",
    sourcePath: "Path",
    sourceContext: "Via / thread",
    linkedinUrl: "LinkedIn URL",
  };

  const actions = {
    found: {
      label: "Found",
      stage: "Message Drafted",
      fields: ["name", "business", "role", "location", "sourcePath"],
      needsMessage: true,
      messageLabel: "LinkedIn connection request",
      nextAction: "Review the suggested connection message, then send the LinkedIn request.",
      sentence: (fields) => {
        const location = fields.location ? " in " + fields.location : "";
        const viaEmail = fields.sourcePath === "email-cc";
        const via = viaEmail ? " via existing relationship / email cc" + (fields.sourceContext ? " (" + fields.sourceContext + ")" : "") : "";
        return 'Found "' + fields.name + '" from "' + fields.business + '" with role "' + fields.role + '"' + location + via + ". Message needed.";
      },
    },
    "message-needed": {
      label: "Message needed",
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
      needsMessage: true,
      messageLabel: "LinkedIn connection request sent",
      nextAction: "Monitor for the connection request to be accepted.",
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
    "re-engage": {
      label: "Re-engage existing",
      stage: "Connected",
      fields: ["name", "business", "role"],
      needsMessage: true,
      messageLabel: "Re-engagement message",
      nextAction: "Send a warm re-engagement message and look for a natural StoreLab angle.",
      sentence: (fields) => 'Re-engage existing LinkedIn connection "' + fields.name + '" from "' + fields.business + '" with role "' + fields.role + '". Message needed.',
    },
    "request-received": {
      label: "Request received",
      stage: "Connected",
      fields: ["name", "business", "role"],
      needsMessage: true,
      messageLabel: "Inbound connection reply",
      nextAction: "Accept the connection request, then send a short warm reply.",
      sentence: (fields) => 'Connection request received from "' + fields.name + '" at "' + fields.business + '". Reply message needed.',
    },
    "demo-proposed": {
      label: "Demo proposed",
      stage: "Demo Proposed",
      fields: ["name", "business"],
      needsMessage: true,
      messageLabel: "Demo suggestion",
      nextAction: "Monitor for their reply to the demo suggestion.",
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
      nextAction: "Monitor for the calendar booking to be accepted.",
      sentence: (fields) => 'Calendar booking for "' + fields.demoType + '" sent to "' + fields.name + '".',
    },
    booked: {
      label: "Booked",
      stage: "Demo Booked",
      fields: ["name"],
      nextAction: "Prepare the StoreLab demo brief and best angle.",
      sentence: (fields) => 'Calendar booking accepted by "' + fields.name + '" and demo is locked in.',
    },
    "successful-connection": {
      label: "Wins",
      stage: "Successful Connection",
      fields: ["name"],
      nextAction: "Keep this relationship warm and watch for the next useful business signal.",
      sentence: (fields) => 'Relationship with "' + fields.name + '" is now developed and marked as a win.',
    },
    "need-tactic": {
      label: "Need tactic",
      stage: "Gone Quiet",
      fields: ["name"],
      nextAction: "Try a different angle, channel, or timing before giving up.",
      sentence: (fields) => '"' + fields.name + '" needs another tactic.',
    },
  };

  const captureState = {
    actionId: "",
    fields: { ...defaults },
    draftMode: "ai",
    roughDraft: "",
    messageIndex: 0,
    selectedMessage: "",
    messageDirection: "",
    aiOptions: null,
    aiError: "",
    linkedinHtml: "",
    notes: "",
  };

  const captureStorageKey = "storelab:pursuit-capture-draft:v2";

  function persistCaptureState() {
    try {
      sessionStorage.setItem(captureStorageKey, JSON.stringify({
        actionId: captureState.actionId,
        fields: captureState.fields,
        draftMode: captureState.draftMode,
        roughDraft: captureState.roughDraft,
        messageIndex: captureState.messageIndex,
        selectedMessage: captureState.selectedMessage,
        messageDirection: captureState.messageDirection,
        aiOptions: captureState.aiOptions,
        aiError: captureState.aiError,
        expanded: Boolean(captureState.expanded && captureState.actionId),
        linkedinHtml: captureState.linkedinHtml,
        notes: captureState.notes,
      }));
    } catch {
      // Ignore storage failures; capture still works without persistence.
    }
  }

  function restoreCaptureState() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(captureStorageKey) || "null");
      if (!stored || typeof stored !== "object") return;

      captureState.actionId = actions[stored.actionId] ? stored.actionId : "";
      captureState.fields = { ...defaults, ...(stored.fields || {}) };
      captureState.draftMode = "ai";
      captureState.roughDraft = "";
      captureState.messageIndex = 0;
      captureState.selectedMessage = "";
      captureState.messageDirection = "";
      captureState.aiOptions = null;
      captureState.aiError = "";
      captureState.expanded = Boolean(captureState.actionId && stored.expanded);
      captureState.linkedinHtml = stored.linkedinHtml || "";
      captureState.notes = stored.notes || "";
    } catch {
      // A bad draft should never stop the app loading.
    }
  }

  function clearCaptureState() {
    try {
      sessionStorage.removeItem(captureStorageKey);
    } catch {
      // Ignore storage failures.
    }
  }

  function resetCaptureDraft() {
    captureState.actionId = "";
    captureState.fields = { ...defaults };
    captureState.draftMode = "ai";
    captureState.roughDraft = "";
    captureState.messageIndex = 0;
    captureState.selectedMessage = "";
    captureState.messageDirection = "";
    captureState.aiOptions = null;
    captureState.aiError = "";
    captureState.linkedinHtml = "";
    captureState.notes = "";
    captureState.expanded = false;
    clearCaptureState();
  }

  function resetDashboardView() {
    resetCaptureDraft();
    renderCapture();

    document.querySelectorAll("[data-project-card]").forEach((card) => {
      if (card instanceof HTMLDetailsElement) card.open = false;
      card.dataset.credentialsMode = "view";
      card.hidden = false;
      renderProjectCard(card);
    });

    document.querySelectorAll("[data-active-search]").forEach((search) => {
      search.value = "";
    });
    document.querySelectorAll("[data-active-filter]").forEach((control) => {
      control.value = "all";
      control.disabled = false;
    });

    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    updateActivePursuitFocus(null);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  function escapeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function titleCaseName(value) {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  function splitFullName(value) {
    const parts = titleCaseName(value).split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" "),
    };
  }

  function actionById(actionId) {
    return actions[actionId] || actions.found;
  }

  function displayFields(fields, useExamples) {
    return {
      ...fields,
      name: fields.name || (useExamples ? examples.name : ""),
      business: fields.business || (useExamples ? examples.business : ""),
      role: fields.role || (useExamples ? examples.role : ""),
      location: fields.location || (useExamples ? examples.location : ""),
      email: fields.email || (useExamples ? examples.email : ""),
      demoType: fields.demoType || (useExamples ? examples.demoType : ""),
      sourcePath: fields.sourcePath || "linkedin",
      sourceContext: fields.sourceContext || (useExamples ? examples.sourceContext : ""),
    };
  }

  function normaliseBusinessName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function businessSuggestionOptions() {
    return Array.from(document.querySelectorAll("#business-suggestions option")).map((option) => ({
      node: option,
      id: option.dataset.businessId || "",
      name: option.value || "",
      peopleCount: Number(option.dataset.peopleCount || "0"),
      pursuitCount: Number(option.dataset.pursuitCount || "0"),
      opportunityCount: Number(option.dataset.opportunityCount || "0"),
    }));
  }

  function businessOptionForName(name) {
    const normalised = normaliseBusinessName(name);
    if (!normalised) return null;
    return businessSuggestionOptions().find((option) => normaliseBusinessName(option.name) === normalised) || null;
  }

  function addBusinessSuggestion(name, details = {}) {
    const cleaned = String(name || "").replace(/\s+/g, " ").trim();
    if (!cleaned || businessOptionForName(cleaned)) return;

    const list = document.querySelector("#business-suggestions");
    if (!list) return;

    const option = document.createElement("option");
    option.value = cleaned;
    option.dataset.businessId = details.id || "";
    option.dataset.peopleCount = String(details.peopleCount || 0);
    option.dataset.pursuitCount = String(details.pursuitCount || 0);
    option.dataset.opportunityCount = String(details.opportunityCount || 0);
    list.appendChild(option);
  }


  function locationSuggestionOptions() {
    return Array.from(document.querySelectorAll("#location-suggestions option")).map((option) => option.value || "");
  }

  function addLocationSuggestion(name) {
    const cleaned = String(name || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const exists = locationSuggestionOptions().some((option) => option.toLowerCase() === cleaned.toLowerCase());
    if (exists) return;
    const list = document.querySelector("#location-suggestions");
    if (!list) return;
    const option = document.createElement("option");
    option.value = cleaned;
    list.appendChild(option);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  function compactContext(value, maxLength) {
    const cleaned = String(value || "").replace(/\s+/g, " ").trim();
    return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + "..." : cleaned;
  }

  function messageAngle(messageDirection) {
    const direction = String(messageDirection || "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[.!?,;:\s]+|[.!?,;:\s]+$/g, "")
      .replace(/^(interested in|interest in|i am interested in|i'm interested in|focus on|about|around|angle is|subject is)\s+/i, "");

    if (!direction) return "";
    if (/marketing/i.test(direction)) return "marketing priorities";
    if (/category/i.test(direction)) return "category growth";
    if (/shopper|retail/i.test(direction)) return "shopper and retail growth";
    if (/innovation/i.test(direction)) return "innovation work";
    if (/data|insight|analytics/i.test(direction)) return "insights and analytics work";
    if (/email|cc|correspondence|already know|working with|worked with|new to|new in|new role|new job|recently joined|just joined|started|settling|settle|moved|promoted/i.test(direction)) return "";
    if (/^[a-z0-9 ,'&-]{3,40}$/i.test(direction) && !/\b(he|she|they|him|her|them|his|their|new|just|recently|because|since|dont|do not)\b/i.test(direction)) return direction;
    return "";
  }

  function messageRelationship(messageDirection) {
    const direction = String(messageDirection || "").toLowerCase();
    if (/cc'?d|cced|copied|email correspondence|email thread|project correspondence/.test(direction)) return "email";
    if (/working with|working together|already working|work with them|on a project/.test(direction)) return "working";
    if (/already know|know them|known them|met them|existing relationship|existing contact/.test(direction)) return "known";
    if (/mate|friend|mutual|knows them|knows him|knows her|works there too|works with them|aaron works there|aaron knows/i.test(direction)) return "mutual";
    return "";
  }

  function messageSituation(messageDirection) {
    const direction = String(messageDirection || "").toLowerCase();
    if (/new to (the )?(job|role|business|company)|new in (the )?(job|role)|new role|new job|recently joined|just joined|recently started|just started|settling in|settle in/.test(direction)) return "new-role";
    if (/moved to|moved from|new company|changed role|role change|promoted|promotion/.test(direction)) return "moved-role";
    if (/busy|time poor|short message|keep it brief|light touch|soft|gentle|not salesy|don'?t sell|do not sell/.test(direction)) return "light-touch";
    return "";
  }

  function situationOptions(situation, fields) {
    const firstName = (fields.name || "there").trim().split(/\s+/)[0] || "there";
    const business = fields.business || "your team";
    const role = fields.role ? " " + fields.role : " new role";

    if (situation === "new-role") {
      return [
        "Hi " + firstName + ", noticed you have recently stepped into your" + role + " at " + business + ". Congratulations. Once you have settled in, it would be good to connect and hear what you are focused on.",
        "Hi " + firstName + ", congratulations on the new role at " + business + ". I work with retail and brand teams through StoreLab, so thought it would be useful to connect once you are settled.",
        "Hi " + firstName + ", saw you are new in role at " + business + ". Hope the first stretch is going well. Thought it would be good to connect and keep in touch.",
      ];
    }

    if (situation === "moved-role") {
      return [
        "Hi " + firstName + ", saw the move to " + business + ". Congratulations. Once you have found your feet, I would be keen to hear what you are focused on and whether StoreLab could be useful in the new role.",
        "Hi " + firstName + ", congratulations on the move. It would be good to reconnect now you are at " + business + " and hear what is on your radar.",
        "Hi " + firstName + ", noticed the role change at " + business + ". Hope it is going well. Thought I would reconnect and stay close to what you are working on.",
      ];
    }

    if (situation === "light-touch") {
      return [
        "Hi " + firstName + ", thought it would be good to connect. I will keep this light, but your work at " + business + " looked relevant to what we do through StoreLab.",
        "Hi " + firstName + ", quick note as your role at " + business + " caught my eye. Thought it would be useful to connect and stay in touch.",
        "Hi " + firstName + ", I will keep this brief. I work with retail and brand teams through StoreLab and thought it would be good to connect.",
      ];
    }

    return [];
  }

  function relationshipOptions(relationship, fields, angle) {
    const firstName = (fields.name || "there").trim().split(/\s+/)[0] || "there";
    const business = fields.business || "your team";
    const focus = angle ? " around " + angle : "";

    if (relationship === "email") {
      return [
        "Hi " + firstName + ", we have crossed paths on email already, so I thought it would be useful to connect here too. Keen to stay in touch" + focus + ".",
        "Hi " + firstName + ", I think we have been on the same email thread recently. Thought I would connect properly here as well and keep in touch with what you are focused on at " + business + ".",
        "Hi " + firstName + ", we have been in some of the same project correspondence, so I thought it made sense to connect directly here too.",
      ];
    }

    if (relationship === "working") {
      return [
        "Hi " + firstName + ", good to connect here as well. Since we are already working together, I thought it made sense to stay connected and keep close to what is happening at " + business + ".",
        "Hi " + firstName + ", good to be connected here too. I have enjoyed working with you and thought it would be useful to stay in touch" + focus + ".",
        "Hi " + firstName + ", thought I would connect here as well given we are already working together. Keen to keep the conversation going.",
      ];
    }

    if (relationship === "mutual") {
      return [
        "Hi " + firstName + ", noticed we have a bit of overlap through Aaron and " + business + ". Thought it would be useful to connect properly here too.",
        "Hi " + firstName + ", I saw Aaron is connected into " + business + " as well. Thought I would reach out and connect directly here.",
        "Hi " + firstName + ", it looks like we have some common ground through Aaron. Thought it would be good to connect and keep in touch around " + business + ".",
      ];
    }

    if (relationship === "known") {
      return [
        "Hi " + firstName + ", good to reconnect. I know we have already crossed paths, and I would be interested to stay close to what you are focused on at " + business + ".",
        "Hi " + firstName + ", it has been good crossing paths previously. Thought I would connect here properly and keep in touch" + focus + ".",
        "Hi " + firstName + ", good to find you here. Since we already know each other, I thought it would be useful to connect and stay in touch.",
      ];
    }

    return [];
  }

  function applyMessageDirection(options, messageDirection, fields = {}) {
    const angle = messageAngle(messageDirection);
    const relationship = messageRelationship(messageDirection);
    const situation = messageSituation(messageDirection);
    if (relationship) return relationshipOptions(relationship, fields, angle);
    if (situation) return situationOptions(situation, fields);
    if (!angle) return options;

    return options.map((option, index) => {
      let tailored = option
        .replace(/shopper engagement and retail execution/g, angle)
        .replace(/shopper engagement and retail activity/g, angle)
        .replace(/shopper engagement/g, angle)
        .replace(/retail growth, shopper engagement and demo execution/g, "retail growth, " + angle + " and demo execution")
        .replace(/retail growth and shopper engagement/g, "retail growth and " + angle);

      if (tailored !== option) return tailored;

      if (index === 0) {
        return option.replace(/\. Thought/i, ". The " + angle + " side of your work stood out. Thought");
      }

      if (index === 1) {
        return option.replace(/\. I work/i, ". I was interested in the " + angle + " angle. I work");
      }

      return option.replace(/\.$/, ", particularly the " + angle + " side.");
    });
  }

  function referenceTopic(messageReference) {
    const reference = String(messageReference || "").toLowerCase();
    if (!reference) return "";
    if (reference.includes("demo")) return "the StoreLab demo";
    if (reference.includes("storelab")) return "StoreLab";
    if (reference.includes("shopper")) return "shopper engagement";
    if (reference.includes("retail")) return "retail growth";
    if (reference.includes("marketing")) return "marketing priorities";
    return "my earlier message";
  }

  function messageOptions(actionId, fields, draftMode, roughDraft, messageDirection, messageReference = "") {
    const firstName = (fields.name || "there").trim().split(/\s+/)[0] || "there";
    const business = fields.business || "your team";
    const role = fields.role ? " in your " + fields.role + " role" : "";
    const draft = String(roughDraft || "").trim();
    const topic = referenceTopic(messageReference);

    if (topic) {
      return applyMessageDirection([
        "Hi " + firstName + ", just following up on my earlier message about " + topic + ". Keen to hear whether it is relevant for " + business + ".",
        "Hi " + firstName + ", wanted to build on my earlier note about " + topic + ". If useful, I would be happy to share a quick StoreLab view.",
        "Hi " + firstName + ", following up on my previous message. The " + topic + " angle still felt relevant, so thought I would check in.",
      ], messageDirection, fields);
    }

    if (draftMode === "improve" && draft) {
      return applyMessageDirection([
        draft + "\n\nA cleaner version: Hi " + firstName + ", thought it would be good to connect. I am interested in how " + business + " is thinking about shopper engagement and retail execution, and your role" + role + " looked relevant.",
        "Hi " + firstName + ", I noticed your work with " + business + role + ". Thought it would be useful to connect and keep in touch around shopper engagement and retail growth.",
        "Hi " + firstName + ", your work at " + business + " caught my eye. I would enjoy connecting and learning more about what you are focused on at the moment.",
      ], messageDirection, fields);
    }

    if (actionId === "found") {
      if (fields.sourcePath === "email-cc") {
        return applyMessageDirection([
          "Hi " + firstName + ", I think we have crossed paths on email through " + (fields.sourceContext || business) + ". Thought it would be useful to connect here too.",
          "Hi " + firstName + ", I noticed we have been on the same project email thread. Thought I would connect properly here and keep in touch around " + business + ".",
          "Hi " + firstName + ", we have been copied into some of the same correspondence, so I thought it made sense to connect directly here too.",
        ], messageDirection || "email thread", fields);
      }

      return applyMessageDirection([
        "Hi " + firstName + ", noticed your work at " + business + role + ". I am always interested in how retail and brand teams are thinking about shopper engagement, so thought it would be good to connect.",
        "Hi " + firstName + ", came across your profile and your role at " + business + " looked relevant to the work we do with StoreLab. Thought it would be good to connect.",
        "Hi " + firstName + ", I saw your background at " + business + " and thought it would be useful to connect. I work around retail growth, shopper engagement and demo execution through StoreLab.",
      ], messageDirection, fields);
    }

    if (actionId === "connected") {
      return applyMessageDirection([
        "Thanks for connecting " + firstName + ". Keen to keep in touch and hear what you are focused on at " + business + ".",
        "Thanks for connecting " + firstName + ". I work with retail and brand teams through StoreLab, so thought it would be good to stay connected.",
        "Thanks " + firstName + ", appreciate the connection. If shopper engagement or retail execution is ever a focus, happy to share what we are seeing through StoreLab.",
      ], messageDirection, fields);
    }

    if (actionId === "re-engage") {
      return applyMessageDirection([
        "Hi " + firstName + ", hope things are going well at " + business + ". It has been a while, so thought I would reconnect and hear what you are focused on at the moment.",
        "Hi " + firstName + ", I saw your work at " + business + " and thought it would be good to properly reconnect. Keen to hear what is keeping you busy lately.",
        "Hi " + firstName + ", been meaning to reconnect. If shopper engagement or retail execution is on the radar at " + business + ", I would enjoy comparing notes sometime.",
      ], messageDirection, fields);
    }

    if (actionId === "request-received") {
      return applyMessageDirection([
        "Hi " + firstName + ", thanks for connecting. Great to be in touch. I would be interested to hear what you are focused on at " + business + ".",
        "Hi " + firstName + ", thanks for reaching out. Good to connect, and keen to learn more about your work at " + business + ".",
        "Thanks for connecting " + firstName + ". I work around retail growth and shopper engagement through StoreLab, so it would be good to stay in touch.",
      ], messageDirection, fields);
    }

    if (actionId === "demo-proposed") {
      return applyMessageDirection([
        "Hi " + firstName + ", if useful I would be happy to show you a quick StoreLab demo. It might be relevant to how " + business + " is thinking about shopper engagement and retail activity.",
        "Hi " + firstName + ", would a short StoreLab demo be useful? I can keep it practical and focused on what might matter for " + business + ".",
        "Hi " + firstName + ", I think there may be a useful StoreLab angle for " + business + ". Would you be open to a short demo sometime?",
      ], messageDirection, fields);
    }

    if (actionId === "demo-accepted") {
      return applyMessageDirection([
        "Great, thanks " + firstName + ". What is the best email address for you? I will send through a couple of times and we can lock in either Teams or onsite at Pymble.",
        "Perfect, thanks " + firstName + ". If you send me your email address I will follow up there and lock in the best time for the StoreLab demo.",
        "Great " + firstName + ". Send me the best email for you and I will organise the next step properly from there.",
      ], messageDirection, fields);
    }

    if (actionId === "email-sent") {
      return applyMessageDirection([
        "Hi " + firstName + ", thanks for agreeing to take a look at StoreLab. I have sent through a calendar invite for a " + (fields.demoType || "Teams") + " demo. Looking forward to showing you what we are doing.",
        "Hi " + firstName + ", just confirming I have sent through the StoreLab demo details. Happy to tailor the session around what is most relevant for you.",
        "Hi " + firstName + ", calendar invite is on its way. I will keep the StoreLab demo practical and focused on where it could help your team.",
      ], messageDirection, fields);
    }

    return applyMessageDirection(["Hi " + firstName + ", thought it would be good to follow up on StoreLab."], messageDirection, fields);
  }
  function clearBusinessDeleteConfirm(shell) {
    shell?.querySelectorAll("[data-business-delete-confirm]").forEach((node) => node.remove());
  }

  function updateBusinessDeleteControl(input) {
    const shell = input.closest("label");
    if (!shell) return;

    shell.querySelectorAll("[data-business-delete], [data-business-delete-confirm]").forEach((node) => node.remove());
    const option = businessOptionForName(input.value);
    if (!option?.id) return;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-business-delete", option.id);
    button.setAttribute("data-business-name", option.name);
    button.className = "absolute right-2 top-7 inline-flex h-6 w-6 items-center justify-center border border-white/10 bg-black/80 text-xs text-slate-500 transition hover:border-red-300/50 hover:bg-red-300/[0.08] hover:text-red-100";
    button.textContent = "x";
    button.title = "Remove " + option.name + " from the business list";
    input.insertAdjacentElement("afterend", button);
  }

  function refreshBusinessDeleteControls(root = document) {
    root.querySelectorAll('[data-smart-field="business"], [data-project-field="business"]').forEach((input) => {
      if (input instanceof HTMLInputElement) updateBusinessDeleteControl(input);
    });
  }

  function businessLinkWarning(option) {
    const links = [];
    if (option.peopleCount) links.push(option.peopleCount + " people");
    if (option.pursuitCount) links.push(option.pursuitCount + " pursuits");
    if (option.opportunityCount) links.push(option.opportunityCount + " opportunities");
    return links.length ? "It is linked to " + links.join(", ") + "." : "No existing links found.";
  }

  function showBusinessDeleteConfirm(button) {
    const shell = button.closest("label");
    const option = businessSuggestionOptions().find((candidate) => candidate.id === button.getAttribute("data-business-delete"));
    if (!shell || !option) return;

    clearBusinessDeleteConfirm(shell);
    const prompt = document.createElement("div");
    prompt.setAttribute("data-business-delete-confirm", "true");
    prompt.className = "mt-2 border border-red-300/20 bg-red-300/[0.06] p-2 text-[11px] leading-5 text-slate-300";
    prompt.innerHTML = `
      <div class="text-slate-200">Remove ${escapeText(option.name)}?</div>
      <div class="text-slate-500">${escapeText(businessLinkWarning(option))}</div>
      <div class="mt-2 flex gap-2">
        <button type="button" data-business-delete-answer="yes" data-business-id="${escapeText(option.id)}" class="border border-red-300/30 px-2 py-1 text-red-100 hover:border-red-200">Yes</button>
        <button type="button" data-business-delete-answer="no" class="border border-white/10 px-2 py-1 text-slate-300 hover:border-cyan-300/40">No</button>
      </div>
    `;
    button.insertAdjacentElement("afterend", prompt);
  }

  async function archiveBusinessFromField(button) {
    const businessId = button.getAttribute("data-business-id");
    const shell = button.closest("label");
    const option = businessSuggestionOptions().find((candidate) => candidate.id === businessId);
    if (!businessId || !option) return;

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Removing...";

    try {
      const response = await fetch("/api/businesses/" + encodeURIComponent(businessId), { method: "DELETE" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not remove this business.");

      option.node.remove();
      document.querySelectorAll('[data-smart-field="business"], [data-project-field="business"]').forEach((input) => {
        if (input instanceof HTMLInputElement && normaliseBusinessName(input.value) === normaliseBusinessName(option.name)) {
          input.value = "";
          if (input.matches("[data-smart-field]")) captureState.fields.business = "";
        }
      });
      clearBusinessDeleteConfirm(shell);
      refreshBusinessDeleteControls();
    } catch (error) {
      button.disabled = false;
      button.textContent = previousText;
      const prompt = button.closest("[data-business-delete-confirm]");
      const message = prompt?.querySelector("[data-business-delete-error]") || document.createElement("div");
      message.setAttribute("data-business-delete-error", "true");
      message.className = "mt-2 text-red-100";
      message.textContent = error instanceof Error ? error.message : "Could not remove this business.";
      prompt?.appendChild(message);
    }
  }

  function safeJsonArray(value) {
    try {
      const parsed = JSON.parse(value || "null");
      return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
    } catch {
      return null;
    }
  }

  function coachOptions(context) {
    return Array.isArray(context.aiOptions) && context.aiOptions.length
      ? context.aiOptions
      : messageOptions(context.actionId, context.fields, context.draftMode, context.roughDraft, context.messageDirection, context.messageReference);
  }

  function currentCoachMessage(context) {
    const options = coachOptions(context);
    const index = Math.max(0, Math.min(context.messageIndex || 0, options.length - 1));

    return context.selectedMessage || options[index] || options[0] || "";
  }

  function renderMessageCarousel(target, context) {
    const action = actionById(context.actionId);
    if (!action.needsMessage && context.scope !== "project") {
      target.innerHTML = "";
      target.classList.add("hidden");
      return;
    }

    target.classList.remove("hidden");
    const options = coachOptions(context);
    const index = Math.max(0, Math.min(context.messageIndex || 0, options.length - 1));
    const message = context.selectedMessage || options[index] || "";
    const scope = context.scope;
    const attachedLabel = scope === "project" ? "Attached to this pursuit" : "Attached to new pursuit";

    target.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-300">Message Coach</p>
          <p class="mt-1 text-sm text-slate-400">${escapeText(action.messageLabel || "Message")}</p>
        </div>
        <div class="grid grid-cols-2 overflow-hidden border border-white/10 bg-black/20 text-xs">
          <button type="button" data-${scope}-draft-mode="ai" class="h-9 px-3 ${context.draftMode === "ai" ? "bg-cyan-300 text-black font-semibold" : "text-slate-300 hover:bg-white/[0.035]"}">AI writes it</button>
          <button type="button" data-${scope}-draft-mode="improve" class="h-9 border-l border-white/10 px-3 ${context.draftMode === "improve" ? "bg-cyan-300 text-black font-semibold" : "text-slate-300 hover:bg-white/[0.035]"}">Improve draft</button>
        </div>
      </div>
      <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <textarea data-${scope}-message-direction rows="2" placeholder="Tell ChatGPT what to change, add, remove or improve..." class="w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60">${escapeText(context.messageDirection || "")}</textarea>
        <button type="button" data-${scope}-regenerate class="border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">Ask ChatGPT</button>
      </div>
      ${context.draftMode === "improve" ? `<textarea data-${scope}-rough-draft rows="2" placeholder="Type your rough attempt here..." class="mt-3 w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60">${escapeText(context.roughDraft)}</textarea>` : ""}
      ${context.aiError ? `<div class="mt-3 border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">ChatGPT is not connected yet. ${escapeText(context.aiError)} Local StoreLab suggestions are shown below for now.</div>` : ""}
      <div class="mt-3 border border-white/10 bg-black/20 p-3">
        <div class="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Option ${index + 1} of ${options.length}</span>
          <span>${context.selectedMessage ? "Attached" : "Preview"}</span>
        </div>
        <p class="text-sm leading-6 text-slate-100">${escapeText(message)}</p>
        <div class="mt-3 grid grid-cols-4 gap-2">
          <button type="button" data-${scope}-message-nav="prev" class="h-8 border border-white/10 bg-black/20 px-3 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">Previous</button>
          <button type="button" data-${scope}-message-nav="next" class="h-8 border border-white/10 bg-black/20 px-3 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">Next</button>
          <button type="button" data-${scope}-use-message="${escapeText(message)}" class="h-8 border border-white/10 bg-black/20 px-3 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">${context.selectedMessage ? "Attached" : "Use"}</button>
          <button type="button" data-${scope}-copy-message="${escapeText(message)}" class="h-8 border border-white/10 bg-black/20 px-3 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">Copy</button>
        </div>
      </div>
      ${context.selectedMessage ? `<div class="mt-3 border border-emerald-300/20 bg-emerald-300/[0.06] p-3">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200">${attachedLabel}</p>
          <button type="button" data-${scope}-clear-message class="text-[11px] text-slate-500 hover:text-slate-200">Remove</button>
        </div>
        <p class="whitespace-pre-wrap text-sm leading-6 text-slate-100">${escapeText(context.selectedMessage)}</p>
      </div>` : ""}
    `;
  }

  function captureSentence(useExamples = true) {
    const action = actions[captureState.actionId];
    return action ? action.sentence(displayFields(captureState.fields, useExamples)) : "";
  }

  function setCaptureExpanded(expanded) {
    captureState.expanded = Boolean(expanded && actions[captureState.actionId]);
    const shell = document.querySelector("[data-quick-capture]");
    if (shell) shell.dataset.captureState = captureState.expanded ? "expanded" : "collapsed";
    document.querySelectorAll("[data-capture-expanded]").forEach((node) => {
      node.classList.toggle("hidden", !captureState.expanded);
    });
  }

  function renderCaptureFields() {
    const container = document.querySelector("[data-smart-fields]");
    if (!container) return;
    const action = actions[captureState.actionId];
    if (!action) {
      container.innerHTML = "";
      return;
    }

    const fields = captureState.actionId === "found"
      ? [...action.fields, ...(captureState.fields.sourcePath === "email-cc" ? ["sourceContext"] : [])]
      : action.fields;
    container.innerHTML = `
      <section data-credentials-panel class="border border-white/10 bg-black/15 p-3">
        <div>
          <p class="text-[10px] font-medium uppercase text-cyan-300">Details</p>
          <p class="mt-0.5 text-xs text-slate-600">Capture the core pursuit info.</p>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2">
          ${fields.map((field) => credentialTileHtml(field, captureState.fields[field], true, "capture")).join("")}
        </div>
      </section>
    `;
    refreshBusinessDeleteControls(container);
  }

  function syncCaptureDomFromState() {
    const actionSelect = document.querySelector("[data-action-select]");
    if (actionSelect) actionSelect.value = actions[captureState.actionId] ? captureState.actionId : "";

    const linkedinHtml = document.querySelector("[data-capture-linkedin-html]");
    if (linkedinHtml && linkedinHtml.value !== captureState.linkedinHtml) linkedinHtml.value = captureState.linkedinHtml;

    const notes = document.querySelector("[data-capture-notes]");
    if (notes && notes.value !== captureState.notes) notes.value = captureState.notes;
  }

  function renderCapture() {
    const hasAction = Boolean(actions[captureState.actionId]);
    setCaptureExpanded(Boolean(captureState.expanded && hasAction));
    renderCaptureFields();
    syncCaptureDomFromState();
    const sentence = document.querySelector("[data-sentence-preview]");
    if (sentence) sentence.textContent = hasAction ? captureSentence() : "";
    const coach = document.querySelector("[data-message-coach]");
    if (coach) {
      if (hasAction && captureState.expanded) {
        renderMessageCarousel(coach, { ...captureState, fields: displayFields(captureState.fields, true), scope: "capture" });
      } else {
        coach.innerHTML = "";
        coach.classList.add("hidden");
      }
    }
  }

  function projectSentMessage(card) {
    const field = card.querySelector("[data-project-sent-message]");
    return field?.value?.trim() || card.dataset.selectedMessage || "";
  }

  function missingCorePursuitFields(fields) {
    return ["name", "business", "role", "location"].filter((field) => !String(fields[field] || "").trim());
  }

  function coreFieldLabel(field) {
    return labels[field] || field;
  }

  function setProjectSentMessage(card, value) {
    const message = value || "";
    const field = card.querySelector("[data-project-sent-message]");
    if (field) field.value = message;
    card.dataset.selectedMessage = message;
    card.dataset.messageReference = message;
  }

  function projectMessageReference(card) {
    return projectSentMessage(card) || card.dataset.messageReference || "";
  }

  function sourcePathFromSource(source) {
    return /email|referral|cc|thread/i.test(source || "") ? "email-cc" : "linkedin";
  }

  function sourceFromPath(path) {
    return path === "email-cc" ? "Email referral" : "LinkedIn";
  }
  function projectContext(card) {
    const actionId = card.querySelector("[data-project-action]")?.value || "connected";
    const fields = {
      ...defaults,
      name: card.dataset.personName || defaults.name,
      business: card.dataset.businessName || defaults.business,
      role: card.dataset.personRole || defaults.role,
      location: card.dataset.personLocation || defaults.location,
      linkedinUrl: card.dataset.personLinkedinUrl || defaults.linkedinUrl,
      sourcePath: card.dataset.sourcePath || sourcePathFromSource(card.dataset.pursuitSource || ""),
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
      messageDirection: card.dataset.messageDirection || "",
      messageIndex: Number(card.dataset.messageIndex || "0"),
      selectedMessage: card.dataset.selectedMessage || "",
      messageReference: projectMessageReference(card) || card.dataset.messageReference || "",
      aiOptions: safeJsonArray(card.dataset.aiOptions),
      aiError: card.dataset.aiError || "",
    };
  }

  function renderProjectSummary(card) {
    const context = projectContext(card);
    const action = actionById(context.actionId);
    const sentence = card.querySelector("[data-project-sentence]");
    if (sentence) sentence.textContent = action.sentence(context.fields);
    setCardText(card, "[data-summary-stage]", card.dataset.statusLabel || statusLabel(card.dataset.currentStage || "Found"));
    const coach = card.querySelector("[data-project-message-coach]");
    if (!coach) return;

    if (!action.needsMessage) {
      coach.innerHTML = "";
      coach.classList.add("hidden");
      return;
    }

    try {
      renderMessageCarousel(coach, context);
    } catch (error) {
      console.error("Message Coach render failed:", error);
      coach.innerHTML = "";
    }

    if (!coach.innerHTML.trim()) {
      const options = messageOptions(context.actionId, context.fields, context.draftMode, context.roughDraft, context.messageDirection, context.messageReference);
      const message = options[0] || "";
      coach.classList.remove("hidden");
      coach.innerHTML = `
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-300">Message Coach</p>
          <p class="mt-1 text-sm text-slate-400">${escapeText(action.messageLabel || "Message")}</p>
        </div>
        <div class="mt-3 border border-white/10 bg-black/20 p-3">
          <div class="mb-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Option 1 of ${options.length || 1}</span>
            <span>Preview</span>
          </div>
          <p class="text-sm leading-6 text-slate-100">${escapeText(message)}</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" data-project-use-message="${escapeText(message)}" class="h-8 border border-white/10 bg-black/20 px-3 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">Use</button>
            <button type="button" data-project-copy-message="${escapeText(message)}" class="h-8 border border-white/10 bg-black/20 px-3 text-xs text-slate-300 transition hover:border-cyan-300/50 hover:text-white">Copy</button>
          </div>
        </div>
      `;
    }
  }

  function credentialDisplayValue(field, value) {
    if (field === "sourcePath") return value === "email-cc" ? "Existing relationship / email cc" : "LinkedIn / cold";
    return String(value || "").trim() || "Not set";
  }
  function credentialTileHtml(field, value, editing, scope = "project") {
    const label = escapeText(labels[field] || field);
    const current = value || "";

    if (!editing) {
      return `
        <div class="min-w-0 border border-white/10 bg-black/20 px-2.5 py-2">
          <div class="text-[9px] font-medium uppercase text-slate-600">${label}</div>
          <div class="mt-0.5 truncate text-xs text-slate-200">${escapeText(credentialDisplayValue(field, current))}</div>
        </div>
      `;
    }

    if (field === "sourcePath") {
      const source = current || "linkedin";
      return `
        <label class="min-w-0 border border-white/10 bg-black/20 px-2.5 py-2 focus-within:border-cyan-300/60">
          <span class="text-[9px] font-medium uppercase text-slate-600">${label}</span>
          <select ${scope === "project" ? 'data-project-field="sourcePath"' : 'data-source-path-select'} class="mt-0.5 h-6 w-full appearance-none bg-transparent p-0 text-xs text-slate-100 outline-none">
            <option value="linkedin" ${source === "linkedin" ? "selected" : ""}>LinkedIn / cold</option>
            <option value="email-cc" ${source === "email-cc" ? "selected" : ""}>Existing relationship / email cc</option>
          </select>
        </label>
      `;
    }

    const list = field === "business" ? ' list="business-suggestions"' : field === "location" ? ' list="location-suggestions"' : "";
    const inputPadding = field === "business" ? " pr-7" : "";
    return `
      <label class="min-w-0 ${field === "business" ? "relative" : ""} border border-white/10 bg-black/20 px-2.5 py-2 focus-within:border-cyan-300/60">
        <span class="text-[9px] font-medium uppercase text-slate-600">${label}</span>
        <input ${scope === "project" ? "data-project-field" : "data-smart-field"}="${field}" value="${escapeText(current)}" placeholder="${escapeText(scope === "capture" ? ((examples[field] || labels[field] || field) + "...") : (labels[field] || field))}"${list} class="mt-0.5 h-6 w-full bg-transparent p-0${inputPadding} text-xs text-slate-100 outline-none placeholder:text-slate-700" />
      </label>
    `;
  }

  function syncProjectDatasetFromFields(card) {
    const context = projectContext(card);
    card.dataset.personName = context.fields.name || "";
    card.dataset.businessName = context.fields.business || "";
    card.dataset.personRole = context.fields.role || "";
    card.dataset.personLocation = context.fields.location || "";
    card.dataset.personLinkedinUrl = context.fields.linkedinUrl || "";
    card.dataset.sourcePath = context.fields.sourcePath || "linkedin";
    setCardText(card, "[data-summary-name]", card.dataset.personName);
    setCardText(card, "[data-summary-business]", card.dataset.businessName);
    setCardText(card, "[data-summary-role]", card.dataset.personRole);
    setCardText(card, "[data-summary-path]", credentialDisplayValue("sourcePath", card.dataset.sourcePath));
    card.dataset.pursuitSource = sourceFromPath(card.dataset.sourcePath);
    card.dataset.activeSearch = [card.dataset.personName, card.dataset.businessName, card.dataset.personRole, card.dataset.personLocation, credentialDisplayValue("sourcePath", card.dataset.sourcePath), card.dataset.statusLabel, card.dataset.currentStage].join(" ").toLowerCase();
  }

  function syncCredentialToggle(card) {
    const editing = card.dataset.credentialsMode === "edit";
    card.querySelectorAll("[data-edit-credentials]").forEach((button) => {
      button.setAttribute("aria-pressed", editing ? "true" : "false");
      button.classList.toggle("border-cyan-300/60", editing);
      button.classList.toggle("bg-cyan-300/[0.10]", editing);
      button.classList.toggle("text-cyan-100", editing);
      button.textContent = "Edit";
    });
  }

  function renderProjectCard(card) {
    const context = projectContext(card);
    const fieldsContainer = card.querySelector("[data-project-fields]");
    if (fieldsContainer) {
      const fields = ["name", "business", "role", "location", "sourcePath", "linkedinUrl"];
      const editing = card.dataset.credentialsMode === "edit";
      fieldsContainer.innerHTML = `
        <section data-credentials-panel class="border border-white/10 bg-black/15 p-3">
          <div>
            <p class="text-[10px] font-medium uppercase text-cyan-300">Credentials</p>
            <p class="mt-0.5 text-xs text-slate-600">${editing ? "Editing unlocked. Tap Edit again to close." : "Confirmed details. Tap Edit above to change."}</p>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            ${fields.map((field) => credentialTileHtml(field, context.fields[field], editing)).join("")}
          </div>
        </section>
      `;
    }
    renderProjectSummary(card);
    syncCredentialToggle(card);
    refreshBusinessDeleteControls(card);
  }
  function renderProjects() {
    document.querySelectorAll("[data-project-card]").forEach((card) => renderProjectCard(card));
    openPursuitFromHash();
    updateActivePursuitFocus();
  }

  function activeProjectSection(card) {
    return card?.closest?.("[data-active-pursuits]") || null;
  }

  function currentOpenActiveProjectCard() {
    return document.querySelector("[data-active-pursuits] [data-project-card][open]");
  }

  function closeSiblingActiveProjectCards(card) {
    const section = activeProjectSection(card);
    if (!section) return;

    section.querySelectorAll("[data-project-card][open]").forEach((other) => {
      if (other !== card && other instanceof HTMLDetailsElement) other.open = false;
    });
  }

  function updateActivePursuitFocus(card = null) {
    const requestedCard = card instanceof HTMLDetailsElement && card.open && activeProjectSection(card) ? card : null;
    const openCard = requestedCard || currentOpenActiveProjectCard();
    const focused = Boolean(openCard);

    document.querySelectorAll("[data-active-pursuits]").forEach((section) => {
      const sectionFocused = focused && section.contains(openCard);
      section.dataset.focusMode = sectionFocused ? "true" : "false";

      const controls = section.querySelector("[data-active-controls]");
      if (controls) controls.hidden = sectionFocused;

      const scrollWindow = section.querySelector("[data-pursuit-scroll-window]");
      if (scrollWindow) {
        scrollWindow.style.maxHeight = sectionFocused ? "none" : "";
        scrollWindow.style.overflow = sectionFocused ? "visible" : "";
        scrollWindow.style.paddingRight = sectionFocused ? "0" : "";
      }

      section.querySelectorAll("[data-project-card]").forEach((row) => {
        row.hidden = sectionFocused && row !== openCard;
      });
    });

    document.querySelectorAll("[data-quick-capture], [data-pursuit-secondary-section]").forEach((section) => {
      section.hidden = focused;
    });

    if (!focused) {
      applyActivePursuitFilters();
      return;
    }

    if (openCard) {
      openCard.hidden = false;
      window.setTimeout(() => openCard.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  }

  function openPursuitFromHash() {
    if (!window.location.hash.startsWith("#pursuit-")) return;

    const target = document.querySelector(window.location.hash);
    if (!(target instanceof HTMLDetailsElement)) return;

    closeSiblingActiveProjectCards(target);
    target.open = true;
    updateActivePursuitFocus(target);
  }

  function siblingProjectCards(card) {
    const parent = card.parentElement;
    const source = parent ? Array.from(parent.children) : Array.from(document.querySelectorAll("[data-project-card]"));

    return source.filter((node) => node instanceof HTMLDetailsElement && node.matches("[data-project-card]"));
  }

  function navigateProjectCard(card, direction) {
    const cards = siblingProjectCards(card);
    const currentIndex = cards.indexOf(card);
    if (currentIndex < 0) return;

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const target = cards[nextIndex];
    if (!(target instanceof HTMLDetailsElement)) return;

    if (card instanceof HTMLDetailsElement) card.open = false;
    closeSiblingActiveProjectCards(target);
    target.open = true;
    updateActivePursuitFocus(target);
  }

  function captureMessageContext(useExamples = false) {
    return {
      ...captureState,
      fields: displayFields(captureState.fields, useExamples),
      scope: "capture",
    };
  }

  async function requestMessageCoach(context, currentMessage = "") {
    const response = await fetch("/api/message-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionId: context.actionId,
        fields: context.fields,
        draftMode: context.draftMode,
        roughDraft: context.roughDraft,
        messageDirection: context.messageDirection,
        messageReference: context.messageReference || "",
        currentMessage,
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || "Could not generate messages.");
    if (!Array.isArray(body?.messages) || !body.messages.length) throw new Error("No message options returned.");

    return body.messages.filter(Boolean).slice(0, 3);
  }

  async function regenerateCaptureMessages(button) {
    const context = captureMessageContext(false);
    const currentMessage = currentCoachMessage(context);
    captureState.selectedMessage = "";
    captureState.messageIndex = 0;
    captureState.aiOptions = null;
    persistCaptureState();
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Asking ChatGPT...";

    try {
      captureState.aiOptions = await requestMessageCoach({ ...context, selectedMessage: "", aiOptions: null }, currentMessage);
      captureState.aiError = "";
      persistCaptureState();
    } catch (error) {
      captureState.aiError = error instanceof Error ? error.message : "Could not reach ChatGPT.";
      persistCaptureState();
      console.error("Message Coach fallback used:", error);
    }

    button.disabled = false;
    button.textContent = previousText;
    renderCapture();
  }

  async function regenerateProjectMessages(card, button) {
    const context = projectContext(card);
    const currentMessage = currentCoachMessage(context);
    card.dataset.selectedMessage = "";
    card.dataset.messageIndex = "0";
    card.dataset.aiOptions = "";
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Asking ChatGPT...";

    try {
      const options = await requestMessageCoach({ ...context, selectedMessage: "", aiOptions: null }, currentMessage);
      card.dataset.aiOptions = JSON.stringify(options);
      card.dataset.aiError = "";
    } catch (error) {
      card.dataset.aiError = error instanceof Error ? error.message : "Could not reach ChatGPT.";
      console.error("Message Coach fallback used:", error);
    }

    button.disabled = false;
    button.textContent = previousText;
    renderProjectCard(card);
  }

  function clearCaptureRequiredHighlights() {
    document.querySelectorAll("[data-smart-field], [data-message-coach]").forEach((node) => {
      node.style.borderColor = "";
      node.style.backgroundColor = "";
    });
  }

function showError(message) {
    const error = document.querySelector("[data-pursuit-error]");
    if (!error) return;
    error.textContent = message;
    error.classList.toggle("hidden", !message);
    if (message) {
      error.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  function setStartBusy(isBusy) {
    const button = document.querySelector("[data-capture-review]");
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? "Starting..." : "Start pursuit";
  }

  async function startPursuit() {
    showError("");
    clearCaptureRequiredHighlights();
    const action = actions[captureState.actionId];
    if (!action) {
      showError("Select a pursuit action first.");
      return;
    }
    if (!captureState.fields.name.trim() && !captureState.linkedinHtml.trim() && !captureState.notes.trim()) {
      showError("Add a name, LinkedIn HTML, or a quick note first.");
      return;
    }
    const missingFoundFields = captureState.actionId === "found" ? missingCorePursuitFields(captureState.fields) : [];
    const savingDraft = captureState.actionId === "found" && (missingFoundFields.length > 0 || !captureState.selectedMessage.trim());
    captureState.fields.name = titleCaseName(captureState.fields.name);

    setStartBusy(true);
    try {
      const options = coachOptions(captureMessageContext(false));
      const message = captureState.selectedMessage || options[captureState.messageIndex] || options[0] || "";
      const actualSentence = captureSentence(false);
      const contextLines = [actualSentence || ("Quick capture: " + action.label + ".")];
      if (captureState.linkedinHtml.trim()) contextLines.push("LinkedIn HTML: " + compactContext(captureState.linkedinHtml, 2500));
      if (captureState.notes.trim()) contextLines.push("Notes: " + compactContext(captureState.notes, 800));
      if (action.needsMessage && message) contextLines.push("Message to use: " + message);
      const note = contextLines.join("\n");
      const analysisResponse = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const body = await analysisResponse.json().catch(() => null);
      if (!analysisResponse.ok) throw new Error(body?.error || "Could not start this pursuit.");
      const name = splitFullName(captureState.fields.name || "Unknown Contact");
      const analysis = {
        ...body,
        originalNote: note,
        person: {
          ...body.person,
          firstName: name.firstName || body.person?.firstName || "Unknown",
          lastName: name.lastName || body.person?.lastName || "",
          role: captureState.fields.role || body.person?.role || "",
          linkedinUrl: captureState.linkedinHtml.trim().startsWith("http") ? captureState.linkedinHtml.trim() : body.person?.linkedinUrl || "",
          email: captureState.fields.email || body.person?.email || "",
          location: captureState.fields.location || body.person?.location || "",
        },
        business: {
          ...body.business,
          name: captureState.fields.business || body.business?.name || "Unknown company",
        },
        stage: savingDraft ? "Found" : action.stage,
        source: captureState.fields.sourcePath === "email-cc" ? "Email referral" : action.source || body.source || "LinkedIn",
        storeLabAngle: captureState.fields.sourcePath === "email-cc" ? "Found via existing relationship / email cc" + (captureState.fields.sourceContext ? ": " + captureState.fields.sourceContext : "") : body.storeLabAngle,
        currentStatus: savingDraft ? "Draft saved. Complete credentials before sending." : actualSentence || body.whatChanged || action.label,
        whatChanged: savingDraft ? "Draft saved from quick capture." : actualSentence || body.whatChanged || action.label,
        nextAction: savingDraft ? "Complete credentials, then choose the next outreach step." : action.nextAction,
        suggestedMessage: action.needsMessage ? message : body.suggestedMessage,
        messageText: savingDraft ? "" : action.needsMessage ? message : body.messageText,
        captureNote: captureState.notes,
      };
      const saveResponse = await fetch("/api/pursuits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const saveBody = await saveResponse.json().catch(() => null);
      if (!saveResponse.ok) throw new Error(saveBody?.error || "Could not save this pursuit.");
      clearCaptureState();
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
    const field = card.querySelector('[data-entry-field="' + name + '"]');
    return field?.value?.trim() || "";
  }

  function syncDroppedValue(target, value) {
    target.value = value;

    if (target.matches("[data-smart-field]")) {
      const field = target.getAttribute("data-smart-field");
      captureState.fields[field] = field === "name" ? titleCaseName(value) : value.trim();
      target.value = captureState.fields[field];
      if (field === "business") updateBusinessDeleteControl(target);
      if (field === "business") updateBusinessDeleteControl(target);
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      const coach = document.querySelector("[data-message-coach]");
      if (coach) renderMessageCarousel(coach, { ...captureState, fields: displayFields(captureState.fields, true), scope: "capture" });
      return;
    }

    if (target.matches("[data-capture-linkedin-html]")) {
      captureState.linkedinHtml = value;
      return;
    }

    if (target.matches("[data-capture-notes]")) {
      captureState.notes = value;
      return;
    }

    if (target.matches("[data-project-field]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        card.dataset.aiOptions = "";
        card.dataset.aiError = "";
        card.dataset.messageIndex = "0";
        renderProjectSummary(card);
      }
    }
  }

  function pursuitPersonName(pursuit) {
    const firstName = pursuit?.person?.firstName || "";
    const lastName = pursuit?.person?.lastName || "";
    return (firstName + " " + lastName).trim();
  }

  function statusLabel(stage) {
    const labels = {
      Found: "Found",
      "Message Drafted": "Message needed",
      "Connection Sent": "Request sent",
      Connected: "Connected",
      "Follow-up Sent": "Follow-up sent",
      "Demo Proposed": "Demo proposed",
      "Demo Accepted": "Demo accepted",
      "Email / Time Requested": "Email requested",
      "Email Captured": "Email captured",
      "Email Sent": "Email sent",
      "Calendar Sent": "Calendar sent",
      "Demo Booked": "Demo booked",
      "Successful Connection": "Wins",
      "Gone Quiet": "Need tactic",
      Parked: "Archived",
      "Not Relevant": "Not relevant",
    };

    return labels[stage] || stage;
  }

  function pursuitStatusLabel(pursuit) {
    return statusLabel(pursuit?.stage || "Found");
  }

  function quickActionIdForStage(stage) {
    if (stage === "Found" || stage === "Message Drafted" || stage === "Connection Sent") return "request-sent";
    if (stage === "Connected" || stage === "Follow-up Sent") return "connected";
    if (stage === "Demo Proposed") return "demo-proposed";
    if (stage === "Demo Accepted") return "demo-accepted";
    if (stage === "Email / Time Requested" || stage === "Email Captured") return "email-received";
    if (stage === "Email Sent") return "email-sent";
    if (stage === "Calendar Sent") return "calendar-sent";
    if (stage === "Demo Booked") return "booked";
    if (stage === "Successful Connection") return "successful-connection";
    if (stage === "Gone Quiet") return "need-tactic";
    if (stage === "Parked") return "need-tactic";
    return "request-sent";
  }

  function setCardText(card, selector, value) {
    const targets = Array.from(card.querySelectorAll(selector));
    if (!targets.length) return;

    if (targets[0].matches("[data-quick-project-action]")) {
      targets.forEach((target) => {
        target.value = quickActionIdForStage(card.dataset.currentStage || "Found");
        target.setAttribute("aria-label", "Status: " + (value || ""));
      });
      return;
    }

    targets.forEach((target) => {
      target.textContent = value || "";
    });
  }

  function setEntryValue(card, name, value) {
    const field = card.querySelector('[data-entry-field="' + name + '"]');
    if (field) field.value = value || "";
  }

  function syncProjectActionControls(card) {
    const actionValue = quickActionIdForStage(card.dataset.currentStage || "Found");
    card.querySelectorAll("[data-project-action], [data-quick-project-action]").forEach((control) => {
      control.value = actionValue;
      if (control.matches("[data-quick-project-action]")) {
        control.setAttribute("aria-label", "Status: " + statusLabel(card.dataset.currentStage || "Found"));
      }
    });
  }
  function applyPursuitToCard(card, pursuit) {
    if (!pursuit) {
      window.location.reload();
      return;
    }

    const name = pursuitPersonName(pursuit) || card.dataset.personName || "New person";
    const businessName = pursuit.business?.name || card.dataset.businessName || "Unknown business";
    addBusinessSuggestion(businessName, {
      id: pursuit.business?.id || "",
      peopleCount: 1,
      pursuitCount: 1,
      opportunityCount: 0,
    });
    const role = pursuit.person?.role || "";
    const location = pursuit.person?.location || "";
    const linkedinUrl = pursuit.person?.linkedinUrl || "";
    addLocationSuggestion(location);
    const status = pursuitStatusLabel(pursuit);
    const nextSummary = pursuit.nextAction || pursuit.currentStatus || "No next action yet.";
    const updatedLabel = pursuit.updatedAt ? "Updated " + formatDateTime(pursuit.updatedAt) : "";

    card.dataset.currentStage = pursuit.stage || card.dataset.currentStage || "Found";
    card.dataset.statusLabel = status;
    card.dataset.personName = name;
    card.dataset.businessName = businessName;
    card.dataset.personRole = role;
    card.dataset.personLocation = location;
    card.dataset.personLinkedinUrl = linkedinUrl;
    card.dataset.pursuitSource = pursuit.source || card.dataset.pursuitSource || "LinkedIn";
    card.dataset.sourcePath = sourcePathFromSource(card.dataset.pursuitSource);
    const pathLabel = credentialDisplayValue("sourcePath", card.dataset.sourcePath);
    card.dataset.activeStatus = status;
    card.dataset.activeUpdatedAt = pursuit.updatedAt || card.dataset.activeUpdatedAt || "";
    card.dataset.activeSearch = [name, businessName, role, location, pathLabel, status, pursuit.currentStatus || "", pursuit.nextAction || ""].join(" ").toLowerCase();

    setCardText(card, "[data-summary-name]", name);
    setCardText(card, "[data-summary-business]", businessName);
    setCardText(card, "[data-summary-role]", role);
    setCardText(card, "[data-summary-path]", pathLabel);
    setCardText(card, "[data-summary-next]", nextSummary);
    setCardText(card, "[data-summary-stage]", status);
    setCardText(card, "[data-summary-updated]", updatedLabel);
    setCardText(card, "[data-summary-updated-detail]", updatedLabel);
    setEntryValue(card, "currentStatus", pursuit.currentStatus || "");
    setEntryValue(card, "nextAction", pursuit.nextAction || "");
    syncProjectActionControls(card);
    renderProjectCard(card);
    syncProjectActionControls(card);
    card.removeAttribute("open");
    updateActivePursuitFocus();
  }
  async function updateProject(card, button) {
    const pursuitId = card.getAttribute("data-pursuit-id");
    if (!pursuitId) return;
    const context = projectContext(card);
    const action = actionById(context.actionId);
    const sentMessage = projectSentMessage(card);
    const name = splitFullName(context.fields.name);
    const generatedStatus = action.sentence(context.fields);
    const status = entryValue(card, "currentStatus") || generatedStatus;
    const nextAction = entryValue(card, "nextAction") || action.nextAction;

    entryError(card, "");
    if (action.stage !== "Found") {
      const missing = missingCorePursuitFields(context.fields);
      if (missing.length) {
        entryError(card, "Complete " + missing.map(coreFieldLabel).join(", ") + " before saving this update.");
        const firstMissing = card.querySelector('[data-project-field="' + missing[0] + '"]');
        firstMissing?.focus?.();
        return;
      }
    }
    if (action.needsMessage && !sentMessage) {
      entryError(card, "Add the message you actually sent before saving this update.");
      const sentField = card.querySelector("[data-project-sent-message]");
      sentField?.focus?.();
      return;
    }

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";

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
            location: context.fields.location,
            linkedinUrl: context.fields.linkedinUrl,
          },
          business: {
            name: context.fields.business,
          },
          source: sourceFromPath(context.fields.sourcePath),
          currentStatus: status,
          nextAction,
          messageText: sentMessage,
          note: status,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update this project.");
      if (body?.pursuit?.stage === "Successful Connection") {
        window.location.href = "/wins";
        return;
      }
      if (body?.pursuit?.stage === "Gone Quiet") {
        window.location.href = "/needs-tactic";
        return;
      }
      applyPursuitToCard(card, body?.pursuit);
      button.disabled = false;
      button.textContent = previousText;
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not update this project.");
      button.disabled = false;
      button.textContent = previousText;
    }
  }

  async function quickUpdateProjectStatus(card, select) {
    const pursuitId = card.getAttribute("data-pursuit-id");
    const actionId = select.value;
    if (!pursuitId || !actions[actionId]) return;

    const context = projectContext(card);
    const action = actionById(actionId);
    const status = action.sentence(context.fields);
    const nextAction = action.nextAction;
    const previousValue = quickActionIdForStage(card.dataset.currentStage || "Found");
    entryError(card, "");
    if (action.stage !== "Found") {
      const missing = missingCorePursuitFields(context.fields);
      if (missing.length) {
        card.open = true;
        card.querySelectorAll("[data-project-action], [data-quick-project-action]").forEach((control) => {
          control.value = previousValue;
        });
        entryError(card, "Complete credentials before moving this pursuit forward: " + missing.map(coreFieldLabel).join(", ") + ".");
        const firstMissing = card.querySelector('[data-project-field="' + missing[0] + '"]');
        firstMissing?.focus?.();
        return;
      }
    }
    card.querySelectorAll("[data-project-action], [data-quick-project-action]").forEach((control) => {
      control.value = actionId;
    });

    select.disabled = true;

    try {
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: action.stage,
          currentStatus: status,
          nextAction,
          note: "Quick status changed to " + action.label + ".",
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update this status.");
      if (body?.pursuit?.stage === "Successful Connection") {
        window.location.href = "/wins";
        return;
      }
      if (body?.pursuit?.stage === "Gone Quiet") {
        window.location.href = "/needs-tactic";
        return;
      }
      if (body?.pursuit?.stage === "Parked") {
        card.remove();
        return;
      }
      applyPursuitToCard(card, body?.pursuit);
      select.disabled = false;
    } catch (error) {
      card.querySelectorAll("[data-project-action], [data-quick-project-action]").forEach((control) => {
        control.value = previousValue;
      });
      card.open = true;
      entryError(card, error instanceof Error ? error.message : "Could not update this status.");
      select.disabled = false;
    }
  }
  function nextActionForStage(stage) {
    const stageActions = {
      Found: "Draft a short, personal connection request.",
      "Message Drafted": "Review the suggested connection message, then send the LinkedIn request.",
      "Connection Sent": "Monitor for the connection request to be accepted.",
      Connected: "Send a warm follow-up and decide whether to softly mention StoreLab.",
      "Follow-up Sent": "Monitor for a reply, then follow up lightly if they go quiet.",
      "Demo Proposed": "Monitor for their reply to the demo suggestion.",
      "Demo Accepted": "Ask for their email address and say you will lock in time by email.",
      "Email / Time Requested": "Monitor for their email address or availability.",
      "Email Captured": "Send an email to confirm day, time, and Teams or onsite Pymble.",
      "Email Sent": "Send the calendar booking once the time is agreed.",
      "Calendar Sent": "Monitor for the calendar booking to be accepted.",
      "Demo Booked": "Prepare the StoreLab demo brief and best angle.",
      "Successful Connection": "Keep this relationship warm and watch for the next useful business signal.",
      "Gone Quiet": "Try a different angle, channel, or timing before giving up.",
      Parked: "Leave parked until a stronger signal appears.",
    };
    return stageActions[stage] || "Review this relationship and decide the next outreach step.";
  }
  function stageAfterMessageUse(actionId) {
    const map = {
      found: "Connection Sent",
      "message-needed": "Connection Sent",
      connected: "Follow-up Sent",
      "re-engage": "Follow-up Sent",
      "request-received": "Follow-up Sent",
      "demo-proposed": "Demo Proposed",
      "demo-accepted": "Email / Time Requested",
      "email-sent": "Email Sent",
    };
    return map[actionId] || actionById(actionId).stage;
  }


  function statusAfterMessageUse(actionId, fields) {
    const name = fields.name || "this contact";
    const business = fields.business || "their business";
    const demoType = fields.demoType || "demo";

    if (actionId === "found" || actionId === "message-needed") return 'Connection request sent to "' + name + '" with message.';
    if (actionId === "connected") return 'First warm follow-up sent to "' + name + '".';
    if (actionId === "re-engage") return 'Re-engagement message sent to "' + name + '" at "' + business + '".';
    if (actionId === "request-received") return 'Accepted inbound connection request from "' + name + '" and sent a warm reply.';
    if (actionId === "demo-proposed") return 'Demo proposed to "' + name + '" from "' + business + '".';
    if (actionId === "demo-accepted") return 'Message sent to "' + name + '" requesting email address or demo timing.';
    if (actionId === "email-sent") return 'Email sent to "' + name + '" to confirm day and time for "' + demoType + '" demo.';

    return actionById(actionId).sentence(fields);
  }
  function noteAfterMessageUse(actionId) {
    const map = {
      found: "Used Message Coach connection request.",
      "message-needed": "Used Message Coach connection request.",
      connected: "Used Message Coach first warm follow-up.",
      "re-engage": "Used Message Coach re-engagement message.",
      "request-received": "Used Message Coach reply to inbound request.",
      "demo-proposed": "Used Message Coach demo suggestion.",
      "demo-accepted": "Used Message Coach email request.",
      "email-sent": "Used Message Coach email body.",
    };
    return map[actionId] || "Used Message Coach message.";
  }

  async function useProjectMessage(card, button) {
    const pursuitId = card.getAttribute("data-pursuit-id");
    if (!pursuitId) return;
    const context = projectContext(card);
    const action = actionById(context.actionId);
    const options = coachOptions(context);
    const message = button.getAttribute("data-project-use-message") || context.selectedMessage || options[context.messageIndex] || options[0] || "";
    if (!message) {
      entryError(card, "Choose or write the message you sent first.");
      return;
    }
    if (action.stage !== "Found") {
      const missing = missingCorePursuitFields(context.fields);
      if (missing.length) {
        entryError(card, "Complete " + missing.map(coreFieldLabel).join(", ") + " before saving this update.");
        const firstMissing = card.querySelector('[data-project-field="' + missing[0] + '"]');
        firstMissing?.focus?.();
        return;
      }
    }

    setProjectSentMessage(card, message);
    const name = splitFullName(context.fields.name);
    const nextStage = stageAfterMessageUse(context.actionId);
    const nextAction = nextActionForStage(nextStage) || action.nextAction;
    const status = statusAfterMessageUse(context.actionId, context.fields);
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";
    entryError(card, "");

    try {
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: nextStage,
          person: {
            firstName: name.firstName,
            lastName: name.lastName,
            role: context.fields.role,
            email: context.fields.email,
            location: context.fields.location,
            linkedinUrl: context.fields.linkedinUrl,
          },
          business: {
            name: context.fields.business,
          },
          source: sourceFromPath(context.fields.sourcePath),
          currentStatus: status,
          nextAction,
          messageText: message,
          note: noteAfterMessageUse(context.actionId),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not save this message.");
      applyPursuitToCard(card, body?.pursuit);
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not save this message.");
      button.disabled = false;
      button.textContent = previousText;
    }
  }

  async function addProjectNote(button) {
    const card = button.closest("[data-project-card]");
    const pursuitId = card?.getAttribute("data-pursuit-id");
    const textarea = card?.querySelector("[data-project-note]");
    const note = textarea?.value?.trim() || "";
    if (!card || !pursuitId || !note) return;

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Adding...";
    entryError(card, "");

    try {
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteOnly: true,
          note,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not add this note.");
      window.location.reload();
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not add this note.");
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
      applyPursuitToCard(card, body?.pursuit);
      button.disabled = false;
      button.textContent = previousText;
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not update this entry.");
      button.disabled = false;
      button.textContent = previousText;
    }
  }
  function overviewActivityMatches(value, filter) {
    if (!filter || filter === "all") return true;
    const days = filter === "week" ? 7 : filter === "month" ? 31 : filter === "year" ? 365 : 0;
    if (!days) return true;
    const timestamp = new Date(value || "").getTime();
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
  }

  function applyOverviewFilters() {
    const rows = Array.from(document.querySelectorAll("[data-overview-row]"));
    if (!rows.length) return;

    const query = String(document.querySelector("[data-overview-query]")?.value || "").trim().toLowerCase();
    const business = document.querySelector('[data-overview-filter="business"]')?.value || "all";
    const source = document.querySelector('[data-overview-filter="source"]')?.value || "all";
    const status = document.querySelector('[data-overview-filter="status"]')?.value || "all";
    const activity = document.querySelector('[data-overview-filter="activity"]')?.value || "all";
    const activeFilter = source !== "all" ? "source" : business !== "all" ? "business" : status !== "all" ? "status" : activity !== "all" ? "activity" : "";
    let shown = 0;

    document.querySelectorAll("[data-overview-filter]").forEach((control) => {
      const filterName = control.getAttribute("data-overview-filter") || "";
      control.disabled = Boolean(activeFilter && filterName !== activeFilter);
    });

    const reset = document.querySelector("[data-overview-reset]");
    if (reset) reset.hidden = !activeFilter;

    rows.forEach((row) => {
      const matchesBusiness = business === "all" || row.dataset.overviewBusiness === business;
      const matchesSource = source === "all" || row.dataset.overviewSource === source;
      const matchesStatus = status === "all" || row.dataset.overviewStatus === status;
      const matchesActivity = overviewActivityMatches(row.dataset.overviewActivityAt, activity);
      const matchesQuery = !query || String(row.dataset.overviewSearch || row.textContent || "").toLowerCase().includes(query);
      const visible = matchesSource && matchesBusiness && matchesStatus && matchesActivity && matchesQuery;
      row.hidden = !visible;
      if (visible) shown += 1;
    });

    const empty = document.querySelector("[data-overview-empty]");
    if (empty) empty.hidden = shown > 0;
  }

  function activeWindowMatches(value, filter) {
    if (!filter || filter === "all") return true;
    const days = filter === "day" ? 1 : filter === "week" ? 7 : filter === "month" ? 31 : filter === "year" ? 365 : 0;
    if (!days) return true;
    const timestamp = new Date(value || "").getTime();
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
  }

  function applyActivePursuitFilters() {
    const rows = Array.from(document.querySelectorAll("[data-active-pursuits] [data-active-row]"));
    if (!rows.length) return;

    const query = String(document.querySelector("[data-active-search]")?.value || "").trim().toLowerCase();
    const status = document.querySelector('[data-active-filter="status"]')?.value || "all";
    const windowFilter = document.querySelector('[data-active-filter="window"]')?.value || "all";
    const activeFilter = query ? "search" : status !== "all" ? "status" : windowFilter !== "all" ? "window" : "";

    const search = document.querySelector("[data-active-search]");
    if (search) search.disabled = Boolean(activeFilter && activeFilter !== "search");
    document.querySelectorAll("[data-active-filter]").forEach((control) => {
      const filterName = control.getAttribute("data-active-filter") || "";
      control.disabled = Boolean(activeFilter && filterName !== activeFilter);
    });
    const reset = document.querySelector("[data-active-reset]");
    if (reset) reset.hidden = !activeFilter;

    rows.forEach((row) => {
      const matchesSearch = !query || String(row.dataset.activeSearch || row.textContent || "").toLowerCase().includes(query);
      const matchesStatus = status === "all" || row.dataset.activeStatus === status;
      const matchesWindow = activeWindowMatches(row.dataset.activeUpdatedAt, windowFilter);
      row.hidden = !(matchesSearch && matchesStatus && matchesWindow);
    });
  }
  function clearArchiveConfirm(card) {
    card?.querySelectorAll("[data-archive-confirm]").forEach((node) => node.remove());
  }

  function showArchiveConfirm(button) {
    const card = button.closest("[data-project-card]");
    if (!card) return;

    clearArchiveConfirm(card);
    const prompt = document.createElement("span");
    prompt.setAttribute("data-archive-confirm", "true");
    prompt.className = "ml-1 inline-flex items-center gap-1 border border-white/10 bg-black px-2 py-1 text-[11px] text-slate-300";
    prompt.innerHTML = '<span>Archive?</span><button type="button" data-project-archive-confirm="yes" class="text-cyan-300 hover:text-cyan-100">Yes</button><button type="button" data-project-archive-confirm="no" class="text-slate-500 hover:text-slate-200">No</button>';
    button.insertAdjacentElement("afterend", prompt);
  }
  async function archiveProject(button) {
    const card = button.closest("[data-project-card]");
    const pursuitId = card?.getAttribute("data-pursuit-id");
    if (!card || !pursuitId) return;

    entryError(card, "");
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Archiving...";

    try {
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "Parked",
          currentStatus: entryValue(card, "currentStatus") || "Archived from active pursuits.",
          nextAction: "Archived. Keep the relationship in memory until a useful signal appears.",
          note: "Archived from active pursuits. Previous status: " + (card.dataset.currentStage || "Found") + ".",
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not archive this pursuit.");
      card.remove();
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not archive this pursuit.");
      button.disabled = false;
      button.textContent = previousText;
    }
  }

  function openCredentialsEditor(trigger) {
    const card = trigger?.closest?.("[data-project-card]");
    if (!(card instanceof HTMLDetailsElement)) return false;

    if (card.dataset.credentialsMode === "edit") {
      return lockCredentialsEditor(trigger);
    }

    closeSiblingActiveProjectCards(card);
    card.open = true;
    card.dataset.credentialsMode = "edit";
    renderProjectCard(card);
    updateActivePursuitFocus(card);
    card.scrollIntoView({ block: "start", behavior: "smooth" });
    card.querySelector("[data-project-field]")?.focus?.();
    return true;
  }

  function lockCredentialsEditor(trigger) {
    const card = trigger?.closest?.("[data-project-card]");
    if (!(card instanceof HTMLDetailsElement)) return false;

    syncProjectDatasetFromFields(card);
    card.dataset.credentialsMode = "view";
    renderProjectCard(card);
    return true;
  }
  async function restoreProject(button) {
    const card = button.closest("[data-project-card]");
    const pursuitId = card?.getAttribute("data-pursuit-id");
    if (!card || !pursuitId) return;

    const wasSuccessful = card.dataset.currentStage === "Successful Connection";
    const restoreStage = wasSuccessful ? "Connected" : card.dataset.restoreStage || "Connected";
    const label = wasSuccessful ? "Reopening..." : "Restoring...";
    const restoredStatus = wasSuccessful
      ? "Reopened from Wins. Review this relationship and choose the next action."
      : "Restored from archive to " + statusLabel(restoreStage) + ". Review this relationship and choose the next action.";
    const restoredNote = wasSuccessful ? "Reopened from Wins." : "Restored from archive to " + restoreStage + ".";

    entryError(card, "");
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = label;

    try {
      const response = await fetch("/api/pursuits/" + pursuitId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: restoreStage,
          currentStatus: restoredStatus,
          note: restoredNote,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not restore this pursuit.");

      window.location.assign("/?restored=" + Date.now() + "#pursuit-" + encodeURIComponent(pursuitId));
    } catch (error) {
      entryError(card, error instanceof Error ? error.message : "Could not restore this pursuit.");
      button.disabled = false;
      button.textContent = previousText;
    }
  }
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-overview-query]")) {
      applyOverviewFilters();
      return;
    }

    if (target.matches("[data-active-search]")) {
      applyActivePursuitFilters();
      return;
    }

    if (target.matches("[data-smart-field]")) {
      const smartField = target.getAttribute("data-smart-field");
      captureState.fields[smartField] = target.value;
      if (smartField === "business") updateBusinessDeleteControl(target);
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.aiError = "";
      persistCaptureState();
      captureState.messageIndex = 0;
      const sentenceTarget = document.querySelector("[data-sentence-preview]");
      if (sentenceTarget) sentenceTarget.textContent = captureSentence();
      const coach = document.querySelector("[data-message-coach]");
      if (coach) renderMessageCarousel(coach, { ...captureState, fields: displayFields(captureState.fields, true), scope: "capture" });
      return;
    }

    if (target.matches("[data-capture-linkedin-html]")) {
      captureState.linkedinHtml = target.value;
      persistCaptureState();
      return;
    }

    if (target.matches("[data-capture-notes]")) {
      captureState.notes = target.value;
      persistCaptureState();
      return;
    }

    if (target.matches("[data-capture-message-direction]")) {
      captureState.messageDirection = target.value;
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      persistCaptureState();
      return;
    }

    if (target.matches("[data-project-message-direction]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.messageDirection = target.value;
        card.dataset.selectedMessage = "";
        card.dataset.aiOptions = "";
        card.dataset.aiError = "";
        card.dataset.messageIndex = "0";
      }
      return;
    }

    if (target.matches("[data-capture-rough-draft]")) {
      captureState.roughDraft = target.value;
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      persistCaptureState();
      const coach = document.querySelector("[data-message-coach]");
      if (coach) renderMessageCarousel(coach, { ...captureState, fields: displayFields(captureState.fields, true), scope: "capture" });
      return;
    }

    if (target.matches("[data-project-field]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        card.dataset.aiOptions = "";
        card.dataset.aiError = "";
        card.dataset.messageIndex = "0";
        renderProjectSummary(card);
        if (target.getAttribute("data-project-field") === "business") updateBusinessDeleteControl(target);
      }
      return;
    }

    if (target.matches("[data-project-sent-message]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        const message = target.value.trim();
        card.dataset.selectedMessage = message;
        card.dataset.messageReference = message;
      }
      return;
    }
    if (target.matches("[data-project-rough-draft]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.roughDraft = target.value;
        card.dataset.selectedMessage = "";
        card.dataset.aiOptions = "";
        card.dataset.aiError = "";
        card.dataset.messageIndex = "0";
        renderProjectCard(card);
      }
    }
  });


  document.addEventListener("dragover", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("[data-smart-field], [data-capture-linkedin-html], [data-capture-notes], [data-project-field], [data-project-sent-message], [data-entry-field]")) return;
    event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
    if (!target.matches("[data-smart-field], [data-capture-linkedin-html], [data-capture-notes], [data-project-field], [data-project-sent-message], [data-entry-field]")) return;

    const text = event.dataTransfer?.getData("text/plain")?.trim();
    if (!text) return;

    event.preventDefault();
    syncDroppedValue(target, text);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
  document.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-smart-field="business"], [data-project-field="business"]')) {
      addBusinessSuggestion(target.value);
      updateBusinessDeleteControl(target);
    }

    if (target.matches('[data-smart-field="name"]')) {
      const formatted = titleCaseName(target.value);
      target.value = formatted;
      captureState.fields.name = formatted;
      persistCaptureState();
      const sentenceTarget = document.querySelector("[data-sentence-preview]");
      if (sentenceTarget) sentenceTarget.textContent = captureSentence();
      const coach = document.querySelector("[data-message-coach]");
      if (coach) renderMessageCarousel(coach, { ...captureState, fields: displayFields(captureState.fields, true), scope: "capture" });
    }
  });
  window.addEventListener("hashchange", openPursuitFromHash);
  document.addEventListener("toggle", (event) => {
    const card = event.target;
    if (!(card instanceof HTMLDetailsElement) || !card.matches("[data-project-card]")) return;
    if (card.open) {
      syncProjectActionControls(card);
      closeSiblingActiveProjectCards(card);
      syncProjectActionControls(card);
    }
    updateActivePursuitFocus(card.open ? card : null);
  }, true);

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-overview-filter]")) {
      applyOverviewFilters();
      return;
    }

    if (target.matches("[data-active-filter]")) {
      applyActivePursuitFilters();
      return;
    }

    if (target.matches("[data-source-path-select]")) {
      captureState.fields.sourcePath = target.value || "linkedin";
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      persistCaptureState();
      renderCapture();
      return;
    }
    if (target.matches("[data-smart-field]")) {
      const smartField = target.getAttribute("data-smart-field");
      captureState.fields[smartField] = target.value;
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      persistCaptureState();
      renderCapture();
      return;
    }

    if (target.matches("[data-action-select]")) {
      const actionId = target.value;
      if (!actions[actionId]) {
        resetCaptureDraft();
        renderCapture();
        return;
      }

      captureState.actionId = actionId;
      captureState.expanded = true;
      captureState.selectedMessage = "";
      captureState.roughDraft = "";
      captureState.messageDirection = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      persistCaptureState();
      renderCapture();
      return;
    }
    if (target.matches("[data-quick-project-action]")) {
      const card = target.closest("[data-project-card]");
      if (card) quickUpdateProjectStatus(card, target);
      return;
    }

    if (target.matches("[data-project-field]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        card.dataset.aiOptions = "";
        card.dataset.messageIndex = "0";
        renderProjectSummary(card);
      }
      return;
    }

    if (target.matches("[data-project-action]")) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        card.dataset.roughDraft = "";
        card.dataset.messageDirection = "";
        card.dataset.messageIndex = "0";
        const context = projectContext(card);
        const action = actionById(context.actionId);
        setEntryValue(card, "currentStatus", action.sentence(context.fields));
        setEntryValue(card, "nextAction", action.nextAction);
        renderProjectCard(card);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("[data-smart-field]")) return;

    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("[data-capture-form]")) {
      event.preventDefault();
      const submitter = event.submitter;
      if (submitter instanceof HTMLElement && submitter.matches("[data-capture-review]")) {
        startPursuit();
      }
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const editCredentials = target.closest("[data-edit-credentials]");
    if (editCredentials) {
      event.preventDefault();
      event.stopPropagation();
      openCredentialsEditor(editCredentials);
      return;
    }

    const lockCredentials = target.closest("[data-lock-credentials]");
    if (lockCredentials) {
      event.preventDefault();
      event.stopPropagation();
      lockCredentialsEditor(lockCredentials);
    }
  }, true);
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const dashboardReset = target.closest("[data-dashboard-reset]");
    if (dashboardReset) {
      resetDashboardView();
      return;
    }

    const activeReset = target.closest("[data-active-reset]");
    if (activeReset) {
      const search = document.querySelector("[data-active-search]");
      if (search) search.value = "";
      document.querySelectorAll("[data-active-filter]").forEach((control) => {
        control.value = "all";
        control.disabled = false;
      });
      applyActivePursuitFilters();
      return;
    }

    const overviewReset = target.closest("[data-overview-reset]");
    if (overviewReset) {
      const queryInput = document.querySelector("[data-overview-query]");
      if (queryInput) queryInput.value = "";
      document.querySelectorAll("[data-overview-filter]").forEach((control) => {
        control.value = "all";
        control.disabled = false;
      });
      applyOverviewFilters();
      return;
    }

    const businessDeleteAnswer = target.closest("[data-business-delete-answer]");
    if (businessDeleteAnswer) {
      event.preventDefault();
      event.stopPropagation();
      if (businessDeleteAnswer.getAttribute("data-business-delete-answer") === "yes") {
        archiveBusinessFromField(businessDeleteAnswer);
      } else {
        clearBusinessDeleteConfirm(businessDeleteAnswer.closest("label"));
      }
      return;
    }

    const businessDelete = target.closest("[data-business-delete]");
    if (businessDelete) {
      event.preventDefault();
      event.stopPropagation();
      showBusinessDeleteConfirm(businessDelete);
      return;
    }

    const captureCollapse = target.closest("[data-capture-collapse]");
    if (captureCollapse) {
      resetCaptureDraft();
      renderCapture();
      return;
    }

    const sourcePathOption = target.closest("[data-source-path-option]");
    if (sourcePathOption) {
      captureState.fields.sourcePath = sourcePathOption.getAttribute("data-source-path-option") || "linkedin";
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      setCaptureExpanded(true);
      persistCaptureState();
      renderCapture();
      return;
    }

    const captureMode = target.closest("[data-capture-draft-mode]");
    if (captureMode) {
      captureState.draftMode = captureMode.getAttribute("data-capture-draft-mode") || "ai";
      captureState.selectedMessage = "";
      captureState.aiOptions = null;
      captureState.messageIndex = 0;
      persistCaptureState();
      renderCapture();
      return;
    }

    const captureRegenerate = target.closest("[data-capture-regenerate]");
    if (captureRegenerate) {
      regenerateCaptureMessages(captureRegenerate);
      return;
    }

    const captureClear = target.closest("[data-capture-clear-message]");
    if (captureClear) {
      captureState.selectedMessage = "";
      renderCapture();
      return;
    }

    const captureNav = target.closest("[data-capture-message-nav]");
    if (captureNav) {
      const options = coachOptions(captureMessageContext(false));
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

    const editCredentials = target.closest("[data-edit-credentials]");
    if (editCredentials) {
      event.preventDefault();
      event.stopPropagation();
      openCredentialsEditor(editCredentials);
      return;
    }

    const lockCredentials = target.closest("[data-lock-credentials]");
    if (lockCredentials) {
      event.preventDefault();
      event.stopPropagation();
      lockCredentialsEditor(lockCredentials);
      return;
    }
    const projectToggleCard = target.closest("[data-project-toggle-card]");
    if (projectToggleCard) {
      event.preventDefault();
      event.stopPropagation();
      const card = projectToggleCard.closest("[data-project-card]");
      if (card instanceof HTMLDetailsElement) {
        const willOpen = !card.open;
        if (willOpen) closeSiblingActiveProjectCards(card);
        card.open = willOpen;
        updateActivePursuitFocus(willOpen ? card : null);
      }
      return;
    }

    const projectRegenerate = target.closest("[data-project-regenerate]");
    if (projectRegenerate) {
      const card = target.closest("[data-project-card]");
      if (card) regenerateProjectMessages(card, projectRegenerate);
      return;
    }

    const projectMode = target.closest("[data-project-draft-mode]");
    if (projectMode) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.draftMode = projectMode.getAttribute("data-project-draft-mode") || "ai";
        card.dataset.selectedMessage = "";
        card.dataset.aiOptions = "";
        card.dataset.aiError = "";
        card.dataset.messageIndex = "0";
        renderProjectCard(card);
      }
      return;
    }

    const projectClear = target.closest("[data-project-clear-message]");
    if (projectClear) {
      const card = target.closest("[data-project-card]");
      if (card) {
        card.dataset.selectedMessage = "";
        renderProjectCard(card);
      }
      return;
    }

    const projectNav = target.closest("[data-project-message-nav]");
    if (projectNav) {
      const card = target.closest("[data-project-card]");
      if (card) {
        const context = projectContext(card);
        const options = coachOptions(context);
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
        useProjectMessage(card, projectUse);
      }
      return;
    }

    const projectCopy = target.closest("[data-project-copy-message]");
    if (projectCopy) {
      navigator.clipboard?.writeText(projectCopy.getAttribute("data-project-copy-message") || "");
      projectCopy.textContent = "Copied";
      return;
    }

    const projectRestore = target.closest("[data-project-restore]");
    if (projectRestore) {
      event.preventDefault();
      event.stopPropagation();
      restoreProject(projectRestore);
      return;
    }

    const archiveConfirm = target.closest("[data-project-archive-confirm]");
    if (archiveConfirm) {
      event.preventDefault();
      event.stopPropagation();
      const card = archiveConfirm.closest("[data-project-card]");
      if (archiveConfirm.getAttribute("data-project-archive-confirm") === "yes") {
        archiveProject(archiveConfirm);
      } else {
        clearArchiveConfirm(card);
      }
      return;
    }

    const projectArchive = target.closest("[data-project-archive]");
    if (projectArchive) {
      event.preventDefault();
      event.stopPropagation();
      showArchiveConfirm(projectArchive);
      return;
    }

    const projectAddNote = target.closest("[data-project-add-note]");
    if (projectAddNote) {
      addProjectNote(projectAddNote);
      return;
    }

    const projectSave = target.closest("[data-project-save]");
    if (projectSave) {
      const card = target.closest("[data-project-card]");
      if (card) updateProject(card, projectSave);
      return;
    }

    const projectCardNav = target.closest("[data-project-card-nav]");
    if (projectCardNav) {
      event.preventDefault();
      const card = target.closest("[data-project-card]");
      if (card) navigateProjectCard(card, projectCardNav.getAttribute("data-project-card-nav") || "next");
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
      restoreCaptureState();
      renderCapture();
      renderProjects();
      applyOverviewFilters();
    }, { once: true });
  } else {
    restoreCaptureState();
    renderCapture();
    renderProjects();
    applyOverviewFilters();
  }
})();


































































