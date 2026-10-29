import test from "node:test";
import assert from "node:assert/strict";

import { SUPPORT_LABS, getSupportLabSummary } from "../src/support.js";

test("getSupportLabSummary donne le bon prochain labo et le bon pourcentage", () => {
  const summary = getSupportLabSummary(
    {
      "support:TCP/IP et sous-réseaux": true,
      "support:DNS, DHCP et VPN": true,
      "support:Diagnostic : ping, tracert, nslookup": false,
      "support:Windows Server et Active Directory": false,
      "support:Droits et permissions": false,
      "support:Linux, Bash et PowerShell": false,
      "support:ITIL : incident, problème, escalade": false,
      "support:Préparation certification": false,
    },
    SUPPORT_LABS,
  );

  assert.equal(summary.total, SUPPORT_LABS.length);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.percent, 25);
  assert.equal(summary.remainingLabs.length, 6);
  assert.equal(summary.nextLab.title, "Diagnostic réseau et résolution");
  assert.equal(summary.nextLab.deliverable, "Un diagnostic réseau complet et documenté.");
});
