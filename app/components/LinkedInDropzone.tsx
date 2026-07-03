"use client";

import { useEffect, useState } from "react";

type LinkedInDropzoneProps = {
  onAnalyze?: () => void;
};

type Screenshot = {
  id: string;
  name: string;
  preview: string;
};

export default function LinkedInDropzone({ onAnalyze }: LinkedInDropzoneProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);

  function handleFile(file: File) {
    const screenshot = {
      id: crypto.randomUUID(),
      name: file.name || "Pasted screenshot",
      preview: URL.createObjectURL(file),
    };

    setScreenshots((current) => [screenshot, ...current]);
  }

  function removeScreenshot(id: string) {
    setScreenshots((current) => current.filter((item) => item.id !== id));
  }

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    }

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files || []);
        files.forEach((file) => {
          if (file.type.startsWith("image/")) handleFile(file);
        });
      }}
      className="rounded-[2rem] border border-dashed border-cyan-300/30 bg-cyan-300/[0.06] p-8 transition hover:border-cyan-300/70 hover:bg-cyan-300/[0.10]"
    >
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
        LinkedIn Inbox
      </p>

      <h3 className="mt-4 text-3xl font-semibold">
        Drop or paste screenshots here.
      </h3>

      <p className="mt-3 max-w-lg text-gray-400">
        Use Win + Shift + S on LinkedIn, then press Ctrl + V inside Growth Engine.
      </p>

      <label className="mt-6 inline-flex cursor-pointer rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:scale-105 hover:bg-cyan-200">
        Choose screenshot
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            files.forEach((file) => handleFile(file));
          }}
        />
      </label>

      {screenshots.length > 0 && (
        <div className="mt-8 space-y-4">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.id}
              className="rounded-3xl border border-white/10 bg-black/30 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-cyan-300">✓ Screenshot received</p>
                  <p className="mt-1 text-white">{screenshot.name}</p>
                </div>

                <button
                  onClick={() => removeScreenshot(screenshot.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-400 hover:text-white"
                >
                  Remove
                </button>
              </div>

              <img
                src={screenshot.preview}
                alt="LinkedIn screenshot preview"
                className="mt-5 max-h-72 w-full rounded-2xl object-contain"
              />

              <button
                onClick={onAnalyze}
                className="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-black transition hover:scale-[1.02] hover:bg-cyan-200"
              >
                Analyse Screenshot
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}