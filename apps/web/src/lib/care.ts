export type CareUrgency = "emergency" | "same-day" | "routine";

export type CareAssessment = {
  urgency: CareUrgency;
  label: string;
  specialty: string;
  rationale: string;
  nextStep: string;
};

export type Clinic = {
  id: string;
  name: string;
  location: string;
  summary: string;
  source: "demo" | "exa";
  sourceUrl?: string;
  availability: string[];
};

export type Intake = {
  symptoms: string;
  location: string;
  insurance: string;
  availability: string;
  imageName?: string;
};

export const EMPTY_INTAKE: Intake = {
  symptoms: "",
  location: "",
  insurance: "Self-pay",
  availability: "Weekday afternoon",
};

export const DEMO_CLINICS: Clinic[] = [
  {
    id: "harbor-family",
    name: "Harbor Family Clinic",
    location: "Central district",
    summary: "Primary care with same-day assessment and referral support.",
    source: "demo",
    availability: ["Today, 4:20 PM", "Tomorrow, 10:40 AM"],
  },
  {
    id: "northline-dermatology",
    name: "Northline Dermatology",
    location: "North district",
    summary: "Specialist dermatology consultations for new and returning patients.",
    source: "demo",
    availability: ["Tomorrow, 3:30 PM", "Thursday, 11:10 AM"],
  },
  {
    id: "cedar-urgent-care",
    name: "Cedar Urgent Care",
    location: "Waterfront district",
    summary: "Walk-in and scheduled visits for non-life-threatening urgent symptoms.",
    source: "demo",
    availability: ["Today, 6:10 PM", "Tomorrow, 9:20 AM"],
  },
];

const emergencyPatterns = [
  /chest pain/i,
  /difficulty breathing/i,
  /can't breathe/i,
  /severe bleeding/i,
  /unconscious/i,
  /боль в груди/i,
  /тяжело дышать/i,
  /не могу дышать/i,
  /сильное кровотечение/i,
  /без сознания/i,
];

const sameDayPatterns = [
  /high fever/i,
  /rapidly spreading/i,
  /severe pain/i,
  /высокая температура/i,
  /быстро распространя/i,
  /сильная боль/i,
];

export function assessSymptoms(symptoms: string): CareAssessment {
  if (emergencyPatterns.some((pattern) => pattern.test(symptoms))) {
    return {
      urgency: "emergency",
      label: "Emergency warning",
      specialty: "Emergency services",
      rationale: "Your description includes a symptom that may need immediate care.",
      nextStep: "Call your local emergency number now. Do not wait for an appointment.",
    };
  }

  const lower = symptoms.toLowerCase();
  const dermatology = /rash|skin|mole|itch|сып|кож|родин|зуд/.test(lower);
  const musculoskeletal = /back|knee|joint|sprain|спин|колен|сустав|растяж/.test(lower);
  const specialty = dermatology
    ? "Dermatology"
    : musculoskeletal
      ? "Orthopedics or primary care"
      : "Primary care";

  if (sameDayPatterns.some((pattern) => pattern.test(symptoms))) {
    return {
      urgency: "same-day",
      label: "Same-day review suggested",
      specialty,
      rationale: "The symptom description may benefit from prompt in-person assessment.",
      nextStep: "Look for a same-day clinic. Seek urgent help if symptoms worsen.",
    };
  }

  return {
    urgency: "routine",
    label: "Routine appointment",
    specialty,
    rationale: "No emergency warning words were detected in this initial intake.",
    nextStep: "Compare nearby clinics and confirm a suitable appointment time.",
  };
}
