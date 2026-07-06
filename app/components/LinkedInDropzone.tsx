"use client";

import { ClipboardEvent, DragEvent, useRef, useState } from "react";

interface Props {
  title: string;
  description: string;
  onImageSelected: (file: File) => void;
}

export default function LinkedInDropzone({
  title,
  description,
  onImageSelected,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasCapture, setHasCapture] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfile = title.toLowerCase().includes("profile");
  const capturedLabel = isProfile ? "Profile captured" : "Activity captured";

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That was not an image.");
      return;
    }

    setHasCapture(true);
    setError(null);
    setIsDragging(false);
    onImageSelected(file);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();

    if (file) {
      handleFile(file);
    } else {
      setError("No image found on clipboard.");
    }
  }

  async function handlePasteButton() {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));

        if (!imageType) continue;

        const blob = await item.getType(imageType);
        const file = new File([blob], "linkedin-screenshot.png", {
          type: imageType,
        });

        handleFile(file);
        return;
      }

      setError("No image found on clipboard.");
    } catch {
      setError("Click inside this box and press Ctrl+V instead.");
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  return (
    <div
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border border-dashed p-6 text-center outline-none transition ${
        isDragging
          ? "border-cyan-300 bg-cyan-300/10"
          : "border-cyan-300/30 hover:border-cyan-300 hover:bg-cyan-300/5"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          if (event.target.files?.[0]) {
            handleFile(event.target.files[0]);
          }
        }}
      />

      <p className="font-semibold">{title}</p>

      {!hasCapture && (
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      )}

      {hasCapture ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-cyan-300">
            ✓ {capturedLabel}
          </p>

          <p className="mt-2 text-sm text-gray-500">Ready for analysis</p>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={handlePasteButton}
              className="border border-cyan-300/50 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-300 hover:text-black"
            >
              Paste New
            </button>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-white/30 hover:text-white"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={handlePasteButton}
            className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-300 hover:text-black"
          >
            Paste
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-white/30 hover:text-white"
          >
            Choose File
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {!hasCapture && !error && (
        <p className="mt-4 text-xs text-gray-600">
          Click this box and press Ctrl+V, or drag an image here.
        </p>
      )}
    </div>
  );
}