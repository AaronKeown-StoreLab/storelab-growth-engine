(() => {
  if (window.__storelabPursuitRuntime && window.__storelabMateSymmetry) return;
  window.__storelabPursuitRuntime = true;
  window.__storelabMateSymmetry = true;

  const labels = { name: "Name", business: "Business", role: "Role", location: "Location", email: "Email", demoType: "Demo type", sourcePath: "Path", sourceContext: "Via", linkedinUrl: "LinkedIn URL" };
  const actions = {
    found: { label: "Found", stage: "Message Drafted", fields: ["name", "business", "role", "location"], needsMessage: true },
    "message-needed": { label: "Message needed", stage: "Message Drafted", fields: ["name", "business", "role", "location"], needsMessage: true },
    connected: { label: "Connected", stage: "Connected", fields: ["name"], needsMessage: true }
  };

  const captureState = {
    actionId: "",
    fields: { name: "", business: "", role: "", location: "", email: "", demoType: "", sourcePath: "linkedin", sourceContext: "", linkedinUrl: "" },
    selectedMessage: "",
    chatHistory: [],
    isChatting: false
  };

  function escapeText(v) { return String(v || "").replace(/"/g, "&quot;"); }

  // --- THE SYMMETRICAL MATE UI ---
  function renderJeevsChat(target, context) {
    const history = context.chatHistory || [];
    const firstName = context.fields.name.split(' ')[0] || "there";

    target.innerHTML = `
      <div class="mt-6 border border-white/10 bg-black/40 rounded-xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
        
        <!-- Header -->
        <div class="bg-white/[0.03] p-4 border-b border-white/5 flex justify-between items-center">
            <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Mate</p>
                <p class="text-[9px] text-slate-500 font-medium tracking-tight uppercase">StoreLab Growth Engine</p>
            </div>
            <div class="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-emerald-500/20">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p class="text-[8px] text-emerald-500 uppercase font-black tracking-widest">Ready</p>
            </div>
        </div>

        <!-- Section 1: Chat History -->
        <div id="jeevs-chat-window" class="h-[180px] p-4 space-y-4 overflow-y-auto bg-black/20 border-b border-white/5">
            ${history.length === 0 ? `
                <div class="flex items-center justify-center h-full">
                    <p class="text-[11px] text-slate-500 italic text-center font-medium">"G'day Aaron. I'm looking at ${firstName}.<br/>How do you want to play this?"</p>
                </div>
            ` : history.map(msg => `
                <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1">
                    <div class="${msg.role === 'user' ? 'bg-cyan-500 text-black font-semibold rounded-br-none' : 'bg-white/5 text-slate-300 border border-white/10 rounded-bl-none'} max-w-[90%] rounded-2xl p-3 text-[12px] leading-relaxed shadow-lg">
                        <p class="font-bold text-[7px] uppercase opacity-40 mb-1 tracking-tighter">${msg.role === 'user' ? 'AARON' : 'MATE'}</p>
                        ${msg.text}
                    </div>
                </div>
            `).join('')}
            ${context.isChatting ? '<div class="text-[10px] text-cyan-500 font-bold animate-pulse px-2 italic">Mate is crunching the data...</div>' : ''}
        </div>

        <!-- Section 2: Outreach Draft (Matched Height) -->
        <div class="h-[180px] p-4 flex flex-col bg-black/10">
            <div class="flex justify-between items-center mb-2">
                <p class="text-[9px] font-black text-cyan-500 uppercase tracking-widest">Outreach Draft</p>
                <button type="button" class="text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-tighter" onclick="navigator.clipboard.writeText('${escapeText(context.selectedMessage)}')">Copy to Clipboard</button>
            </div>
            <div class="flex-1 text-[13px] text-slate-200 leading-relaxed bg-black/40 p-4 rounded-lg border border-white/5 overflow-y-auto whitespace-pre-wrap shadow-inner selection:bg-cyan-500 selection:text-black">
                ${context.selectedMessage || "<span class='text-slate-700 italic'>... .... ..... ready to go</span>"}
            </div>
        </div>

        <!-- Section 3: Input Area (Balanced) -->
        <div class="p-4 bg-black/40 border-t border-white/10">
            <input type="text" id="jeevs-input" 
                placeholder="Talk to Mate... (Hit Enter to apply changes)" 
                class="w-full bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-cyan-500/50 py-3 px-4 transition-all placeholder:text-slate-700 shadow-xl" 
            />
        </div>
      </div>
    `;
    const win = document.getElementById('jeevs-chat-window');
    if (win) win.scrollTop = win.scrollHeight;
  }

  function renderCaptureFields() {
    const container = document.querySelector("[data-smart-fields]");
    if (!container || !captureState.actionId) return;
    const currentAction = actions[captureState.actionId];
    container.innerHTML = `
      <div class="bg-white/[0.01] border border-white/5 p-4 rounded-xl mb-6">
        <p class="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Lead Intelligence</p>
        <div class="grid grid-cols-2 gap-3">
          ${currentAction.fields.map(field => `
            <div class="flex flex-col gap-1.5">
                <span class="text-[9px] uppercase text-slate-600 font-bold ml-1">${labels[field]}</span>
                <input data-smart-field="${field}" value="${escapeText(captureState.fields[field])}" 
                class="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition-all" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async function talkToJeevs() {
    const input = document.getElementById('jeevs-input');
    const msg = input?.value;
    if (!msg?.trim()) return;

    captureState.chatHistory.push({ role: 'user', text: msg });
    captureState.isChatting = true;
    input.value = "";
    renderCapture();

    try {
      const res = await fetch("/api/message-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: captureState.fields, messageDirection: msg, currentMessage: captureState.selectedMessage, chatHistory: captureState.chatHistory }),
      });
      const data = await res.json();
      captureState.selectedMessage = data.updatedDraft || data.messages?.[0] || "";
      captureState.chatHistory.push({ role: 'jeevs', text: data.jeevsComment || "Draft updated." });
    } catch (e) {
      captureState.chatHistory.push({ role: 'jeevs', text: "Lost connection. Try again?" });
    } finally {
        captureState.isChatting = false;
        renderCapture();
    }
  }

  async function startPursuit() {
    const btn = document.querySelector("[data-capture-review]");
    if (btn) btn.textContent = "Updating Growth Engine...";
    try {
      const res = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: `Captured via Mate. Name: ${captureState.fields.name}. Msg: ${captureState.selectedMessage}` }),
      });
      const body = await res.json();
      await fetch("/api/pursuits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: { ...body, suggestedMessage: captureState.selectedMessage, currentStatus: "Lead secured." } }),
      });
      window.location.reload();
    } catch (e) {
      alert("Save failed.");
      if (btn) btn.textContent = "Start pursuit";
    }
  }

  document.addEventListener("input", (e) => { if (e.target.matches("[data-smart-field]")) captureState.fields[e.target.getAttribute("data-smart-field")] = e.target.value; });
  document.addEventListener("change", (e) => { 
    if (e.target.matches("[data-action-select]")) { 
        captureState.actionId = e.target.value; 
        if (captureState.actionId) { 
            document.querySelectorAll("[data-capture-expanded]").forEach(el => el.classList.remove("hidden")); 
            renderCapture(); 
        } 
    } 
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-capture-regenerate]")) { e.preventDefault(); talkToJeevs(); }
    if (e.target.closest("[data-capture-review]")) { e.preventDefault(); startPursuit(); }
  });
  document.addEventListener("keydown", (e) => { if (e.target.id === 'jeevs-input' && e.key === 'Enter') { e.preventDefault(); talkToJeevs(); } });

  function renderCapture() {
    renderCaptureFields();
    const coach = document.querySelector("[data-message-coach]");
    if (coach && captureState.actionId) renderJeevsChat(coach, captureState);
  }
  console.log("StoreLab 'Mate' Symmetrical UI Loaded.");
})();