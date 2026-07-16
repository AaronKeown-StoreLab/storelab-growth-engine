import ClosedPursuitList from "../components/pursuit/ClosedPursuitList";
import PursuitAppHeader from "../components/pursuit/PursuitAppHeader";
import { listLinkedInPursuits } from "../services/pursuitCaptureService";

export const dynamic = "force-dynamic";

const activeStages = new Set(["Found", "Message Drafted", "Connection Sent", "Connected", "Follow-up Sent", "Demo Proposed", "Demo Accepted", "Email / Time Requested", "Email Captured", "Email Sent", "Calendar Sent", "Demo Booked"]);
const staleAfterDays = 90;

function olderThanDays(value: string, days: number) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > days * 24 * 60 * 60 * 1000;
}
const todayStages = new Set(["Found", "Message Drafted", "Connected", "Demo Accepted", "Email Captured", "Email Sent", "Demo Booked"]);

function sortByLatest(a: Awaited<ReturnType<typeof listLinkedInPursuits>>[number], b: Awaited<ReturnType<typeof listLinkedInPursuits>>[number]) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default async function WinsPage() {
  const pursuits = await listLinkedInPursuits();
  const wins = pursuits.filter((pursuit) => pursuit.stage === "Successful Connection").sort(sortByLatest);
  const stats = {
    today: pursuits.filter((pursuit) => todayStages.has(pursuit.stage)).length,
    saved: pursuits.length,
    tactic: pursuits.filter((pursuit) => pursuit.stage === "Gone Quiet" || (activeStages.has(pursuit.stage) && olderThanDays(pursuit.updatedAt, staleAfterDays))).length,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#10212A_0%,transparent_36%)]" />
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden px-2.5 py-2.5 ">
        <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full min-w-0 max-w-[430px] flex-col gap-3">
          <PursuitAppHeader active="wins" stats={stats} />
          <ClosedPursuitList
            title="Wins"
            eyebrow="Win list"
            empty="No wins yet. The first win will land here."
            pursuits={wins}
            tone="win"
          />
        </section>
      </div>
    </main>
  );
}

