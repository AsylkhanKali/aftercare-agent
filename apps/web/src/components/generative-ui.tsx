"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

export function GenerativeUI() {
  useHumanInTheLoop({
    name: "confirm_contact_plan",
    description:
      "Ask for explicit approval before starting a real Twilio Trial call to the fixed verified team test number. The safe test script shares no intake details. Approval only confirms the plan; the user must still use the page button and private demo PIN. Never claim that a clinic will be called.",
    parameters: z.object({
      clinic: z.string(),
    }),
    render: ({ args, respond, result }) => {
      if (!respond) {
        return <article className="agent-approval-result">{result ? String(result) : "Waiting for confirmation"}</article>;
      }
      return (
        <article className="agent-approval">
          <p className="care-result-label">Permission check</p>
          <h3>Contact {args.clinic ?? "this clinic"}?</h3>
          <p>The real call goes to the fixed team test number and plays a safe test script. No intake details are shared.</p>
          <div className="care-actions">
            <button
              type="button"
              className="care-primary-action"
              onClick={() => respond("Approved. Prepare the page confirmation for the fixed team test number, but do not claim a call was made yet.")}
            >
              Continue
            </button>
            <button
              type="button"
              className="care-text-action"
              onClick={() => respond("Declined. Do not contact anyone and do not continue the booking flow.")}
            >
              Cancel
            </button>
          </div>
        </article>
      );
    },
  });

  return null;
}
