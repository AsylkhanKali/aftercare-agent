"use client";

import { useComponent, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

export function GenerativeUI() {
  useComponent({
    name: "care_summary",
    description:
      "Render a concise care-navigation summary. This is not a diagnosis. Use it after reviewing the intake context.",
    parameters: z.object({
      urgency: z.enum(["Emergency", "Same-day", "Routine"]),
      specialty: z.string(),
      rationale: z.string(),
      nextStep: z.string(),
    }),
    render: ({ urgency, specialty, rationale, nextStep }) => (
      <article className={`agent-care-card agent-care-${urgency?.toLowerCase() ?? "routine"}`}>
        <p className="care-result-label">{urgency ?? "Reviewing"}</p>
        <h3>{specialty ?? "Preparing care options"}</h3>
        <p>{rationale ?? "Reviewing the information you shared."}</p>
        <strong>{nextStep ?? "Confirm the next step before continuing."}</strong>
      </article>
    ),
  });

  useComponent({
    name: "clinic_comparison",
    description:
      "Render up to three clinic search results. Only use clinics returned by search_clinics. Never invent a clinic, phone number, rating, or available time.",
    parameters: z.object({
      clinics: z.array(
        z.object({
          name: z.string(),
          location: z.string(),
          reason: z.string(),
          sourceUrl: z.string().optional(),
        }),
      ).max(3),
    }),
    render: ({ clinics }) => (
      <div className="agent-clinic-list">
        {(clinics ?? []).map((clinic, index) => (
          <article key={`${clinic?.name ?? "clinic"}-${index}`}>
            <h3>{clinic?.name ?? "Loading clinic"}</h3>
            <span>{clinic?.location ?? "Checking location"}</span>
            <p>{clinic?.reason ?? "Checking why this option may fit."}</p>
            {clinic?.sourceUrl && (
              <a href={clinic.sourceUrl} target="_blank" rel="noreferrer">Review source</a>
            )}
          </article>
        ))}
      </div>
    ),
  });

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
