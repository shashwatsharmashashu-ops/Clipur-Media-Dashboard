import {
  optionalNumber,
  readJson,
  stateResponse,
  validTrackedStatus,
  withAdmin,
} from "@/lib/api";
import { deleteItem, updateItem } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    const body = await readJson<{
      name?: string;
      groupName?: string;
      postsTarget?: unknown;
      postsMade?: unknown;
      status?: string;
    }>(request);

    await updateItem(id, {
      name: body.name,
      groupName: body.groupName,
      postsTarget: optionalNumber(body.postsTarget),
      postsMade: optionalNumber(body.postsMade),
      status: validTrackedStatus(body.status),
    });
    return stateResponse();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    await deleteItem(id);
    return stateResponse();
  });
}
