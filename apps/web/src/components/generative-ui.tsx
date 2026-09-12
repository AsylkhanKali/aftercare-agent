"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

export function GenerativeUI() {
  useHumanInTheLoop({
    name: "confirm_contact_plan",
    description:
      "Ask for explicit approval before sharing appointment preferences or contacting a demo receptionist. Approval only confirms the plan. The user must still use the page button to start the test call.",
    parameters: z.object({
      clinic: z.string(),
      detailsToShare: z.array(z.string()).max(4),
    }),
    render: ({ args, respond, result }) => {
      if (!respond) {
        return <article className="agent-approval-result">{result ? String(result) : "Waiting for confirmation"}</article>;
      }
      return (
        <article className="agent-approval">
          <p className="care-result-label">Permission check</p>
          <h3>Contact {args.clinic ?? "this clinic"}?</h3>
          <ul>
            {(args.detailsToShare ?? []).map((detail, index) => (
              <li key={`${detail}-${index}`}>{detail}</li>
            ))}
          </ul>
          <div className="care-actions">
            <button
              type="button"
              className="care-primary-action"
              onClick={() => respond("Approved. Prepare the page confirmation, but do not claim a call was made.")}
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
