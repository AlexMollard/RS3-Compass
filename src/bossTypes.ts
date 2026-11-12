export type BossTier = "Free" | "Low" | "Mid" | "High";

export type BossRequirement =
  | { kind: "quest"; quest: string }
  | { kind: "skill"; skill: string; level: number }
  | { kind: "text"; text: string };

export interface BossDrop {
  item: string;
  quantity: string;
  rarity: string;
  note?: string;
}

export interface BossRecord {
  /** Slug of the name, e.g. "giant-mole". */
  id: string;
  name: string;
  /** Wiki page title with underscores. */
  wiki: string;
  image?: string;
  level: number;
  tier: BossTier;
  team: string;
  members: boolean;
  lifepoints?: number;
  weakness?: string;
  requirements: BossRequirement[];
  /** Drops by table version (for example Normal, Normal F2P, Hard Mode). */
  drops: Record<string, BossDrop[]>;
  /** Collection log items. */
  uniques: string[];
  achievements: string[];
  strategyPage?: string;
  releaseDate?: string;
}
