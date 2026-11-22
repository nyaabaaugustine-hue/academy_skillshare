"use client";

import { authClient } from "@/lib/auth/client";

export type WebAccount = {
  id: string;
  name: string;
  email: string;
};

type PendingGuardianInvite = {
  studentEmail: string;
  studentName: string;
  guardianEmail: string;
};

export type StudentRegistration = {
  guardianEmail: string;
  needsEmailConfirmation: boolean;
};

const PENDING_GUARDIAN_INVITE_KEY = "skillsbridge.pending-guardian-invite";
const normaliseEmail = (value: string) => value.trim().toLowerCase();
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const strongPassword = (value: string) =>
  value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);

function accountFromUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): WebAccount {
  const name = user.name?.trim() || user.email?.split("@")[0] || "Learner";
  return { id: user.id, name, email: user.email ?? "" };
}

function savePendingGuardianInvite(invite: PendingGuardianInvite) {
  try {
    window.localStorage.setItem(
      PENDING_GUARDIAN_INVITE_KEY,
      JSON.stringify(invite),
    );
  } catch {
    throw new Error(
      "Your account was created, but this browser could not save the Parent / Guardian invite. Keep this page open while verifying your email.",
    );
  }
}

function readPendingGuardianInvite(): PendingGuardianInvite | null {
  const value = window.localStorage.getItem(PENDING_GUARDIAN_INVITE_KEY);
  if (!value) return null;

  try {
    const invite = JSON.parse(value) as Partial<PendingGuardianInvite>;
    if (
      typeof invite.studentEmail === "string" &&
      typeof invite.studentName === "string" &&
      typeof invite.guardianEmail === "string"
    ) {
      return {
        studentEmail: invite.studentEmail,
        studentName: invite.studentName,
        guardianEmail: invite.guardianEmail,
      };
    }
  } catch {
    window.localStorage.removeItem(PENDING_GUARDIAN_INVITE_KEY);
    return null;
  }

  window.localStorage.removeItem(PENDING_GUARDIAN_INVITE_KEY);
  return null;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  guardianEmail: string;
}): Promise<StudentRegistration> {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  const guardianEmail = normaliseEmail(input.guardianEmail);
  if (name.length < 2) throw new Error("Enter your name.");
  if (!validEmail(email)) throw new Error("Enter a valid email address.");
  if (!validEmail(guardianEmail)) {
    throw new Error("Enter a valid Parent / Guardian email address.");
  }
  if (email === guardianEmail) {
    throw new Error("Use a different email for the learner and Parent / Guardian.");
  }
  if (!strongPassword(input.password)) {
    throw new Error("Use at least 12 characters with uppercase, lowercase, and a number.");
  }

  const { data, error } = await authClient.signUp.email({
    email,
    password: input.password,
    name,
  });
  if (error) throw new Error(error.message);
  if (!data?.user) throw new Error("We could not create your account.");

  savePendingGuardianInvite({
    studentEmail: email,
    studentName: name,
    guardianEmail,
  });

  return {
    guardianEmail,
    needsEmailConfirmation: !data.user.emailVerified,
  };
}

export async function verifyEmailAddress(
  emailInput: string,
  otpInput: string,
): Promise<WebAccount> {
  const email = normaliseEmail(emailInput);
  const otp = otpInput.trim();
  if (!validEmail(email)) throw new Error("Enter a valid email address.");
  if (!/^\d{6}$/.test(otp)) throw new Error("Enter the 6-digit email code.");

  const { data, error } = await authClient.emailOtp.verifyEmail({ email, otp });
  if (error) throw new Error(error.message);

  const user = data?.user;
  if (!user) {
    throw new Error("Your email was verified, but sign-in did not complete. Log in to continue.");
  }
  return accountFromUser(user);
}

export async function registerGuardianAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const name = input.name.trim();
  const email = normaliseEmail(input.email);
  if (name.length < 2) throw new Error("Enter your name.");
  if (!validEmail(email)) throw new Error("Enter a valid email address.");
  if (!strongPassword(input.password)) {
    throw new Error("Use at least 12 characters with uppercase, lowercase, and a number.");
  }

  const { data, error } = await authClient.signUp.email({
    email,
    password: input.password,
    name,
  });
  if (error) throw new Error(error.message);
  if (!data?.user) throw new Error("We could not create your account.");
}

export async function resendEmailVerification(emailInput: string): Promise<void> {
  const email = normaliseEmail(emailInput);
  if (!validEmail(email)) throw new Error("Enter a valid email address.");

  const { error } = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "email-verification",
  });
  if (error) throw new Error(error.message);
}

export async function loginAccount(
  emailInput: string,
  password: string,
): Promise<WebAccount> {
  const email = normaliseEmail(emailInput);
  if (!validEmail(email)) throw new Error("Enter a valid email address.");

  const { data, error } = await authClient.signIn.email({ email, password });
  if (error) throw new Error(error.message);
  if (!data?.user) throw new Error("Sign-in did not complete. Please try again.");
  return accountFromUser(data.user);
}

export async function sendPendingGuardianInvite(): Promise<string | null> {
  const pendingInvite = readPendingGuardianInvite();
  if (!pendingInvite) return null;

  const user = await currentAccount();
  if (!user || normaliseEmail(user.email) !== pendingInvite.studentEmail) {
    return null;
  }

  const suffix = user.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const slug = `family-${suffix || "student"}`;
  const { data: organizations, error: listError } =
    await authClient.organization.list();
  if (listError) throw new Error(listError.message);

  let organization = organizations?.find((item) => item.slug === slug);
  if (!organization) {
    const { data, error } = await authClient.organization.create({
      name: `${pendingInvite.studentName}'s Family`,
      slug,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Could not create the family group.");
    organization = data;
  }

  const { error: inviteError } = await authClient.organization.inviteMember({
    email: pendingInvite.guardianEmail,
    role: "member",
    organizationId: organization.id,
    resend: true,
  });
  if (inviteError) throw new Error(inviteError.message);

  window.localStorage.removeItem(PENDING_GUARDIAN_INVITE_KEY);
  return pendingInvite.guardianEmail;
}

export async function acceptGuardianInvite(invitationId: string): Promise<void> {
  const { error } = await authClient.organization.acceptInvitation({
    invitationId,
  });
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(emailInput: string): Promise<void> {
  const email = normaliseEmail(emailInput);
  if (!validEmail(email)) throw new Error("Enter a valid email address.");

  const origin = window.location.origin;
  const redirectCandidates = [
    `${origin}/reset-password`,
    "/reset-password",
  ];

  let lastError: { message?: string } | null = null;
  for (const redirectTo of redirectCandidates) {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo });
    if (!error) return;
    lastError = error;
    const msg = String(error.message || "").toLowerCase();
    if (!msg.includes("redirect")) break;
  }

  const message = String(lastError?.message || "Could not send reset email. Please try again.");
  if (message.toLowerCase().includes("redirect")) {
    throw new Error(
      "Password reset link could not be created for this site URL. Please contact support@skillbridgeacademy.tech and ask admin to allow this domain in Neon Auth redirect URLs.",
    );
  }
  throw new Error(message);
}

export async function setNewPassword(password: string): Promise<void> {
  if (!strongPassword(password)) {
    throw new Error("Use at least 12 characters with uppercase, lowercase, and a number.");
  }
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) throw new Error("This reset link is invalid or has expired.");

  const { error } = await authClient.resetPassword({
    newPassword: password,
    token,
  });
  if (error) throw new Error(error.message);
}

export async function currentAccount(): Promise<WebAccount | null> {
  const response = await fetch("/api/account", { cache: "no-store" });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Could not check your account. Please try again.");
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Could not check your account. Please try again.";
    throw new Error(message);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("user" in payload)
  ) {
    throw new Error("The account response was invalid. Please try again.");
  }
  const user = payload.user;
  if (user === null) return null;
  if (
    typeof user !== "object" ||
    user === null ||
    !("id" in user) ||
    typeof user.id !== "string" ||
    !("name" in user) ||
    (typeof user.name !== "string" && user.name !== null) ||
    !("email" in user) ||
    typeof user.email !== "string"
  ) {
    throw new Error("The account response was invalid. Please try again.");
  }
  return accountFromUser({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}

export async function signOutAccount(): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message);
}
