import {
  badRequest,
  optionalNumber,
  readJson,
  stateResponse,
  validPlatform,
  validTrackedStatus,
  withAdmin,
} from "@/lib/api";
import { createItem } from "@/lib/repo";

/** Creates a campaign (client work) or an IG / TikTok content item. */
export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{
      kind?: string;
      platform?: string;
      groupName?: string;
      name?: string;
      postsTarget?: unknown;
      status?: string;
    }>(request);

    const name = (body.name ?? "").trim();
    if (!name) return badRequest("A name is required.");

    const kind = body.kind === "campaign" ? "campaign" : "platform";
    if (kind === "platform" && !validPlatform(body.platform)) {
      return badRequest("A valid platform is required.");
    }

    await createItem({
      kind,
      platform: kind === "platform" ? validPlatform(body.platform) : null,
      groupName: kind === "platform" ? (body.groupName ?? "").trim() || null : null,
      name,
      postsTarget: optionalNumber(body.postsTarget) ?? 0,
      status: validTrackedStatus(body.status),
    });
    return stateResponse();
  });
}
