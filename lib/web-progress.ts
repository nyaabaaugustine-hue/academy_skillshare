import { lessons } from "./curriculum";

export type LessonRecord = {
  score: number;
  completedAt: string;
};

export type Progress = Record<string, LessonRecord>;

const keyFor = (email: string) => `sba.web.progress.v1.${email.toLowerCase()}`;

export function loadProgress(email: string): Progress {
  try {
    const raw = localStorage.getItem(keyFor(email));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Progress) : {};
  } catch {
    return {};
  }
}

export function saveLesson(
  email: string,
  slug: string,
  score: number,
): Progress {
  const progress = loadProgress(email);
  progress[slug] = {
    score,
    completedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(progress));
  } catch {
    // A full quota must not break the lesson; progress just is not kept.
  }
  return progress;
}

export function completedCount(progress: Progress) {
  return lessons.filter((lesson) => progress[lesson.slug]).length;
}

export function isUnlocked(progress: Progress, index: number) {
  if (index <= 0) return true;
  return Boolean(progress[lessons[index - 1].slug]);
}
