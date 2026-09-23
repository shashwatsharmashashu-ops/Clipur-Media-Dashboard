import { badRequest, json, optionalNumber, readJson, stateResponse, withAdmin } from "@/lib/api";
import { addClip } from "@/lib/repo";
import { isProbablyUrl } from "@/lib/url";
import { isIsoDate } from "@/lib/date";
import type { ClipOwnerType } from "@/lib/types";

/**
 * Logs a clip. Pasting a link is the whole interaction: the clip is appended
 * and the owner's posted count goes up by exactly one.
 *
 * A link that normalizes to one already logged for this owner is refused with
 * 409 so it can never count twice.
 */
export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{
      ownerType?: string;
      ownerId?: string;
      url?: string;
      label?: string;
      views?: unknown;
      clipDate?: string;
    }>(request);

    const ownerType = body.ownerType === "account" ? "account" : body.ownerType === "item" ? "item" : null;
    const ownerId = body.ownerId ?? "";
    const url = (body.url ?? "").trim();

    if (!ownerType || !ownerId) return badRequest("An owner is required.");
    if (!url) return badRequest("Paste a clip link.");
    if (!isProbablyUrl(url)) return badRequest("That does not look like a link.");
    if (body.clipDate !== undefined && !isIsoDate(body.clipDate)) {
      return badRequest("Clip date must be YYYY-MM-DD.");
    }

    const result = await addClip({
      ownerType: ownerType as ClipOwnerType,
      ownerId,
      url,
      label: body.label,
      views: optionalNumber(body.views) ?? null,
      // Defaults to today inside the repo when the client sends nothing.
      clipDate: body.clipDate,
    });

    if (!result.ok && result.reason === "no_owner") {
      return json({ error: "That account or campaign no longer exists." }, 404);
    }
    if (!result.ok && result.reason === "duplicate") {
      return json(
        {
          error: "Already logged — this link is a duplicate and was not counted again.",
          duplicate: true,
          clip: result.clip,
        },
        409,
      );
    }

    return stateResponse({ clip: result.ok ? result.clip : null });
  });
}
