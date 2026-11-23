import "./globals.css";
import AiFloatingButton from "./components/AiFloatingButton";
import PushRegistration from "./components/push-registration";
import { cloudflarePublicConfig } from "../lib/cloudflare/public-config";
import { getSiteUrl } from "../lib/site-url";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "SkillBridge | Learn Today. Innovate Tomorrow.",
  description:
    "SkillBridge is a Ghanaian technology education initiative empowering children aged 7–16 through digital literacy, coding, robotics and innovation.",
  openGraph: {
    title: "SkillBridge | Empowering Ghana's Next Generation",
    description: "Digital skills, coding, robotics and innovation for children aged 7–16.",
    type: "website",
    url: "/",
    siteName: "SkillBridge Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillBridge | Empowering Ghana's Next Generation",
    description: "Digital skills, coding, robotics and innovation for children aged 7–16.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Browser extensions (ClickUp and friends) stamp attributes onto <body>
          before React hydrates, which React reports as a mismatch on an
          element this app never gave a className or style to. */}
      <body suppressHydrationWarning>
        <PushRegistration />
        {children}
        <AiFloatingButton />
        {cloudflarePublicConfig().analyticsToken ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cloudflarePublicConfig().analyticsToken })}
          />
        ) : null}
      </body>
    </html>
  );
}
