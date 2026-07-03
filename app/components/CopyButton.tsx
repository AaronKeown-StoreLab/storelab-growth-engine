interface Props {
  text: string;
}

export default function CopyButton({ text }: Props) {
  async function copyText() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <button
      onClick={copyText}
      className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
    >
      Copy
    </button>
  );
}