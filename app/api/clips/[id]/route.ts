import { badRequest, notFound, readJson, stateResponse, withAdmin } from "@/lib/api";
import { deleteClip, updateClip } from "@/lib/repo";
import { isIsoDate } from "@/lib/date";

type Params = { params: Promise<{ id: string }> };

/** Edits a clip. Changing `clipDate` moves it to another day's history. */
export async function PATCH(request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    const body = await readJson<{
      label?: string | null;
      views?: number | null;
      clipDate?: string;
    }>(request);

    if (body.clipDate !== undefined && !isIsoDate(body.clipDate)) {
      return badRequest("Clip date must be YYYY-MM-DD.");
    }

    await updateClip(id, { label: body.label, views: body.views, clipDate: body.clipDate });
    return stateResponse();
  });
}

/** Removing a clip gives back the one post it counted for. */
export async function DELETE(_request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    if (!(await deleteClip(id))) return notFound("Clip not found.");
    return stateResponse();
  });
}
