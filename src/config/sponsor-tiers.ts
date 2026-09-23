export const sponsorTiers = ["Ouro", "Prata", "Bronze"] as const;

export type SponsorTier = (typeof sponsorTiers)[number];

export function normalizedSponsorTier(value: string | null): SponsorTier | null {
  const normalized = value?.trim().toLocaleLowerCase("pt-BR");
  return sponsorTiers.find((tier) => tier.toLocaleLowerCase("pt-BR") === normalized) ?? null;
}

export function compareSponsors(
  a: { tier: string | null; display_order: number; name: string },
  b: { tier: string | null; display_order: number; name: string },
) {
  const rank = (tier: string | null) => {
    const value = normalizedSponsorTier(tier);
    return value ? sponsorTiers.indexOf(value) : sponsorTiers.length;
  };

  return rank(a.tier) - rank(b.tier)
    || a.display_order - b.display_order
    || a.name.localeCompare(b.name, "pt-BR");
}

