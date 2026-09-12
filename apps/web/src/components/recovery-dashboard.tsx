"use client";

import { type FormEvent, useState } from "react";

type RecoveryStatus = "on-track" | "needs-attention" | "urgent";
type Trend = "improving" | "steady" | "worsening";
type CheckInResult = {
  assessment: string;
  escalate: boolean;
  reasoning: string;
  trend: Trend;
};
type Message = { id: string; role: "patient" | "agent"; text: string };

const INITIAL_MESSAGES: Message[] = [
  {
    id: "patient-day-1",
    role: "patient",
    text: "Feeling fine, with slight swelling around my ankle.",
  },
  {
    id: "agent-day-1",
    role: "agent",
    text: "Check-in saved. Keep following your discharge instructions and report any worsening symptoms.",
  },
  {
    id: "patient-day-2",
    role: "patient",
    text: "Still a little swollen today, but there is no new pain.",
  },
  {
    id: "agent-day-2",
    role: "agent",
    text: "Check-in saved. Continue monitoring the swelling and use your care team's instructions as the source of truth.",
  },
];

const STATUS_COPY: Record<RecoveryStatus, string> = {
  "on-track": "On track",
  "needs-attention": "Needs attention",
  urgent: "Contact care team",
};

export function RecoveryDashboard({ onFindCare }: { onFindCare: () => void }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<RecoveryStatus>("on-track");
  const [trend, setTrend] = useState<Trend>("steady");
  const [isLoading, setIsLoading] = useState(false);
  const [doses, setDoses] = useState([
    { time: "8:00 AM", taken: true },
    { time: "4:00 PM", taken: true },
    { time: "12:00 AM", taken: false },
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.replace(/\s+/g, " ").trim().slice(0, 600);
    if (!message || isLoading) return;

    const patientMessage: Message = {
      id: `patient-${Date.now()}`,
      role: "patient",
      text: message,
    };
    setMessages((current) => [...current, patientMessage]);
    setDraft("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages
            .filter((item) => item.role === "patient")
            .map((item, index) => ({ day: index + 1, patientReport: item.text })),
        }),
      });
      const result = await response.json() as CheckInResult & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Check-in failed.");

      setTrend(result.trend);
      setStatus(result.escalate ? "urgent" : result.trend === "worsening" ? "needs-attention" : "on-track");
      setMessages((current) => [...current, {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: result.assessment,
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: `agent-error-${Date.now()}`,
        role: "agent",
        text: "I couldn't review that update. Contact your care team if symptoms are worsening or concerning.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="today-dashboard" id="top" aria-labelledby="today-title">
      <header className="today-status-card">
        <div>
          <p className="care-result-label">Recovery overview</p>
          <h1 id="today-title">Good afternoon, Sarah</h1>
          <p>Day 2 after ACL reconstruction</p>
        </div>
        <div className="today-status-actions">
          <span className={`today-status-chip today-status-${status}`}>{STATUS_COPY[status]}</span>
          <button type="button" className="care-primary-action" onClick={onFindCare}>
            Find care
          </button>
        </div>
      </header>

      <div className="today-layout">
        <section className="today-chat" aria-labelledby="checkin-title">
          <header>
            <div>
              <p className="care-result-label">Daily recovery</p>
              <h2 id="checkin-title">Check-in</h2>
            </div>
            <span>Day 2</span>
          </header>

          <div className="today-thread" aria-live="polite">
            {messages.map((message) => (
              <div className={`today-message today-message-${message.role}`} key={message.id}>
                {message.role === "agent" && <span className="today-agent-mark" aria-hidden="true">A</span>}
                <p>{message.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="today-message today-message-agent">
                <span className="today-agent-mark" aria-hidden="true">A</span>
                <p>Reviewing your update…</p>
              </div>
            )}
          </div>

          <form className="today-composer" onSubmit={handleSubmit}>
            <label htmlFor="recovery-checkin">How are you feeling today?</label>
            <div>
              <input
                id="recovery-checkin"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Describe pain, swelling, movement, or a concern"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !draft.trim()} aria-label="Send check-in">
                Send
              </button>
            </div>
          </form>
        </section>

        <aside className="today-sidebar" aria-label="Recovery details">
          <section className="today-detail-card">
            <div className="today-card-heading">
              <div>
                <p className="care-result-label">Today</p>
                <h2>Medication</h2>
              </div>
              <span>5 days left</span>
            </div>
            <p className="today-detail-lead"><strong>Ibuprofen</strong> · 400 mg every 8 hours</p>
            <ul className="today-dose-list">
              {doses.map((dose, index) => (
                <li key={dose.time}>
                  <button
                    type="button"
                    onClick={() => setDoses((current) => current.map((item, itemIndex) => (
                      itemIndex === index ? { ...item, taken: !item.taken } : item
                    )))}
                  >
                    <span className={dose.taken ? "today-dose-complete" : "today-dose-pending"} aria-hidden="true">
                      {dose.taken ? "✓" : ""}
                    </span>
                    <span>{dose.time}</span>
                    <small>{dose.taken ? "Taken" : "Due"}</small>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="today-detail-card">
            <div className="today-card-heading">
              <div>
                <p className="care-result-label">Watch closely</p>
                <h2>Ankle swelling</h2>
              </div>
              <span className={`today-trend today-trend-${trend}`}>{trend}</span>
            </div>
            <p>It should reduce over time. Report worsening swelling or new pain to your care team.</p>
          </section>

          <section className="today-detail-card today-followup-card">
            <div className="today-card-heading">
              <div>
                <p className="care-result-label">Next step</p>
                <h2>Follow-up</h2>
              </div>
              <span>Requested</span>
            </div>
            <strong>Tuesday, 22 September at 10:30 AM</strong>
            <p>Routine post-operative review. The clinic must confirm the request.</p>
            <button type="button" className="care-secondary-action" onClick={onFindCare}>
              Arrange another visit
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
}
