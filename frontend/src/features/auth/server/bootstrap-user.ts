import "server-only";

import { AppError } from "@/lib/api/error";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type BootstrapPayload = {
  authUserId: string;
  email: string;
  emailVerified: boolean;
};

/**
 * Escapes ILIKE metacharacters so a pattern matches the literal email value
 * case-insensitively without treating `%` or `_` as wildcards.
 */
function escapeIlikeExact(value: string) {
  return value
    .replaceAll("\\", String.raw`\\`)
    .replaceAll("%", String.raw`\%`)
    .replaceAll("_", String.raw`\_`);
}

async function findAppUserIdByAuthUserId(supabase: AdminClient, authUserId: string) {
  const { data, error } = await supabase.from("users").select("id").eq("auth_user_id", authUserId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id as number | undefined;
}

/**
 * Links an existing, not-yet-linked legacy row to the Supabase Auth subject
 * instead of inserting a duplicate, which would violate the users.email
 * uniqueness constraint and mask the real identity conflict. Legacy rows
 * predate the auth bridge, or the backfill migration could not safely link
 * them without proof of a unique email match.
 */
async function linkExistingUserByEmail(supabase: AdminClient, payload: BootstrapPayload) {
  const { authUserId, email, emailVerified } = payload;
  const normalizedEmail = email.toLowerCase();

  const { data: candidates, error: unlinkedUserError } = await supabase
    .from("users")
    .select("id, auth_user_id, email")
    .ilike("email", escapeIlikeExact(email));

  if (unlinkedUserError) {
    throw new Error(unlinkedUserError.message);
  }

  const matches = (candidates ?? []).filter((row) => row.email?.toLowerCase() === normalizedEmail);

  if (matches.length > 1) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const unlinkedUser = matches[0];

  if (!unlinkedUser) {
    return null;
  }

  if (unlinkedUser.auth_user_id && unlinkedUser.auth_user_id !== authUserId) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { error: linkUserError } = await supabase
    .from("users")
    .update({ auth_user_id: authUserId, email_verified: emailVerified })
    .eq("id", unlinkedUser.id);

  if (linkUserError) {
    throw new Error(linkUserError.message);
  }

  return unlinkedUser.id as number;
}

async function insertNewUser(supabase: AdminClient, payload: BootstrapPayload) {
  const { authUserId, email, emailVerified } = payload;
  const fallbackName = email.split("@")[0] || "new-user";

  const { data: insertedUser, error: insertUserError } = await supabase
    .from("users")
    .insert({
      auth_user_id: authUserId,
      email,
      password_hash: null,
      name: fallbackName,
      role: "STUDENT",
      auth_provider: "SUPABASE",
      email_verified: emailVerified,
    })
    .select("id")
    .single();

  if (insertUserError) {
    throw new Error(insertUserError.message);
  }

  return insertedUser.id as number;
}

async function markEmailVerified(supabase: AdminClient, appUserId: number, emailVerified: boolean) {
  const { error } = await supabase.from("users").update({ email_verified: emailVerified }).eq("id", appUserId);

  if (error) {
    throw new Error(error.message);
  }
}

async function resolveAppUserId(supabase: AdminClient, payload: BootstrapPayload) {
  const linkedId = await findAppUserIdByAuthUserId(supabase, payload.authUserId);

  if (linkedId) {
    await markEmailVerified(supabase, linkedId, payload.emailVerified);
    return linkedId;
  }

  const relinkedId = await linkExistingUserByEmail(supabase, payload);

  return relinkedId ?? (await insertNewUser(supabase, payload));
}

async function ensureProfile(supabase: AdminClient, appUserId: number) {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", appUserId)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(existingProfileError.message);
  }

  if (existingProfile) {
    return;
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: appUserId,
    collaboration_status: "OPEN",
  });

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function bootstrapUser(payload: BootstrapPayload) {
  // Bootstrap intentionally uses the service-role client: this runs before
  // the caller necessarily has an app-user row to authorize against, so it
  // cannot depend on RLS. Every write is keyed off `authUserId` (the
  // verified Supabase Auth subject), never a client-supplied user id.
  const supabase = createAdminClient();

  const appUserId = await resolveAppUserId(supabase, payload);

  await ensureProfile(supabase, appUserId);

  return { appUserId };
}
