import test from "node:test";
import assert from "node:assert/strict";
import { getAdminAccessState } from "../src/adminAccess.js";

test("la production sans Supabase est fermée par défaut", () => {
  assert.equal(
    getAdminAccessState({ supabaseConfigured: false, isDevelopment: false }),
    "configuration-required",
  );
});

test("le développement local reste accessible sans Supabase", () => {
  assert.equal(
    getAdminAccessState({ supabaseConfigured: false, isDevelopment: true }),
    "development",
  );
});

test("une session non autorisée ne reçoit pas l’accès admin", () => {
  assert.equal(
    getAdminAccessState({
      supabaseConfigured: true,
      isDevelopment: false,
      hasSession: true,
      adminVerified: false,
    }),
    "verification-pending",
  );
});

test("seul un compte authentifié et vérifié reçoit l’accès", () => {
  assert.equal(
    getAdminAccessState({
      supabaseConfigured: true,
      isDevelopment: false,
      hasSession: true,
      adminVerified: true,
    }),
    "granted",
  );
});
