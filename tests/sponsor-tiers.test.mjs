import assert from "node:assert/strict";
import test from "node:test";

import { compareSponsors, normalizedSponsorTier } from "../src/config/sponsor-tiers.ts";

test("normaliza os três níveis sem atribuir um nível a categorias antigas", () => {
  assert.equal(normalizedSponsorTier(" ouro "), "Ouro");
  assert.equal(normalizedSponsorTier("PRATA"), "Prata");
  assert.equal(normalizedSponsorTier("bronze"), "Bronze");
  assert.equal(normalizedSponsorTier("Patrocinador"), null);
});

test("ordena Ouro, Prata, Bronze e depois os sem nível", () => {
  const sponsors = [
    { tier: "Bronze", display_order: 0, name: "C" },
    { tier: "Patrocinador", display_order: 0, name: "D" },
    { tier: "Ouro", display_order: 2, name: "B" },
    { tier: "Prata", display_order: 0, name: "P" },
    { tier: "Ouro", display_order: 1, name: "A" },
  ];
  assert.deepEqual(sponsors.sort(compareSponsors).map((sponsor) => sponsor.name), ["A", "B", "P", "C", "D"]);
});

