import { badRequest, readJson, stateResponse, withAdmin } from "@/lib/api";
import { createReport } from "@/lib/repo";

export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{ week?: string; summary?: string; postedDate?: string }>(request);
    const week = (body.week ?? "").trim();
    if (!week) return badRequest("A week label is required.");

    await createReport({ week, summary: body.summary, postedDate: body.postedDate });
    return stateResponse();
  });
}
