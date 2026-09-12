import { NextResponse } from "next/server";
import { searchWeb } from "agent-core";
import { DEMO_CLINICS, type Clinic } from "@/lib/care";

type SearchRequest = {
  location?: string;
  specialty?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SearchRequest;
  const location = body.location?.trim();
  const specialty = body.specialty?.trim();

  if (!location || !specialty) {
    return NextResponse.json(
      { error: "Location and specialty are required." },
      { status: 400 },
    );
  }

  if (!process.env.EXA_API_KEY) {
    return NextResponse.json({ mode: "demo", clinics: DEMO_CLINICS });
  }

  try {
    const query = [
      `Find official clinic or hospital pages for ${specialty} in ${location}.`,
      "Prefer pages that clearly show an address, appointment information, and contact details.",
    ].join(" ");
    const hits = await searchWeb({ query, results: 6 });

    if (typeof hits === "string") {
      throw new Error(hits);
    }

    const clinics: Clinic[] = hits.map((hit, index) => ({
      id: `exa-${index}-${encodeURIComponent(hit.url).slice(0, 36)}`,
      name: hit.title,
      location,
      summary: hit.highlight ?? "Public clinic result found by Exa.",
      source: "exa",
      sourceUrl: hit.url,
      availability: ["Call to confirm availability"],
    }));

    return NextResponse.json({ mode: "exa", clinics });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Clinic search failed.",
      },
      { status: 502 },
    );
  }
}
