import {
  readJson,
  stateResponse,
  validPlatform,
  validStrategyStatus,
  withAdmin,
} from "@/lib/api";
import { deleteStrategy, updateStrategy } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    const body = await readJson<{
      title?: string;
      description?: string;
      status?: string;
      selected?: boolean;
      platform?: string | null;
      report?: { reach?: string; topClip?: string; verdict?: string } | null;
    }>(request);

    await updateStrategy(id, {
      title: body.title,
      description: body.description,
      status: validStrategyStatus(body.status),
      selected: typeof body.selected === "boolean" ? body.selected : undefined,
      platform: body.platform === null ? null : validPlatform(body.platform),
      report: body.report,
    });
    return stateResponse();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    await deleteStrategy(id);
    return stateResponse();
  });
}
