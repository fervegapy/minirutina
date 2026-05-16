// Allowlist of email addresses that can access /admin.
// Populate via ADMIN_EMAILS env var (comma-separated). The check is done
// server-side after a Supabase auth session is established — magic-link
// sign-in only succeeds for these addresses.
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
