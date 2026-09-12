# AfterCare Website Design System

## Purpose

This document is the source of truth for any AI or developer designing the AfterCare website. Apply it consistently across the patient portal, appointment booking, health records, AI companion, recovery plan, medication reminders, and future care-team tools.

AfterCare is an AI healthcare companion across the patient journey. It helps patients book appointments, view doctors and records, understand laboratory results, follow medication schedules, complete daily recovery check-ins, and arrange follow-up care.

The product should feel calm, warm, organized, and credible. It should never resemble an insurance dashboard, a generic hospital template, a futuristic AI experiment, or a social app.

## Visual Brand Idea

### Visual Personality

- Warm, but not sentimental
- Calm, but not passive
- Clinically credible, but not cold
- Clear, but not simplistic
- Human, but still professional

## Selected Logo

Use the approved horizontal AfterCare logo with:

- Deep teal primary figure
- Calm mint secondary figure
- Small coral accent
- Charcoal-teal wordmark
- Warm ivory background

Preserve the original proportions, spelling, colors, and clear space. Do not recreate or reinterpret the mark.

### Logo Rules

- Preferred placement: top-left of navigation on warm ivory or white.
- Leave clear space around the logo equal to the height of the capital `A`.
- Minimum digital width: 140 px for the full wordmark.
- Use an icon-only version below 140 px when available.
- Do not stretch, rotate, crop, outline, shadow, bevel, or animate the logo.
- Do not put the logo over photography or visually busy backgrounds.
- Do not use coral for the entire word `Care`.
- Do not add a medical cross, stethoscope, heartbeat line, robot, brain, or shield.

## Color System

### Brand Colors

| Token | Name | Hex | Primary use |
|---|---|---:|---|
| `--brand-primary` | Deep Care Teal | `#126B67` | Primary actions, active navigation, links, key icons |
| `--brand-primary-dark` | Midnight Teal | `#123F3D` | Headings, dark surfaces, hover states |
| `--brand-mint` | Calm Mint | `#DCEFEB` | Selected states, AI companion surfaces, soft highlights |
| `--brand-coral` | Warm Coral | `#E36F56` | Small human accents, progress moments, limited illustration details |
| `--brand-coral-soft` | Soft Peach | `#FBE6DE` | Warm callouts and supportive background areas |
| `--background` | Warm Ivory | `#FAF8F3` | Main page background |
| `--surface` | White | `#FFFFFF` | Cards, panels, dialogs, forms |
| `--text-primary` | Soft Charcoal | `#202927` | Main body copy and strong headings |
| `--text-secondary` | Slate | `#5E6B68` | Supporting copy, dates, metadata |
| `--border` | Mist Grey | `#DCE3E1` | Dividers, inputs, table lines, card borders |

### Usage Ratio

- 55% warm ivory
- 25% white surfaces
- 12% teal and midnight teal
- 5% charcoal and grey
- 2% mint
- 1% coral

Coral and mint are recognizable parts of the logo, but should be restrained in the interface. A page should not contain large teal, mint, and coral regions at the same time.

### Semantic Colors

| Token | Meaning | Hex |
|---|---|---:|
| `--success` | Completed or confirmed | `#237A57` |
| `--success-soft` | Completed background | `#E7F4EC` |
| `--info` | Neutral medical information | `#286FAF` |
| `--info-soft` | Information background | `#EAF2FA` |
| `--attention` | Needs attention | `#A86408` |
| `--attention-soft` | Attention background | `#FFF1D6` |
| `--urgent` | Urgent action | `#B42332` |
| `--urgent-soft` | Urgent background | `#FCE8EA` |

Do not use coral as an error or urgent color. Do not use teal to label an action safe unless the words also say so. Always pair status color with an icon and an explicit label.

### CSS Variables

```css
:root {
  --brand-primary: #126B67;
  --brand-primary-dark: #123F3D;
  --brand-mint: #DCEFEB;
  --brand-coral: #E36F56;
  --brand-coral-soft: #FBE6DE;
  --background: #FAF8F3;
  --surface: #FFFFFF;
  --text-primary: #202927;
  --text-secondary: #5E6B68;
  --border: #DCE3E1;
  --success: #237A57;
  --success-soft: #E7F4EC;
  --info: #286FAF;
  --info-soft: #EAF2FA;
  --attention: #A86408;
  --attention-soft: #FFF1D6;
  --urgent: #B42332;
  --urgent-soft: #FCE8EA;
}
```

## Typography

Use **Manrope** for the logo-adjacent marketing headings and **Inter** for product interface text. If only one family can be loaded, use Inter everywhere.

| Role | Size | Weight | Line height |
|---|---:|---:|---:|
| Display heading | 48–56 px | 600 | 1.08 |
| Page title | 32–40 px | 600 | 1.15 |
| Section heading | 22–26 px | 600 | 1.25 |
| Card heading | 17–19 px | 600 | 1.3 |
| Body | 16–18 px | 400 | 1.55 |
| Button | 16 px | 600 | 1.2 |
| Supporting copy | 14–15 px | 400 | 1.45 |

- Never use thin font weights.
- Use sentence case throughout the product.
- Avoid all caps except very short data labels.
- Use tabular numerals for laboratory values, medication doses, dates, and times.
- Do not shrink critical medical or appointment information below 16 px.

## Layout and Spacing

Use a calm, spacious layout based on an 8 px grid.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
```

- Desktop content width: 1180–1280 px.
- Reading content width: 680–760 px.
- Cards: 20–24 px internal padding.
- Page sections: 48–72 px vertical separation.
- Keep one dominant action per section.
- Do not fill empty space with decorative medical graphics.

## Shape and Depth

- Standard card radius: 16 px.
- Buttons and inputs: 10–12 px radius.
- Status chips: fully rounded only when they behave like labels or filters.
- Use thin `#DCE3E1` borders for most separation.
- Use shadows sparingly: `0 4px 20px rgba(18, 63, 61, 0.07)`.
- Avoid glassmorphism, neon, strong gradients, glossy 3D elements, and floating dashboard clutter.

## Navigation

Recommended patient navigation:

1. **Today**
2. **Appointments**
3. **Care team**
4. **Health record**
5. **Recovery plan**
6. **Messages**

Keep the AfterCare Companion available through a persistent button at the bottom-right on desktop and in the bottom navigation on mobile. It should be visible without competing with urgent clinical actions.

## Homepage: Today

The homepage must answer:

1. What do I need to do today?
2. What happens next?
3. Where can I get help?

Recommended hierarchy:

- Warm greeting and current date
- `Today's care` task list
- Next appointment card
- Medication schedule
- Latest result or document requiring attention
- Recovery trend or recent check-in
- Care-team contact entry point

Do not open with statistics, charts, or a generic chatbot. Open with the patient's next concrete actions.

## Appointment Experience

Appointment booking should feel guided and low effort.

### Flow

1. Choose reason for visit.
2. Choose specialty or suggested clinician.
3. Choose location or virtual visit.
4. Choose time.
5. Review insurance and preparation information.
6. Confirm booking.

### Appointment Card

Show:

- Doctor name and specialty
- Date, time, and time zone
- Hospital or virtual visit
- Status: requested, confirmed, rescheduled, or cancelled
- Preparation instructions
- Clear `Manage appointment` action

Do not present a requested appointment as confirmed. Use full dates such as `Tuesday, 15 September at 10:30 AM` rather than ambiguous numeric dates.

## Care Team

Display doctors and relevant care staff as part of one coordinated team.

Each card should include:

- Professional photo or initials
- Full name
- Specialty and role in the patient's care
- Affiliated facility
- Next appointment, if relevant
- `View profile` and `Book appointment` actions

Do not use course-like tabs that make doctors appear interchangeable. The Brightspace analogy should influence organization, not the visual identity.

## Health Record and Laboratory Results

Use a clear visual hierarchy that keeps the original result prominent and places the plain-language explanation beneath it.

### Result Display

- Test name
- Exact value
- Unit
- Laboratory reference range
- Collection date
- Ordering clinician
- Link to original report

### Explanation Structure

1. **What this test measures**
2. **Your result**
3. **What the reference range means**
4. **Questions you may want to ask your doctor**

Use restrained information panels and keep explanations visually secondary to the original clinical data.

## Recovery Plan

The recovery plan is the signature product area.

Show:

- Recovery stage and day number
- Medication schedule
- Daily care tasks
- Symptoms the clinician asked the patient to monitor
- Upcoming follow-up
- A chronological recovery timeline

Use a vertical timeline rather than a gamified streak. Recovery is not a competition, and missed tasks should not shame the patient.

## Medication Experience

Each medication card should include:

- Medication name
- Dose and form
- Timing
- Purpose, if documented
- Start/end date, if applicable
- Clinician-approved instructions
- Patient response: `Taken`, `Not yet`, or `I need help`

## AfterCare Companion

The companion should feel present and helpful without pretending to be a person.

### Visual Treatment

- Use a calm mint background for the conversation panel.
- Use deep teal for the companion icon and primary actions.
- Reserve coral for a tiny presence indicator or supportive illustration detail.
- Display the name `AfterCare Companion` and the label `AI care assistant` in a small, visually secondary style.
- Keep chat bubbles spacious, with a maximum readable line length of approximately 55–65 characters.
- Use clear visual separation between patient and companion messages without using saturated colors.

## Buttons and Actions

### Primary

- Deep teal background
- White label
- Used once per view for the main action
- Examples: `Book appointment`, `Confirm`, `Start check-in`

### Secondary

- White background
- Teal text and border
- Examples: `View details`, `Ask AfterCare`

### Tertiary

- Text link with arrow or underline
- Examples: `Open original report`, `Learn more`

### Destructive or Urgent Styling

- Red is reserved for destructive or urgent controls.
- Pair red with an icon, border, and text label.
- Do not apply red to routine navigation or decorative elements.

## Forms

- Put labels above fields; do not rely on placeholder text.
- Show examples below unfamiliar medical or insurance fields.
- Validate after the user completes a field, not on every keystroke.
- Place errors beside the relevant field and explain how to fix them.
- Preserve entered information if a submission fails.
- Use segmented steps for long booking or onboarding flows.

## Data Visualization

Use charts only when they help patients understand change over time.

- Prefer simple line charts for recovery symptoms or repeated measurements.
- Label axes and values directly.
- Show the source and date range.
- Do not use red/green alone to encode status.
- Avoid gauge charts, decorative rings, and unexplained health scores.
- Never imply clinical improvement from an incomplete dataset.

## Imagery

Use real, warm, everyday moments:

- Booking care from home
- Reviewing results with a family member
- Completing a recovery check-in
- A clinician responding to a concern

Use natural light, warm neutral environments, and diverse patients and clinicians. Avoid posed doctors with crossed arms, glowing AI brains, robots, holograms, sterile corridors, or visibly distressed patients used decoratively.

Illustrations should use teal linework, warm ivory, muted mint areas, and very limited coral details.

## Motion

- Use motion to confirm cause and effect.
- Standard transition: 150–220 ms.
- Avoid bouncing, pulsing, confetti, and continuous animation.
- Respect `prefers-reduced-motion`.
- Urgent alerts should remain visually stable and readable.

## Accessibility

- Meet WCAG 2.2 AA.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text.
- Never use color as the only signal.
- Provide visible keyboard focus.
- Use minimum 44 × 44 px interactive targets.
- Support browser zoom and responsive text reflow.
- Include descriptive labels for icons and controls.
- Use semantic headings and landmarks.
- Provide transcripts for voice interactions.
- Support right-to-left layouts for future Arabic localization.
- Keep critical content understandable without animation, audio, or imagery.

## Responsive Behavior

### Mobile

- Use a bottom navigation with no more than five destinations.
- Keep `Today`, `Appointments`, and `AfterCare` immediately accessible.
- Stack cards vertically.
- Make medication and check-in actions thumb reachable.
- Use full-screen sheets for booking and AI conversations.

### Desktop

- Use a left navigation rail or restrained top navigation.
- Allow a two-column Today page: tasks on the left, appointments and care team on the right.
- Keep reading-heavy health explanations in a narrow column.

## Empty, Loading, and Error States

Every state must explain what happened and what the patient can do.

- Empty: `You have no appointments scheduled.` + `Book an appointment`
- Loading: use subtle skeletons; do not hide the page title.
- Error: `We couldn't load your results. Try again or open the original report.`
- Booking failure: preserve the chosen slot and explain whether it is still held.
- AI unavailable: keep appointment, medication, and document functions usable.

## Do Not Do

- Do not make the interface predominantly bright blue and white.
- Do not spread coral across primary buttons, errors, and decorative elements.
- Do not gamify medication adherence with points, streak loss, or guilt.
- Do not hide original medical documents behind summaries.
- Do not place more than one urgent message on a screen without clear priority.
- Do not use tiny metadata, low-contrast grey text, or unlabeled icons.

## Page Acceptance Checklist

Before accepting any AI-generated page, verify:

- The next action is obvious within five seconds.
- The page uses warm ivory and white as its dominant colors.
- Teal identifies the main action consistently.
- Coral occupies no more than a small accent area.
- Medical status includes words and icons, not color alone.
- Original records remain accessible.
- Requested and completed actions are visually distinct.
- The page works on mobile and desktop.
- Text contrast and control sizes meet accessibility requirements.
- The design feels like one coherent AfterCare product.

## Master Prompt for a Website-Generation AI

> Design a responsive patient-facing healthcare platform called AfterCare. The website includes Today, Appointments, Care Team, Health Record, Recovery Plan, Messages, medication cards, laboratory-result views, booking flows, and an AfterCare Companion panel. The visual experience must feel warm, calm, human, spacious, and clinically credible. Use warm ivory `#FAF8F3` and white as the dominant surfaces, deep teal `#126B67` for primary actions, midnight teal `#123F3D` and charcoal `#202927` for headings, calm mint `#DCEFEB` for selected states and companion surfaces, and coral `#E36F56` only as a restrained human accent. Use approximately 55% ivory, 25% white, 12% teal, 5% neutral, 2% mint, and 1% coral. Use Manrope for expressive headings and Inter for interface text. Apply generous whitespace, a clear 8 px spacing system, 16 px cards, 10–12 px control radii, subtle borders, restrained shadows, simple line icons, and one visually dominant action per section. Keep reading content within 680–760 px. Present laboratory values, units, reference ranges, dates, and source documents with strong visual hierarchy. Use simple vertical timelines for recovery and uncomplicated line charts for trends. Meet WCAG 2.2 AA, never use color as the sole status indicator, include visible focus states, and design mobile-first. Avoid generic bright hospital-blue templates, gradients, glassmorphism, glossy 3D, robots, glowing AI graphics, gamified recovery visuals, crowded dashboards, excessive pill components, and medical stock imagery.
