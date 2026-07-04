export default function RelationshipTimeline() {
  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
        Relationship Timeline
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Yesterday
          </p>
          <p className="mt-1 font-semibold">LinkedIn invitation accepted</p>
          <p className="mt-1 text-sm text-gray-400">
            Barbara accepted your connection request.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            2 weeks ago
          </p>
          <p className="mt-1 font-semibold">Follow-up email sent</p>
          <p className="mt-1 text-sm text-gray-400">
            Shared StoreLab Research capability.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            March 2026
          </p>
          <p className="mt-1 font-semibold">Demo completed</p>
          <p className="mt-1 text-sm text-gray-400">
            Presented Virtual Research platform.
          </p>
        </div>
      </div>
    </div>
  );
}