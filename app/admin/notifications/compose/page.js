import { requireAdmin } from "@/lib/admin-auth";
import ComposeCampaignClient from "./ComposeCampaignClient";

export const dynamic = "force-dynamic";

export default async function ComposeCampaignPage() {
  await requireAdmin();
  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Compose notification campaign</h1>
          <p>Create a campaign to send to Flutter and web users. Send immediately or schedule.</p>
        </div>
      </header>
      <section className="admin-panel">
        <ComposeCampaignClient />
      </section>
    </>
  );
}
