"use client";

import TodayBrief from "./components/TodayBrief";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05080D] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#17415B_0%,transparent_35%),radial-gradient(circle_at_bottom_right,#0E2938_0%,transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-8 py-8">
        <TodayBrief />
      </div>
    </main>
  );
}