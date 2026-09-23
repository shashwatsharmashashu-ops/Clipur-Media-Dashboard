import { badRequest, readJson, stateResponse, validPlatform, withAdmin } from "@/lib/api";
import { createNiche } from "@/lib/repo";

export async function POST(request: Request) {
  return withAdmin(async () => {
    const body = await readJson<{ name?: string; platform?: string }>(request);
    const name = (body.name ?? "").trim();
    const platform = validPlatform(body.platform) ?? "x";

    if (!name) return badRequest("Niche name is required.");

    await createNiche({ platform, name });
    return stateResponse();
  });
}
