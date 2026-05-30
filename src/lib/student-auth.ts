/**
 * Student session auth (separate from admin session).
 * Stores minimal info: applicationId only.
 * citizenId and dateOfBirth are NOT stored in cookie.
 */
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const STUDENT_COOKIE = "vvk_student_session";
const SESSION_HOURS = 24;

function getSecret() {
  const secret =
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "local-development-jwt-secret-change-before-production");
  if (!secret) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(secret + "_student");
}

export async function createStudentSession(applicationId: string) {
  const token = await new SignJWT({ applicationId, sub: "student" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());

  const store = await cookies();
  store.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * SESSION_HOURS,
  });
}

export async function clearStudentSession() {
  const store = await cookies();
  store.delete(STUDENT_COOKIE);
}

export async function getStudentSession(): Promise<{ applicationId: string } | null> {
  try {
    const store = await cookies();
    const token = store.get(STUDENT_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.applicationId || typeof payload.applicationId !== "string") return null;
    if (payload.sub !== "student") return null;
    return { applicationId: payload.applicationId };
  } catch {
    return null;
  }
}
