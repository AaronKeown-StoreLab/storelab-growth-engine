import { useState } from "react";
import { AccountRecommendation } from "../types/accountRecommendation";
import CopyButton from "./CopyButton";

interface Props {
  recommendation: AccountRecommendation;
  format: string;
}

export default function OutreachDraft({ recommendation, format }: Props) {
  const contact = recommendation.contacts[0];
  const goal = recommendation.goal?.title?.toLowerCase();

  const draftsByFormat: Record<string, string[]> = {
    "LinkedIn Message": [
      `Hi ${contact?.firstName}, hope you're well. Thought it might be worth reconnecting around ${goal}. We've been doing more around virtual research and shopper evidence recently, and I think there could be some useful overlap with what your team is working on.`,
      `Hi ${contact?.firstName}, it's been a little while. Thought I'd reconnect as we've been doing some interesting work around virtual research and shopper evidence that may be relevant to Mars.`,
      `Hi ${contact?.firstName}, hope things are going well. Your team came to mind this week around some of the research work we've been developing. Worth a quick catch-up sometime?`,
    ],

    Email: [
      `Hi ${contact?.firstName},

Hope you're well.

I thought it might be worth reconnecting around ${goal}.

We've been doing a lot more around virtual research and shopper evidence recently, and I think there could be some useful overlap with what your team is working on.

Would you be open to a quick catch-up?

Regards,
Aaron`,
      `Hi ${contact?.firstName},

It's been a little while since we last caught up.

We've been doing some interesting work recently around virtual research and thought your team might find it worthwhile having another look.

Happy to jump on a quick call if it's of interest.

Cheers,
Aaron`,
    ],

    "Meeting Agenda": [
      `Meeting agenda

Objective:
Discuss ${recommendation.goal?.title}

Suggested topics:
• Current Mars priorities
• Virtual Research opportunities
• Growth Centre planning
• Where StoreLab may be able to support

Desired outcome:
Agree whether a follow-up demo or proposal is worthwhile.`,
    ],

    "Call Talking Points": [
      `Call talking points

• Keep it light and relationship-led.
• Ask what the team is focused on this quarter.
• Mention StoreLab's recent virtual research improvements.
• Explore whether there is appetite for another research demo.
• Avoid making it feel like a hard sales call.`,
    ],
  };

  const drafts = draftsByFormat[format] ?? draftsByFormat["LinkedIn Message"];
  const [version, setVersion] = useState(0);
  const currentDraft = drafts[version % drafts.length];

  function regenerate() {
    setVersion((v) => (v + 1) % drafts.length);
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
            Draft {format}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Version {(version % drafts.length) + 1} of {drafts.length}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={regenerate}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
          >
            Regenerate
          </button>

          <CopyButton text={currentDraft} />
        </div>
      </div>

      <pre className="mt-6 min-h-[260px] max-h-[260px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
        {currentDraft}
      </pre>
    </div>
  );
}