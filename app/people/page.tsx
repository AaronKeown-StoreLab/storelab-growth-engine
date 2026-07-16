import RelationshipSnapshot from "../components/pursuit/RelationshipSnapshot";
import PursuitAppHeader from "../components/pursuit/PursuitAppHeader";
import { listLinkedInPursuits } from "../services/pursuitCaptureService";

export const dynamic = "force-dynamic";

const todayStages = new Set(["Found", "Message Drafted", "Connected", "Demo Accepted", "Email Captured", "Email Sent", "Demo Booked"]);

function sortByBusinessAndPerson(a: Awaited<ReturnType<typeof listLinkedInPursuits>>[number], b: Awaited<ReturnType<typeof listLinkedInPursuits>>[number]) {
  const business = a.business.name.localeCompare(b.business.name);
  if (business !== 0) return business;

  const aName = `${a.person.firstName} ${a.person.lastName}`.trim();
  const bName = `${b.person.firstName} ${b.person.lastName}`.trim();

  return aName.localeCompare(bName);
}

export default async function OverviewPage() {
  const pursuits = await listLinkedInPursuits();
  const orderedPursuits = [...pursuits].sort(sortByBusinessAndPerson);
  const stats = {
    today: pursuits.filter((pursuit) => todayStages.has(pursuit.stage)).length,
    saved: pursuits.length,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#10212A_0%,transparent_36%)]" />

      <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden px-2.5 py-2.5 ">
        <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full min-w-0 max-w-[430px] flex-col gap-3">
          <PursuitAppHeader active="overview" stats={stats} />
          <RelationshipSnapshot pursuits={orderedPursuits} />
        </section>
      </div>
    </main>
  );
}

