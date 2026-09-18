import { readJson, stateResponse, withAdmin } from "@/lib/api";
import { deleteReport, updateReport } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    const body = await readJson<{ week?: string; summary?: string; postedDate?: string }>(request);
    updateReport(id, body);
    return stateResponse();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdmin(async () => {
    const { id } = await params;
    deleteReport(id);
    return stateResponse();
  });
}
