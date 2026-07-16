import PursuitHome from "./components/pursuit/PursuitHome";
import { listLinkedInPursuits } from "./services/pursuitCaptureService";
import { loadBusinesses } from "./services/businessService";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pursuits, businesses] = await Promise.all([
    listLinkedInPursuits(),
    loadBusinesses(),
  ]);
  const businessOptions = businesses
    .map((business) => ({
      id: business.id,
      name: business.name,
      peopleCount: business.employments.length,
      pursuitCount: business.pursuits.length,
      opportunityCount: business.opportunities.length,
    }))
    .filter((business) => business.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#10212A_0%,transparent_36%)]" />

      <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden px-2.5 py-2.5 ">
        <PursuitHome initialPursuits={pursuits} initialBusinesses={businessOptions} />
      </div>
    </main>
  );
}



