import PursuitHome from "./components/pursuit/PursuitHome";
import { listLinkedInPursuits } from "./services/pursuitCaptureService";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pursuits = await listLinkedInPursuits();

  return (
    <main className="min-h-screen bg-[#05070A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#10212A_0%,transparent_36%)]" />

      <div className="relative mx-auto min-h-screen max-w-6xl px-5 py-6 sm:px-8 lg:py-10">
        <PursuitHome initialPursuits={pursuits} />
      </div>
    </main>
  );
}
