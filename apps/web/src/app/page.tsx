"use client";

import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import Image from "next/image";
import { AppControl } from "@/components/app-control";
import { GenerativeUI } from "@/components/generative-ui";
import {
  EMPTY_INTAKE,
  assessSymptoms,
  type CareAssessment,
  type Clinic,
  type Intake,
} from "@/lib/care";

type BookingStatus = "idle" | "approval" | "calling" | "started" | "error";
type ClinicSearchCriteria = { location: string; specialty: string };

export default function Home() {
  const [intake, setIntake] = useState<Intake>(EMPTY_INTAKE);
  const [assessment, setAssessment] = useState<CareAssessment | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle");
  const [searchMode, setSearchMode] = useState<"demo" | "exa" | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [demoCallPin, setDemoCallPin] = useState("");
  const [callError, setCallError] = useState("");

  useConfigureSuggestions(
    {
      suggestions: [
        {
          title: "Help me describe my symptoms",
          message: "Ask me the minimum questions needed to prepare a clinic search.",
        },
        {
          title: "Explain the next step",
          message: "Explain what AfterCare can and cannot do before I continue.",
        },
      ],
      available: "before-first-message",
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const updateIntake = useCallback(
    (field: keyof Intake, value: string | undefined) => {
      setIntake((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const runAssessment = useCallback(() => {
    const result = assessSymptoms(intake.symptoms);
    setAssessment(result);
    setClinics([]);
    setSelectedClinic(null);
    setBookingStatus("idle");
    setSearchError("");
    setCallError("");
  }, [intake.symptoms]);

  const searchClinics = useCallback(async ({ location, specialty }: ClinicSearchCriteria) => {
    if (!location.trim() || !specialty.trim()) return [];
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch("/api/clinics/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          specialty,
        }),
      });
      const payload = (await response.json()) as {
        mode?: "demo" | "exa";
        clinics?: Clinic[];
        error?: string;
      };
      if (!response.ok || !payload.clinics) {
        throw new Error(payload.error ?? "Clinic search failed.");
      }
      setClinics(payload.clinics);
      setSearchMode(payload.mode ?? "demo");
      return payload.clinics;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Clinic search failed.";
      setSearchError(message);
      return [];
    } finally {
      setSearching(false);
    }
  }, []);

  const chooseClinic = useCallback((clinic: Clinic) => {
    setSelectedClinic(clinic);
    setBookingStatus("approval");
    setCallError("");
  }, []);

  const approveTestCall = useCallback(async () => {
    if (!selectedClinic) return;
    setBookingStatus("calling");
    setCallError("");
    try {
      const response = await fetch("/api/calls/test", {
        method: "POST",
        headers: {
          "x-aftercare-demo-pin": demoCallPin,
        },
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The real test call could not be started.");
      setBookingStatus("started");
      setDemoCallPin("");
    } catch (error) {
      setCallError(error instanceof Error ? error.message : "The real test call could not be started.");
      setBookingStatus("error");
    }
  }, [demoCallPin, selectedClinic]);

  const cancelCall = useCallback(() => {
    setBookingStatus("idle");
    setSelectedClinic(null);
    setDemoCallPin("");
    setCallError("");
  }, []);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    updateIntake("imageName", file.name);
  };

  const canAssess = intake.symptoms.trim().length >= 10 && intake.location.trim().length >= 2;
  return (
    <>
      <GenerativeUI />
      <AppControl
        intake={intake}
        assessment={assessment}
        clinics={clinics}
        selectedClinic={selectedClinic}
        bookingStatus={bookingStatus}
        searchClinics={searchClinics}
        chooseClinic={chooseClinic}
      />

      <main className="care-shell">
        <nav className="care-nav" aria-label="Primary navigation">
          <a className="care-brand" href="#top" aria-label="AfterCare home">
            <Image
              className="care-brand-logo"
              src="/brand/aftercare-logo.jpeg"
              alt=""
              width="190"
              height="59"
            />
          </a>
          <div className="care-nav-copy">
            <span>Private demo</span>
            <span>Not medical diagnosis</span>
          </div>
        </nav>

        <header className="care-header" id="top">
          <div>
            <p className="care-kicker">Healthcare navigation</p>
            <h1>From symptoms to a confirmed visit.</h1>
            <p className="care-lead">
              Describe what is happening. AfterCare helps you find the right place and arrange a test appointment.
            </p>
          </div>
          <div className="care-privacy-note">
            <strong>Your photo stays on this device.</strong>
            <span>This prototype does not upload or diagnose images.</span>
          </div>
        </header>

        <div className="care-grid">
          <section className="care-intake" aria-labelledby="intake-title">
            <div className="care-section-heading">
              <div className="care-step">1</div>
              <div>
                <h2 id="intake-title">Tell us what you need</h2>
                <p>Share only what is needed to find appropriate care.</p>
              </div>
            </div>

            <div className="care-form-grid">
              <div className="care-field care-field-wide">
                <label htmlFor="symptoms">Symptoms</label>
                <textarea
                  id="symptoms"
                  value={intake.symptoms}
                  onChange={(event) => updateIntake("symptoms", event.target.value)}
                  placeholder="Example: An itchy rash appeared two days ago and is slowly spreading."
                  rows={5}
                />
                <span>Do not include your full name, ID, or payment details.</span>
              </div>

              <div className="care-field">
                <label htmlFor="location">City or area</label>
                <input
                  id="location"
                  value={intake.location}
                  onChange={(event) => updateIntake("location", event.target.value)}
                  placeholder="Abu Dhabi"
                />
              </div>

              <div className="care-field">
                <label htmlFor="insurance">Payment</label>
                <select
                  id="insurance"
                  value={intake.insurance}
                  onChange={(event) => updateIntake("insurance", event.target.value)}
                >
                  <option>Self-pay</option>
                  <option>I have insurance</option>
                  <option>Not sure</option>
                </select>
              </div>

              <div className="care-field">
                <label htmlFor="availability">Preferred time</label>
                <select
                  id="availability"
                  value={intake.availability}
                  onChange={(event) => updateIntake("availability", event.target.value)}
                >
                  <option>Weekday morning</option>
                  <option>Weekday afternoon</option>
                  <option>Weekday evening</option>
                  <option>Weekend</option>
                  <option>First available</option>
                </select>
              </div>

              <div className="care-field">
                <label htmlFor="image">Optional photo</label>
                <label className="care-upload" htmlFor="image">
                  <input id="image" type="file" accept="image/*" onChange={handleImage} />
                  {imagePreview ? (
                    // The preview remains local and is never uploaded by this prototype.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Local symptom preview" />
                  ) : (
                    <span>Add a local preview</span>
                  )}
                </label>
              </div>
            </div>

            <button
              type="button"
              className="care-primary-action"
              disabled={!canAssess}
              onClick={runAssessment}
            >
              Prepare care options
            </button>

            {assessment && (
              <section
                className={`care-assessment care-assessment-${assessment.urgency}`}
                aria-live="polite"
              >
                <div className="care-section-heading care-section-heading-compact">
                  <div className="care-step">2</div>
                  <div>
                    <p className="care-result-label">{assessment.label}</p>
                    <h2>{assessment.specialty}</h2>
                  </div>
                </div>
                <p>{assessment.rationale}</p>
                <strong>{assessment.nextStep}</strong>
                {assessment.urgency !== "emergency" && (
                  <button
                    type="button"
                    className="care-secondary-action"
                    disabled={searching}
                    onClick={() => searchClinics({
                      location: intake.location,
                      specialty: assessment.specialty,
                    })}
                  >
                    {searching ? "Searching trusted sources..." : "Find matching clinics"}
                  </button>
                )}
              </section>
            )}

            {searchError && <p className="care-error" role="alert">{searchError}</p>}

            {!!clinics.length && (
              <section className="care-results" aria-labelledby="results-title">
                <div className="care-results-heading">
                  <div>
                    <p className="care-result-label">{searchMode === "exa" ? "Live web results" : "Demo clinic data"}</p>
                    <h2 id="results-title">Choose where to contact</h2>
                  </div>
                  <span>{clinics.length} options</span>
                </div>
                <div className="care-clinic-list">
                  {clinics.map((clinic) => (
                    <article className="care-clinic" key={clinic.id}>
                      <div>
                        <h3>{clinic.name}</h3>
                        <p className="care-clinic-location">{clinic.location}</p>
                        <p>{clinic.summary}</p>
                        {clinic.sourceUrl && (
                          <a href={clinic.sourceUrl} target="_blank" rel="noreferrer">
                            Review source
                          </a>
                        )}
                      </div>
                      <button type="button" onClick={() => chooseClinic(clinic)}>
                        Select clinic
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {selectedClinic && bookingStatus !== "idle" && (
              <section className="care-booking" aria-live="polite">
                <div className="care-section-heading care-section-heading-compact">
                  <div className="care-step">3</div>
                  <div>
                    <p className="care-result-label">Appointment request</p>
                    <h2>{selectedClinic.name}</h2>
                  </div>
                </div>

                {bookingStatus === "approval" && (
                  <>
                    <div className="care-consent-copy">
                      <p>A real call will go only to the verified team test number.</p>
                      <ul>
                        <li>The deployed call lets you speak with the AfterCare AI prototype.</li>
                        <li>Twilio transcribes your speech and OpenRouter generates each reply.</li>
                        <li>The selected clinic and website intake are not sent into the call.</li>
                      </ul>
                      <p>Use demo information only. Anything you say on the call is processed to generate a response.</p>
                      <label className="care-demo-pin" htmlFor="demo-call-pin">
                        <span>Team demo PIN</span>
                        <input
                          id="demo-call-pin"
                          type="password"
                          autoComplete="off"
                          inputMode="numeric"
                          value={demoCallPin}
                          onChange={(event) => setDemoCallPin(event.target.value)}
                          placeholder="Required for a real call"
                        />
                      </label>
                    </div>
                    <div className="care-actions">
                      <button
                        type="button"
                        className="care-primary-action"
                        disabled={demoCallPin.length < 6}
                        onClick={approveTestCall}
                      >
                        Place real test call
                      </button>
                      <button type="button" className="care-text-action" onClick={cancelCall}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {bookingStatus === "calling" && (
                  <div className="care-call-state">
                    <span className="care-pulse" aria-hidden="true" />
                    <div>
                      <strong>Starting a real test call</strong>
                      <p>Twilio is dialing the verified team number.</p>
                    </div>
                  </div>
                )}

                {bookingStatus === "started" && (
                  <div className="care-confirmation">
                    <p className="care-result-label">Real test call accepted</p>
                    <strong>Answer the team phone</strong>
                    <span>Twilio accepted the outbound Trial call request.</span>
                    <p>The call goes only to the configured test number. No clinic was contacted and no appointment was created.</p>
                  </div>
                )}

                {bookingStatus === "error" && (
                  <div className="care-call-error" role="alert">
                    <strong>Call not started</strong>
                    <p>{callError}</p>
                    <div className="care-actions">
                      <button type="button" className="care-secondary-action" onClick={() => setBookingStatus("approval")}>Try again</button>
                      <button type="button" className="care-text-action" onClick={cancelCall}>Cancel</button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </section>

          <aside className="care-assistant" aria-labelledby="assistant-title">
            <header>
              <div>
                <p className="care-result-label">Care navigator</p>
                <h2 id="assistant-title">Ask AfterCare</h2>
              </div>
              <span className="care-assistant-status">Ready</span>
            </header>
            <p className="care-assistant-note">
              The assistant can use your form context and search for clinics. It cannot diagnose you.
            </p>
            <CopilotChat
              className="care-chat"
              labels={{
                welcomeMessageText: "Tell me what kind of help you need, or complete the intake form beside me.",
                chatInputPlaceholder: "Ask about your next care step...",
              }}
            />
          </aside>
        </div>

        <footer className="care-footer">
          <strong>AfterCare prototype</strong>
          <p>For emergencies, contact local emergency services immediately.</p>
        </footer>
      </main>
    </>
  );
}
