export default function LinkedInIntelligence() {
  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
        Live Intelligence
      </p>

      <div className="mt-5 space-y-5">

        <div>
          <p className="text-sm text-gray-500">
            Latest LinkedIn Activity
          </p>

          <p className="mt-2 text-lg">
            Simon posted about AI transforming shopper research.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            3 hours ago
          </p>
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-sm text-gray-500">
            AI Summary
          </p>

          <p className="mt-3 leading-relaxed text-gray-300">
            Simon has significantly increased discussion around AI,
            virtual research and shopper behaviour over the past
            month. This aligns closely with StoreLab's latest
            research capabilities.
          </p>
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-sm text-gray-500">
            AI Recommendation
          </p>

          <p className="mt-3 leading-relaxed">
            Don't ask for a meeting today.
            Leave a thoughtful comment on his latest post first.
            Follow up later this week.
          </p>
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-sm text-gray-500">
            Suggested Comment
          </p>

          <div className="mt-3 border border-cyan-300/20 bg-cyan-300/5 p-4">
            <p className="italic text-gray-300">
              "Great post Simon. We've been seeing exactly the same
              trend through our recent virtual research work..."
            </p>
          </div>

          <button className="mt-4 text-cyan-300 hover:text-white">
            Copy Suggested Comment →
          </button>
        </div>

      </div>
    </div>
  );
}