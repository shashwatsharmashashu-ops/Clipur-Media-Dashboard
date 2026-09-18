import { stateResponse, withAdmin } from "@/lib/api";

/** The whole dashboard in one payload. Clients refetch this after a change. */
export async function GET() {
  return withAdmin(() => stateResponse());
}
