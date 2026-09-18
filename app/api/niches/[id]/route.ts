import { readJson, stateResponse, withAdmin } from "@/lib/api";
import { deleteNiche, updateNiche } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    const body = await readJson<{ name?: string }>(request);
    updateNiche(id, { name: body.name });
    return stateResponse();
  });
}

/** Removing a niche removes its accounts and their clips. */
export async function DELETE(_request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    deleteNiche(id);
    return stateResponse();
  });
}
