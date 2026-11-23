import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getAwardByToken } from "@/lib/awards";
import ConsentClient from "./ConsentClient";

export const revalidate = 0;

export default async function CertificateConsentPage({ params }) {
  const { token } = await params;
  const award = await getAwardByToken(token);
  if (!award) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero certificate-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />GUARDIAN CONSENT</div>
            <h1>Review and <em>confirm.</em></h1>
            <p>Guardian consent controls whether a learner’s certificate is published publicly.</p>
          </div>
        </section>
        <section className="inner-content section-wrap">
          <ConsentClient
            token={token}
            award={{
              learner: award.learner_alias || award.learner_name,
              title: award.award_title,
              milestone: award.milestone,
              consentVerified: Boolean(award.consent_verified),
              consentRespondedAt: award.consent_responded_at || null,
            }}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
