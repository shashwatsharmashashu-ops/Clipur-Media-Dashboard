import {
  badRequest,
  readJson,
  stateResponse,
  validPlatform,
  validStrategyStatus,
  withAdmin,
} from "@/lib/api";
import { createStrategy } from "@/lib/repo";

export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{
      title?: string;
      description?: string;
      status?: string;
      platform?: string;
    }>(request);

    const title = (body.title ?? "").trim();
    if (!title) return badRequest("A title is required.");

    await createStrategy({
      title,
      description: body.description,
      status: validStrategyStatus(body.status),
      platform: validPlatform(body.platform) ?? null,
    });
    return stateResponse();
  });
}
