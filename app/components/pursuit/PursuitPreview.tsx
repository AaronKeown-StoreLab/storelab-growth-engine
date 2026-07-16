"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { PursuitCaptureAnalysis, PursuitStage } from "../../types/pursuit";

type Props = {
  analysis: PursuitCaptureAnalysis;
  saving: boolean;
  stages: readonly PursuitStage[];
  onChange: (analysis: PursuitCaptureAnalysis) => void;
  onIgnore: () => void;
  onSave: (analysis: PursuitCaptureAnalysis) => Promise<void>;
};

export default function PursuitPreview({ analysis, saving, stages, onChange, onIgnore, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'jeevs', text: string}[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const personName = `${analysis.person.firstName} ${analysis.person.lastName ?? ""}`.trim();

  // Scroll to the bottom of the chat when Jeevs speaks
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  function update(path: string, value: string) {
    const newAnalysis = { ...analysis };
    if (path === "business") newAnalysis.business.name = value;
    else if (["firstName", "lastName", "role"].includes(path)) (newAnalysis.person as any)[path] = value;
    else (newAnalysis as any)[path] = value;
    onChange(newAnalysis);
  }

  async function handleJeevsChat(e?: KeyboardEvent<HTMLInputElement>) {
    if (e && e.key !== 'Enter') return;
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput("");
    setIsChatting(true);

    try {
      const response = await fetch("/api/message-coach", {
        method: "POST",
        body: JSON.stringify({
          fields: { ...analysis.person, business: analysis.business.name },
          messageDirection: userMessage,
          currentMessage: analysis.suggestedMessage,
          chatHistory: chatHistory
        }),
      });
      const data = await response.json();
      
      if (data.updatedDraft) {
        update("suggestedMessage", data.updatedDraft);
        setChatHistory(prev => [...prev, { role: 'jeevs', text: data.jeevsComment }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'jeevs', text: "Sorry Aaron, I lost my train of thought. Try again?" }]);
    } finally {
      setIsChatting(false);
    }
  }

  return (
    <div className="mt-3 border border-white/10 bg-[#0a0a0a] p-0 shadow-2xl rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white/[0.03] p-4 border-b border-white/5 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {personName} <span className="text-slate-600 text-sm font-normal">@</span> {analysis.business.name}
          </h2>
          <p className="text-[10px] text-cyan-500 font-black uppercase tracking-tighter">Growth Opportunity Found</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-widest">
                {editing ? "Close Editor" : "Manual Edit"}
            </button>
            <button onClick={onIgnore} className="text-[10px] text-red-900 hover:text-red-500 uppercase font-bold tracking-widest">Discard</button>
        </div>
      </div>

      <div className="p-4 grid gap-6 md:grid-cols-2">
        {/* Left Side: The Draft & Editor */}
        <div className="space-y-4">
            <div className="bg-black/40 border border-white/5 p-4 rounded-md">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest border-b border-white/5 pb-2">The Outreach Draft</p>
                {editing ? (
                    <textarea 
                        value={analysis.suggestedMessage} 
                        onChange={e => update("suggestedMessage", e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-200 leading-7 outline-none min-h-[150px]"
                    />
                ) : (
                    <p className="text-sm text-slate-200 leading-7 whitespace-pre-wrap">
                        {analysis.suggestedMessage || "No draft created yet..."}
                    </p>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.02] border border-white/5 p-2 px-3 rounded">
                    <p className="text-[8px] text-slate-500 uppercase font-bold">Stage</p>
                    <p className="text-xs text-slate-300 mt-1">{analysis.stage}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 px-3 rounded">
                    <p className="text-[8px] text-slate-500 uppercase font-bold">Next Action</p>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">{analysis.nextAction}</p>
                </div>
            </div>
        </div>

        {/* Right Side: Chat with Jeevs */}
        <div className="flex flex-col h-full min-h-[300px] bg-black/20 rounded-md border border-white/5">
            <div className="p-3 border-b border-white/5 bg-white/[0.01]">
                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Chat with Jeevs</p>
            </div>
            
            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[250px] scrollbar-hide">
                {chatHistory.length === 0 && (
                    <p className="text-xs text-slate-600 italic">"Hey Aaron, want me to change the tone or add a specific detail? Just tell me below."</p>
                )}
                {chatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 text-xs leading-5 ${
                            chat.role === 'user' 
                            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-100' 
                            : 'bg-white/5 border border-white/10 text-slate-300'
                        }`}>
                            <p className="font-bold text-[8px] uppercase mb-1 opacity-50">{chat.role === 'user' ? 'You' : 'Jeevs'}</p>
                            {chat.text}
                        </div>
                    </div>
                ))}
                {isChatting && <div className="text-[10px] text-cyan-500 animate-pulse">Jeevs is typing...</div>}
                <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-black/40 mt-auto">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleJeevsChat}
                    placeholder="Talk to Jeevs..."
                    className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder:text-slate-700 outline-none focus:border-cyan-500 transition-all"
                />
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
        <button
          disabled={saving}
          onClick={() => onSave(analysis)}
          className="h-10 bg-cyan-500 hover:bg-white px-10 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all rounded-sm"
        >
          {saving ? "Saving..." : "Confirm & Save to Memory"}
        </button>
      </div>
    </div>
  );
}