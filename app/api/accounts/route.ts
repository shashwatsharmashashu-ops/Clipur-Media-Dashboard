import {
  badRequest,
  optionalNumber,
  readJson,
  stateResponse,
  validTrackedStatus,
  withAdmin,
} from "@/lib/api";
import { createAccount } from "@/lib/repo";

export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{
      nicheId?: string;
      handle?: string;
      postsTarget?: unknown;
      status?: string;
    }>(request);

    const handle = (body.handle ?? "").trim();
    if (!body.nicheId) return badRequest("A niche is required.");
    if (!handle) return badRequest("Account handle is required.");

    createAccount({
      nicheId: body.nicheId,
      handle,
      postsTarget: optionalNumber(body.postsTarget) ?? 0,
      status: validTrackedStatus(body.status),
    });
    return stateResponse();
  });
}
