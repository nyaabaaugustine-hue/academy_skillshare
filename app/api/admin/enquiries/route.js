import { NextResponse } from "next/server";

import { assertAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";

const ALLOWED = new Set(["new", "contacted", "scheduled", "enrolled", "closed", "lost"]);

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function logAudit(sql, action, entityId, metadata = {}) {
  try {
    await sql`
      insert into audit_log (actor_user_id, action, entity_type, entity_id, metadata)
      values (${ "admin" }, ${action}, ${"school_enquiry"}, ${String(entityId)}, ${JSON.stringify(metadata)})
    `;
  } catch {
    // Audit logging should not block admin workflow.
  }
}

export async function GET(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  if (url.searchParams.get("format") !== "csv") {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }
  try {
    const sql = db();
    const rows = await sql`
      select id, school_name, school_location, contact_name, email, phone,
             learner_count, programme_interest, message, status, source,
             assigned_to, admin_note, follow_up_at, last_contacted_at, created_at, updated_at
      from school_enquiries
      order by created_at desc
    `;
    const header = ["id","created_at","status","source","school_name","school_location","contact_name","email","phone","learner_count","programme_interest","assigned_to","follow_up_at","last_contacted_at","message","admin_note"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(header.map((k) => csvEscape(r[k] instanceof Date ? r[k].toISOString() : r[k])).join(","));
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="skillbridge-enquiries-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const id = Number(form.get("id") ?? 0);
  const intent = clean(form.get("intent"), 40);

  try {
    const sql = db();

    if (intent === "delete") {
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.redirect(new URL("/admin/enquiries?error=missing", request.url), 303);
      }
      await sql`delete from school_enquiries where id = ${id}`;
      await logAudit(sql, "enquiry.deleted", id);
      return NextResponse.redirect(new URL("/admin/enquiries?saved=deleted", request.url), 303);
    }

    if (intent === "update") {
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.redirect(new URL("/admin/enquiries?error=missing", request.url), 303);
      }
      const status = clean(form.get("status"), 30);
      const assignedTo = clean(form.get("assigned_to"), 120);
      const adminNote = clean(form.get("admin_note"), 2000);
      const followUpRaw = clean(form.get("follow_up_at"), 40);
      const followUpAt = followUpRaw ? new Date(followUpRaw) : null;
      const validFollowUp = followUpAt && !Number.isNaN(followUpAt.getTime()) ? followUpAt.toISOString() : null;
      const nextStatus = ALLOWED.has(status) ? status : null;
      if (!nextStatus) {
        return NextResponse.redirect(new URL("/admin/enquiries?error=bad", request.url), 303);
      }
      const lastContacted = nextStatus === "contacted" ? new Date().toISOString() : null;
      await sql`
        update school_enquiries
        set status = ${nextStatus},
            assigned_to = ${assignedTo || null},
            admin_note = ${adminNote || null},
            follow_up_at = ${validFollowUp},
            last_contacted_at = coalesce(${lastContacted}, last_contacted_at),
            updated_at = now()
        where id = ${id}
      `;
      await logAudit(sql, "enquiry.updated", id, { status: nextStatus, assigned: !!assignedTo, followUp: !!validFollowUp });
      return NextResponse.redirect(new URL("/admin/enquiries?saved=updated", request.url), 303);
    }

    // Legacy/simple status change
    const status = clean(form.get("status"), 30);
    if (!ALLOWED.has(status) || !Number.isInteger(id) || id <= 0) {
      return NextResponse.redirect(new URL("/admin/enquiries?error=bad", request.url), 303);
    }
    await sql`
      update school_enquiries
      set status = ${status},
          last_contacted_at = case when ${status} = 'contacted' then now() else last_contacted_at end,
          updated_at = now()
      where id = ${id}
    `;
    await logAudit(sql, "enquiry.status_changed", id, { status });
    return NextResponse.redirect(new URL("/admin/enquiries?saved=status", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin/enquiries?error=save", request.url), 303);
  }
}
