export function getAdminAccessState({
  supabaseConfigured,
  isDevelopment,
  hasSession,
  adminVerified,
}) {
  if (!supabaseConfigured) {
    return isDevelopment ? "development" : "configuration-required";
  }
  if (!hasSession) return "login-required";
  if (!adminVerified) return "verification-pending";
  return "granted";
}
