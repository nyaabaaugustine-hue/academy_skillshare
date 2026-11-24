"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview", icon: "▦" },
  { href: "/admin/search", label: "Search", icon: "⌕" },
  { href: "/admin/enquiries", label: "School enquiries", icon: "✉" },
  { href: "/admin/learners", label: "Learners", icon: "◉" },
  { href: "/admin/students", label: "LMS students", icon: "◎" },
  { href: "/admin/lms", label: "LMS courses", icon: "▷" },
  { href: "/admin/trainings", label: "Trainings", icon: "◷" },
  { href: "/admin/showcase", label: "Showcase", icon: "★" },
  { href: "/admin/awards", label: "Awards", icon: "◆" },
  { href: "/admin/news", label: "News", icon: "▤" },
  { href: "/admin/announcements", label: "Announcements", icon: "📢" },
  { href: "/admin/team", label: "Team", icon: "♣" },
  { href: "/admin/apps", label: "PWA apps", icon: "▣" },
  { href: "/admin/cloudflare", label: "Cloudflare", icon: "☁" },
  { href: "/admin/health", label: "Health", icon: "♥" },
  { href: "/admin/ai", label: "AI tools", icon: "✦" },
  { href: "/admin/ai-audit", label: "AI audit", icon: "⎘" },
  { href: "/admin/at-risk", label: "At-risk learners", icon: "⚠" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { href: "/admin/notifications/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/admin/notifications/compose", label: "Compose", icon: "✏️" },
];

export default function AdminNav() {
  const pathname = usePathname() ?? "/admin";

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      <span className="admin-nav-label">Workspace</span>
      {links.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <a
            key={link.href}
            href={link.href}
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              {link.icon}
            </span>
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
