import { ImageResponse } from "next/og";
import { getAwardByToken } from "../../../lib/awards";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { token } = await params;
  const award = await getAwardByToken(token);
  const name = award?.public_share ? (award.learner_alias || award.learner_name || "SkillBridge Learner") : "SkillBridge Certificate";
  const title = award?.public_share ? (award.award_title || "Certificate of Achievement") : "Learning recognized";
  const detail = award?.public_share ? (award.award_detail || "Celebrating real learning progress at SkillBridge Academy.") : "Visit SkillBridge Academy to see learner achievements.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "linear-gradient(135deg, #071f49 0%, #0b4aa8 55%, #18b27a 140%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>SkillBridge Academy</div>
          <div style={{ fontSize: 20, opacity: 0.9 }}>Learn Today. Innovate Tomorrow.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 24, color: "#b9f3d8", textTransform: "uppercase", letterSpacing: 2 }}>Certificate of Achievement</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#e6f0ff" }}>{title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.35, maxWidth: 980, color: "#dbeafe" }}>{detail}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, opacity: 0.9 }}>
          <span>skillbridgeacademy.tech</span>
          <span>{award?.public_share ? new Date(award.issued_at).toLocaleDateString() : ""}</span>
        </div>
      </div>
    ),
    size
  );
}
