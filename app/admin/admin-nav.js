"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview", icon: "▦" },
  { href: "/admin/enquiries", label: "School enquiries", icon: "✉" },
  { href: "/admin/learners", label: "Learners", icon: "◉" },
  { href: "/admin/students", label: "LMS students", icon: "◎" },
  { href: "/admin/lms", label: "LMS courses", icon: "▷" },
  { href: "/admin/news", label: "News", icon: "▤" },
  { href: "/admin/team", label: "Team", icon: "♧" },
  { href: "/admin/apps", label: "PWA apps", icon: "▣" },
  { href: "/admin/ai", label: "AI tools", icon: "✦" },
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
