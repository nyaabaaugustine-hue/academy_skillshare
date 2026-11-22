import { Suspense } from "react";
import { requireAdmin } from "../../../lib/admin-auth";
import AiToolsClient from "./AiToolsClient";

export const dynamic = "force-dynamic";

export default async function AdminAiToolsPage() {
  await requireAdmin();
  return (
    <Suspense fallback={<div className="admin-page"><p className="admin-muted">Loading AI tools...</p></div>}>
      <AiToolsClient />
    </Suspense>
  );
}
