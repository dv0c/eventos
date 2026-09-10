import { withAdmin } from "@/app/api/admin/_utils";
import { adminService } from "@/server/services/admin.service";

export async function GET() {
  return withAdmin(async () => adminService.getOverview());
}
