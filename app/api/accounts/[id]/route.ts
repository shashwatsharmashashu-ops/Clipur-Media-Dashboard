import {
  optionalNumber,
  readJson,
  stateResponse,
  validTrackedStatus,
  withAdmin,
} from "@/lib/api";
import { deleteAccount, updateAccount } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    const body = await readJson<{
      handle?: string;
      postsTarget?: unknown;
      postsMade?: unknown;
      status?: string;
      nicheId?: string;
    }>(request);

    await updateAccount(id, {
      handle: body.handle,
      postsTarget: optionalNumber(body.postsTarget),
      postsMade: optionalNumber(body.postsMade),
      status: validTrackedStatus(body.status),
      nicheId: body.nicheId,
    });
    return stateResponse();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    await deleteAccount(id);
    return stateResponse();
  });
}
