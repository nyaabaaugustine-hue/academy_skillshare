import { requireAdmin } from "../../../lib/admin-auth";
import AiToolsClient from "./AiToolsClient";

export const dynamic = "force-dynamic";

export default async function AdminAiToolsPage() {
  await requireAdmin();
  return <AiToolsClient />;
}
