import teamFallback from "../components/team-data";
import { upcomingTrainings as upcomingTrainingsFallback } from "./upcoming-trainings";
import { tryDb } from "./db";

/**
 * The homepage news block, used until an admin publishes a story.
 */
export const newsFallback = {
  title: "Every young person deserves the chance to create with technology.",
  excerpt:
    "Follow our programmes, community activities and the ideas young people are bringing to life.",
  image:
    "https://res.cloudinary.com/dx1nrew3h/image/upload/v1794785382/child-surfing-internet-tablet-computer_342744-389_e16uvq.avif",
};

const COURSE_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const splitList = (value) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const safeHref = (value) => {
  const link = String(value ?? "").trim();
  if (link === "") return "";
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:" ? link : "";
  } catch {
    return "";
  }
};

const safeImage = (value, fallback) => {
  const image = safeHref(value);
  return image === "" ? fallback : image;
};

const courseDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * The spotlight shown when the database has no featured course yet. It is the
 * same shape as a database row, so the homepage can render either one.
 */
export const featuredCourseFallback = {
  id: null,
  title: "Python for Beginners",
  level: "Ages 12–18 · Beginner",
  summary:
    "Start from zero and finish with a working project. In twelve weekly sessions, learners write their first real programs, build a small app, and learn the problem-solving habits that carry into every other subject.",
  topics: ["Python basics", "Loops and decisions", "Project work"],
  duration: "12 weeks",
  startDate: "2027-01-16",
  startDateLabel: COURSE_DATE.format(new Date("2027-01-16T00:00:00Z")),
  format: "Weekly · online + in person",
  outcomes: [
    "Write and run your own Python programs",
    "Use variables, loops and decisions",
    "Build a project step by step",
    "Share your work with a supportive group",
  ],
  image: "/images/python-beginners.jpg",
  ctaLabel: "Register on the LMS",
  link: "",
  featured: true,
};

function normaliseCourse(row) {
  const start = courseDate(row.start_date);
  const outcomes = splitList(row.outcomes);
  const topics = splitList(row.topics);

  return {
    id: row.id,
    title: row.title || featuredCourseFallback.title,
    level: row.level || "",
    summary: row.summary || featuredCourseFallback.summary,
    topics,
    duration: row.duration || "",
    startDate: start ? start.toISOString().slice(0, 10) : null,
    startDateLabel: start ? COURSE_DATE.format(start) : "Date to be announced",
    format: row.format || "",
    outcomes: outcomes.length > 0 ? outcomes : featuredCourseFallback.outcomes,
    image: safeImage(row.image, featuredCourseFallback.image),
    ctaLabel: row.cta_label || featuredCourseFallback.ctaLabel,
    link: safeHref(row.link),
    featured: true,
  };
}

/** Published team members, newest configuration first, else the repo content. */
export async function getTeamMembers() {
  const sql = tryDb();
  if (!sql) return teamFallback;
  try {
    const rows = await sql`
      select id, name, role, focus, image, bio
      from team_members
      where published = true
      order by position asc, id asc
    `;
    return rows.length > 0 ? rows : teamFallback;
  } catch {
    return teamFallback;
  }
}

/** Newest published news story, or the placeholder block. */
export async function getFeaturedNews() {
  const sql = tryDb();
  if (!sql) return newsFallback;
  try {
    const rows = await sql`
      select id, title, excerpt, image
      from news_posts
      where published = true order by created_at desc limit 1
    `;
    const post = rows[0];
    if (!post) return newsFallback;
    return {
      title: post.title,
      excerpt: post.excerpt ?? newsFallback.excerpt,
      image: post.image ?? newsFallback.image,
    };
  } catch {
    return newsFallback;
  }
}

/**
 * The course promoted on the homepage.
 *
 * Priority: the admin's featured published course, then the next published
 * course with a start date, then the curated fallback above. Each database
 * query is guarded so a site without the newest columns still renders.
 */
export async function getFeaturedCourse() {
  const sql = tryDb();
  if (!sql) return featuredCourseFallback;

  try {
    const rows = await sql`
      select id, title, level, summary, topics, duration, start_date, image,
             outcomes, format, cta_label, link
      from lms_courses
      where published = true and featured = true
      order by start_date asc nulls last, position asc, id asc
      limit 1
    `;
    if (rows[0]) return normaliseCourse(rows[0]);
  } catch {
    // The spotlight columns are not installed yet; try the basic catalogue.
  }

  try {
    const rows = await sql`
      select id, title, level, summary, topics, duration, link
      from lms_courses
      where published = true
      order by position asc, id asc
      limit 1
    `;
    if (rows[0]) return normaliseCourse(rows[0]);
  } catch {
    // The table is missing or unreachable; use the curated fallback.
  }

  return featuredCourseFallback;
}

const normaliseTraining = (row) => ({
  id: row.id,
  type: row.type || "TRAINING",
  title: row.title || "",
  date: row.date_label || "",
  duration: row.duration || "",
  format: row.format || "",
  image: safeImage(row.image, upcomingTrainingsFallback[0]?.image || ""),
  description: row.description || "",
  position: row.position ?? 0,
  published: row.published ?? true,
});

/** Published upcoming trainings/bootcamps, ordered for homepage, else repo fallback. */
export async function getUpcomingTrainings() {
  const sql = tryDb();
  if (!sql) return upcomingTrainingsFallback;
  try {
    const rows = await sql`
      select id, type, title, date_label, duration, format, image, description, position, published
      from upcoming_trainings
      where published = true
      order by position asc, id asc
    `;
    return rows.length > 0 ? rows.map(normaliseTraining) : upcomingTrainingsFallback;
  } catch {
    return upcomingTrainingsFallback;
  }
}

const showcaseFallback = [];

const normaliseProject = (row) => ({
  id: row.id,
  title: row.title || "Learner Project",
  description: row.description || "",
  learner_name: row.learner_name || "SkillBridge Learner",
  skill: row.skill || "",
  image: safeImage(row.image, ""),
  project_url: safeHref(row.project_url),
});

/** Published learner project showcase items. */
export async function getProjectShowcase() {
  const sql = tryDb();
  if (!sql) return showcaseFallback;
  try {
    const rows = await sql`
      select id, title, description, learner_name, skill, image, project_url
      from project_showcase
      where published = true
      order by position asc, id desc
      limit 12
    `;
    return rows.length > 0 ? rows.map(normaliseProject) : showcaseFallback;
  } catch {
    return showcaseFallback;
  }
}
