import "server-only";

import { auth } from "@/lib/auth/server";

/** Neon Auth user id, derived server-side. Never accept it from a request. */
export async function signedInUserId(): Promise<string | null> {
  const { data, error } = await auth.getSession();
  if (error) throw error;
  const id = data?.user?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
