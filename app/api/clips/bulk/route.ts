import { badRequest, json, readJson, stateResponse, withAdmin } from "@/lib/api";
import { addClips } from "@/lib/repo";
import { parseUrlList } from "@/lib/url";
import { isIsoDate } from "@/lib/date";
import type { ClipOwnerType } from "@/lib/types";

/**
 * Logs many links in one action.
 *
 * Accepts either a raw pasted blob (`urls` as a string, split on newlines,
 * commas or whitespace) or an already-split array. Duplicates — both against
 * stored clips and within the paste itself — are skipped rather than rejected,
 * and the response carries the counts so the admin can see what happened.
 */
export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{
      ownerType?: string;
      ownerId?: string;
      urls?: string | string[];
      clipDate?: string;
    }>(request);

    const ownerType =
      body.ownerType === "account" ? "account" : body.ownerType === "item" ? "item" : null;
    const ownerId = body.ownerId ?? "";

    if (!ownerType || !ownerId) return badRequest("An owner is required.");
    if (body.clipDate !== undefined && !isIsoDate(body.clipDate)) {
      return badRequest("Clip date must be YYYY-MM-DD.");
    }

    const urls = Array.isArray(body.urls)
      ? body.urls.flatMap((entry) => parseUrlList(String(entry)))
      : parseUrlList(body.urls ?? "");

    if (urls.length === 0) return badRequest("Paste at least one link.");

    const result = await addClips({
      ownerType: ownerType as ClipOwnerType,
      ownerId,
      urls,
      clipDate: body.clipDate,
    });

    if (!result.ok) {
      return json({ error: "That account or campaign no longer exists." }, 404);
    }

    const { ok: _ok, ...summary } = result;
    return stateResponse({ summary });
  });
}
