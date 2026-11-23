import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { tryDb } from "@/lib/db";

export const revalidate = 0;

export default async function SharedSnippetPage({ params }) {
  const { token } = await params;
  const sql = tryDb();
  let snippet = null;
  if (sql) {
    try {
      const rows = await sql`
        select title, code, stdin, language, share_token, created_at
        from playground_snippets
        where share_token = ${token} and is_public = true
        limit 1
      `;
      snippet = rows[0] || null;
    } catch {
      snippet = null;
    }
  }
  if (!snippet) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section-wrap" style={{ paddingTop: 48, paddingBottom: 24 }}>
          <div className="eyebrow"><span />SHARED SNIPPET</div>
          <h1 style={{ marginTop: 12, marginBottom: 12 }}>{snippet.title}</h1>
          <p className="admin-muted" style={{ fontSize: 12 }}>Shared on {new Date(snippet.created_at).toLocaleString()} · Language: {snippet.language}</p>
        </section>
        <section className="section-wrap" style={{ paddingBottom: 32 }}>
          <pre style={{ width: "100%", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#e5e7eb", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "auto" }}>{snippet.code}</pre>
          {snippet.stdin ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Stdin</div>
              <pre style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#d1fae5", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13, whiteSpace: "pre-wrap" }}>{snippet.stdin}</pre>
            </div>
          ) : null}
          <div className="hero-actions" style={{ marginTop: 16, gap: 10, flexWrap: "wrap" }}>
            <a className="button button-primary button-small" href={`/playground?snippet=${encodeURIComponent(snippet.share_token)}`}>Open in playground <span className="arrow">→</span></a>
            <a className="button button-outline button-small" href="/playground">New playground <span className="arrow">→</span></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
