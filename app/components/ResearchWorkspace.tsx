"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type SourceKind =
  | "PDF"
  | "Image"
  | "Document"
  | "Presentation"
  | "Spreadsheet"
  | "Audio"
  | "Video"
  | "Website"
  | "Notes"
  | "File";

type SourceOrigin = "file" | "clipboard" | "url" | "drop";

type ResearchSource = {
  id: string;
  name: string;
  kind: SourceKind;
  origin: SourceOrigin;
  detail: string;
  capturedAt: string;
  detected: string[];
};

type Props = {
  businessName?: string;
};

const urlPattern = /https?:\/\/[^\s<>"']+/gi;

function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function detectFileKind(file: File): SourceKind {
  const extension = getExtension(file.name);

  if (file.type === "application/pdf" || extension === "pdf") return "PDF";
  if (file.type.startsWith("image/")) return "Image";
  if (file.type.startsWith("audio/")) return "Audio";
  if (file.type.startsWith("video/")) return "Video";

  if (["doc", "docx", "rtf", "txt", "md"].includes(extension)) {
    return "Document";
  }

  if (["ppt", "pptx", "key"].includes(extension)) {
    return "Presentation";
  }

  if (["xls", "xlsx", "csv", "numbers"].includes(extension)) {
    return "Spreadsheet";
  }

  return "File";
}

function detectedFor(kind: SourceKind) {
  const common = ["Metadata captured", "Entity scan queued"];

  if (kind === "Website") return ["URL captured", "Website read queued"];
  if (kind === "Notes") return ["Text captured", "Entity scan queued"];
  if (kind === "PDF") return ["Document captured", "Text extraction queued"];
  if (kind === "Image") return ["Image captured", "OCR queued"];
  if (kind === "Presentation") return ["Slides captured", "Text extraction queued"];
  if (kind === "Spreadsheet") return ["Spreadsheet captured", "Table scan queued"];
  if (kind === "Audio") return ["Audio captured", "Transcript queued"];
  if (kind === "Video") return ["Video captured", "Transcript queued"];

  return common;
}

function sourceFromFile(file: File, origin: SourceOrigin): ResearchSource {
  const kind = detectFileKind(file);
  const fallbackName = kind === "Image" ? "Clipboard image" : "Untitled file";

  return {
    id: makeId(),
    name: file.name || fallbackName,
    kind,
    origin,
    detail: [file.type || "Unknown type", formatFileSize(file.size)]
      .filter(Boolean)
      .join(" | "),
    capturedAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    detected: detectedFor(kind),
  };
}

function normaliseUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return new URL(withProtocol).toString();
}

function sourceFromUrl(value: string, origin: SourceOrigin): ResearchSource {
  const url = normaliseUrl(value);
  const parsed = new URL(url);

  return {
    id: makeId(),
    name: parsed.hostname.replace(/^www\./, ""),
    kind: "Website",
    origin,
    detail: url,
    capturedAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    detected: detectedFor("Website"),
  };
}

function sourceFromText(value: string, origin: SourceOrigin): ResearchSource {
  const compact = value.replace(/\s+/g, " ").trim();

  return {
    id: makeId(),
    name: compact.slice(0, 56) || "Clipboard notes",
    kind: "Notes",
    origin,
    detail: `${compact.length} characters`,
    capturedAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    detected: detectedFor("Notes"),
  };
}

function sourceBadge(source: ResearchSource) {
  if (source.kind === "Website") return "URL";
  if (source.kind === "Notes") return "TXT";

  const extension = getExtension(source.name);

  return extension ? extension.slice(0, 4).toUpperCase() : source.kind.slice(0, 4);
}

export default function ResearchWorkspace({ businessName }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [urlValue, setUrlValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sourceMix = useMemo(() => {
    const counts = sources.reduce<Record<SourceKind, number>>((current, source) => {
      current[source.kind] = (current[source.kind] ?? 0) + 1;
      return current;
    }, {} as Record<SourceKind, number>);

    return Object.entries(counts)
      .map(([kind, count]) => `${count} ${kind}`)
      .join(" | ");
  }, [sources]);

  function addSources(nextSources: ResearchSource[]) {
    if (!nextSources.length) return;

    setSources((current) => [...nextSources, ...current]);
    setNotice(null);
  }

  function addFiles(files: FileList | File[], origin: SourceOrigin) {
    addSources(Array.from(files).map((file) => sourceFromFile(file, origin)));
  }

  function addText(value: string, origin: SourceOrigin) {
    const trimmed = value.trim();

    if (!trimmed) return;

    const urls = trimmed.match(urlPattern) ?? [];

    if (urls.length) {
      addSources(urls.map((url) => sourceFromUrl(url, origin)));
      return;
    }

    addSources([sourceFromText(trimmed, origin)]);
  }

  function addUrl() {
    try {
      addSources([sourceFromUrl(urlValue, "url")]);
      setUrlValue("");
    } catch {
      setNotice("That link does not look ready yet.");
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    const files = Array.from(event.clipboardData.files ?? []);
    const text = event.clipboardData.getData("text/plain");

    if (files.length) {
      event.preventDefault();
      addFiles(files, "clipboard");
      return;
    }

    if (text.trim()) {
      event.preventDefault();
      addText(text, "clipboard");
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    const link = event.dataTransfer.getData("text/uri-list");
    const text = event.dataTransfer.getData("text/plain");

    if (files.length) {
      addFiles(files, "drop");
      return;
    }

    addText(link || text, "drop");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      addFiles(event.target.files, "file");
      event.target.value = "";
    }
  }

  function handleUrlKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addUrl();
    }
  }

  function removeSource(id: string) {
    setSources((current) => current.filter((source) => source.id !== id));
  }

  return (
    <section
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border p-5 outline-none transition ${
        isDragging
          ? "border-emerald-300 bg-emerald-300/10"
          : "border-cyan-300/30 bg-cyan-300/5"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-cyan-300">Research Session</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-white">
            {businessName ?? "New relationship"}
          </h2>
        </div>

        <div className="border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-2xl font-semibold text-white">{sources.length}</p>
          <p className="text-xs text-gray-500">
            Source{sources.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-6 flex min-h-40 w-full flex-col items-center justify-center border border-dashed border-white/20 bg-black/20 p-6 text-center transition hover:border-cyan-300/60 hover:bg-cyan-300/5"
      >
        <span className="text-lg font-semibold text-white">
          Drop, paste or browse anything
        </span>
        <span className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
          Files, screenshots, links, notes, decks, documents and reports all land
          in one source list.
        </span>
        <span className="mt-5 border border-cyan-300 px-4 py-2 text-sm font-medium text-cyan-300">
          Browse Files
        </span>
      </button>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={urlValue}
          onChange={(event) => setUrlValue(event.target.value)}
          onKeyDown={handleUrlKeyDown}
          placeholder="Paste a URL"
          className="min-h-11 flex-1 border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/70"
        />

        <button
          type="button"
          onClick={addUrl}
          className="min-h-11 border border-white/10 px-5 text-sm font-medium text-gray-200 transition hover:border-cyan-300/60 hover:text-cyan-300"
        >
          Add Link
        </button>
      </div>

      {notice && <p className="mt-3 text-sm text-amber-200">{notice}</p>}

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-gray-500">Sources</p>
            <p className="mt-1 text-sm text-gray-500">
              {sources.length ? sourceMix : "Waiting for information"}
            </p>
          </div>

          {sources.length > 0 && (
            <button
              type="button"
              onClick={() => setSources([])}
              className="text-sm text-gray-500 transition hover:text-white"
            >
              Clear session
            </button>
          )}
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto border-y border-white/10 no-scrollbar">
          {sources.length ? (
            sources.map((source) => (
              <div
                key={source.id}
                className="grid gap-4 border-b border-white/10 py-4 last:border-b-0 sm:grid-cols-[3rem_1fr_auto]"
              >
                <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/[0.03] text-xs font-semibold text-cyan-300">
                  {sourceBadge(source)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {source.name}
                    </p>
                    <span className="text-xs text-gray-600">{source.capturedAt}</span>
                  </div>

                  <p className="mt-1 truncate text-xs text-gray-500">
                    {source.kind} | {source.detail}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {source.detected.map((item) => (
                      <span
                        key={item}
                        className="border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-gray-400"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeSource(source.id)}
                  className="h-8 w-8 border border-white/10 text-sm text-gray-500 transition hover:border-red-300/50 hover:text-red-200"
                  aria-label={`Remove ${source.name}`}
                >
                  x
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 text-sm text-gray-500">
              Bring me information. I&apos;ll do the thinking.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-3">
        {[
          ["Capture", sources.length ? `${sources.length} ready` : "Standing by"],
          ["Prepare", sources.length ? "Brain queued" : "Waiting"],
          ["Review", "User approval required"],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-gray-600">{label}</p>
            <p className="mt-1 text-sm font-medium text-gray-200">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
