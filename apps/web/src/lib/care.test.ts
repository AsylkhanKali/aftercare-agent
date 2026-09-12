import assert from "node:assert/strict";
import test from "node:test";
import { assessSymptoms } from "./care";

test("routes emergency warning phrases away from routine booking", () => {
  const result = assessSymptoms("I have sudden chest pain and feel unwell");

  assert.equal(result.urgency, "emergency");
  assert.equal(result.specialty, "Emergency services");
});

test("suggests prompt review for severe non-emergency symptoms", () => {
  const result = assessSymptoms("A rash is rapidly spreading across my arm");

  assert.equal(result.urgency, "same-day");
  assert.equal(result.specialty, "Dermatology");
});

test("maps routine symptoms to an appropriate care category", () => {
  const result = assessSymptoms("My knee has been mildly sore for four days");

  assert.equal(result.urgency, "routine");
  assert.equal(result.specialty, "Orthopedics or primary care");
});
