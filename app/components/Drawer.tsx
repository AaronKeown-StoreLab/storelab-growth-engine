"use client";

import { ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Drawer({ open, title, onClose, children }: Props) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 h-screen w-[520px] border-l border-white/10 bg-[#071019] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-2xl font-semibold">{title}</h2>

          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="no-scrollbar h-[calc(100vh-88px)] overflow-y-auto p-6">
          {children}
        </div>
      </aside>
    </>
  );
}