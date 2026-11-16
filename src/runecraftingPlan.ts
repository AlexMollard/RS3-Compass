// Pure Runecrafting rules over the Wiki facts in runecraftingGuide.ts. No UI, no storage.
import type { AccountKind, Profile } from "./data.ts";
import { IMPORTED_QUESTS } from "./questsImported.ts";
import {
  ALTARS,
  BACKPACK_SLOTS,
  ESSENCE_SOURCES,
  FAMILIARS,
  INFINITY_OUTFIT_CAPACITY,
  POUCHES,
  SAVVY,
  SAVVY_SOURCE,
  XP_METHODS,
  type Altar,
  type EssenceKind,
  type EssenceSource,
  type FamiliarId,
  type Pouch,
  type PouchId,
  type XpMethod,
} from "./runecraftingGuide.ts";

export type XpRule = "save-essence" | "fastest";
export type StockTarget = { rune: string; have: number; want: number };
export type RunecraftingKit = {
  xpRule?: XpRule;
  pouches?: PouchId[];
  familiar?: FamiliarId;
  infinityOutfit?: boolean;
  attuner?: boolean;
  stock?: StockTarget[];
};
// Compile-time check: the structural kit saved on Profile stays assignable to RunecraftingKit.
export const savedKitFits = (kit: NonNullable<Profile["runecrafting"]>): RunecraftingKit => kit;
export type ReqState ="met" | "unmet" | "unknown" | "check";
export type Req = { text: string; state: ReqState };

export const isIronman = (kind: AccountKind): boolean => kind !== "Regular account";
export const defaultXpRule = (kind: AccountKind): XpRule => (isIronman(kind) ? "save-essence" : "fastest");

export function questState(profile: Profile, questId: string): ReqState {
  if (profile.completedQuests.includes(questId)) return "met";
  const status = profile.questImportStatus;
  return status !== undefined && status !== "available" ? "unknown" : "unmet";
}

let questNames: Map<string, string> | undefined;
const questName = (id: string): string => {
  questNames ??= new Map(IMPORTED_QUESTS.map((q) => [q.id, q.name]));
  return questNames.get(id) ?? id;
};
const questReq = (profile: Profile, id: string): Req => ({ text: questName(id), state: questState(profile, id) });
const levelReq = (skill: string, need: number, have: number | undefined): Req => ({
  text: `${skill} ${need}`,
  state: have === undefined ? "unknown" : have >= need ? "met" : "unmet",
});
const runecraftingLevel = (profile: Profile): number | undefined => profile.levels.Runecrafting;

function accessAt(profile: Profile, altar: Altar, level: number | undefined): Req[] {
  const reqs = [levelReq("Runecrafting", altar.level, level), ...altar.quests.map((id) => questReq(profile, id))];
  if (altar.checkInGame) reqs.push({ text: altar.accessNote ?? "Check the access requirement in game", state: "check" });
  return reqs;
}
export const altarAccess = (profile: Profile, altar: Altar): Req[] => accessAt(profile, altar, runecraftingLevel(profile));

export const runesPerEssence = (altar: Altar, level: number): number =>
  1 + altar.multipliers.filter((m) => m <= level).length;

export function essencePerTrip(kit: RunecraftingKit): number {
  const carried = POUCHES.filter((p) => kit.pouches?.includes(p.id));
  const option = (list: Pouch[]) => BACKPACK_SLOTS - list.length + list.reduce((sum, p) => sum + p.capacity, 0);
  const expansive = carried.filter((p) => p.id === "expansive");
  const others = carried.filter((p) => p.id !== "expansive");
  // Expansive replaces the other pouches, so the two options are compared, never added.
  const base = Math.max(option(expansive), option(others));
  const familiar = FAMILIARS.find((f) => f.id === kit.familiar)?.capacity ?? 0;
  return base + familiar + (kit.infinityOutfit ? INFINITY_OUTFIT_CAPACITY : 0);
}

export type EssenceSourceView = { source: EssenceSource; reqs: Req[]; met: boolean };
export function essenceSources(profile: Profile, kind: EssenceKind): EssenceSourceView[] {
  return ESSENCE_SOURCES.filter((s) => s.kind === kind)
    .map((source) => {
      const reqs = [
        ...source.quests.map((id) => questReq(profile, id)),
        ...source.levels.map((l) => levelReq(l.skill, l.level, profile.levels[l.skill])),
      ];
      return { source, reqs, met: reqs.every((r) => r.state === "met") };
    })
    .sort((a, b) => Number(b.met) - Number(a.met) || a.source.rank - b.source.rank);
}

export type StockPlan = {
  target: StockTarget;
  altar: Altar;
  remaining: number;
  perEssence: number;
  essence: number;
  trips: number;
  locked: Req[];
  sources: EssenceSourceView[];
};

const altarFor = (rune: string): Altar | undefined => ALTARS.find((a) => a.rune.toLowerCase() === rune.toLowerCase());

/** Throws for a rune with no altar; `craftNow` skips such stale targets. */
export function planStock(profile: Profile, kit: RunecraftingKit, level: number, target: StockTarget): StockPlan {
  const altar = altarFor(target.rune);
  if (!altar) throw new Error(`No altar for rune "${target.rune}"`);
  const locked = accessAt(profile, altar, level).filter((r) => r.state === "unmet");
  const remaining = Math.max(0, target.want - target.have);
  const perEssence = runesPerEssence(altar, level);
  const essence = locked.length ? 0 : Math.ceil(remaining / perEssence);
  const trips = essence ? Math.ceil(essence / essencePerTrip(kit)) : 0;
  return { target, altar, remaining, perEssence, essence, trips, locked, sources: essenceSources(profile, altar.essence) };
}

export type CraftNow = {
  xp?: { method: XpMethod; reqs: Req[]; sources: EssenceSourceView[] };
  stock?: StockPlan;
  skippedLocked: StockPlan[];
};

function bestMethod(profile: Profile, kit: RunecraftingKit, level: number): XpMethod | undefined {
  const rule = kit.xpRule ?? defaultXpRule(profile.kind);
  const candidates = XP_METHODS.filter((m) => {
    if (level < m.from || level >= m.to) return false;
    if (m.quests.some((id) => questState(profile, id) === "unmet")) return false;
    if (m.requiresAttuner && kit.attuner !== true) return false;
    const altar = m.altar ? altarFor(m.altar) : undefined;
    return !altar || accessAt(profile, altar, level).every((r) => r.state !== "unmet");
  });
  const saves = (m: XpMethod) => (rule === "save-essence" && !m.needsEssence ? 1 : 0);
  return candidates.sort((a, b) => saves(b) - saves(a) || b.rate[0] - a.rate[0])[0];
}

export function craftNow(profile: Profile, kit: RunecraftingKit, level: number | undefined): CraftNow | { needsLevel: true } {
  if (level === undefined) return { needsLevel: true };
  const method = bestMethod(profile, kit, level);
  // shortcut: essence kind is inferred (altar, else Rune Mythos means impure); add a field on XpMethod if more kinds appear.
  const kind: EssenceKind = (method?.altar && altarFor(method.altar)?.essence) || (method?.quests.includes("rune-mythos") ? "impure" : "pure");
  const plans = (kit.stock ?? []).filter((t) => altarFor(t.rune)).map((t) => planStock(profile, kit, level, t));
  const best = plans.filter((p) => p.locked.length === 0 && p.essence > 0).sort((a, b) => b.essence - a.essence)[0];
  return {
    xp: method && {
      method,
      reqs: method.quests.map((id) => questReq(profile, id)),
      sources: method.needsEssence ? essenceSources(profile, kind) : [],
    },
    stock: best,
    skippedLocked: plans.filter((p) => p.locked.length > 0 && p.remaining > 0),
  };
}

export type UnlockStep = {
  track: "savvy" | "pouch" | "altar" | "multiplier" | "familiar" | "milestone";
  name: string;
  wiki: string;
  image: string;
  how: string;
  reqs: Req[];
};

const RC_ICON = "Runecrafting.png";
const MILESTONES: { kind: "altar" | "pouch"; name: string; level: number }[] = [
  { kind: "altar", name: "Soul altar", level: 90 },
  { kind: "pouch", name: "Massive pouch", level: 90 },
  { kind: "altar", name: "Time altar", level: 100 },
  { kind: "pouch", name: "Expansive pouch", level: 105 },
];

export function unlockNext(profile: Profile, kit: RunecraftingKit, level: number): UnlockStep[] {
  const steps: UnlockStep[] = [];
  const altarStep = (altar: Altar, track: UnlockStep["track"]): UnlockStep => ({
    track,
    name: `${altar.rune} altar`,
    wiki: altar.wiki,
    image: altar.image,
    how: altar.accessNote ?? `Unlock the ${altar.rune} altar.`,
    reqs: accessAt(profile, altar, level),
  });
  const pouchStep = (p: Pouch, track: UnlockStep["track"]): UnlockStep => ({
    track,
    name: p.name,
    wiki: p.sources[0],
    image: p.image,
    how: p.how,
    reqs: [levelReq("Runecrafting", p.level, level), ...p.otherRequirements.map((text) => ({ text, state: "check" as const }))],
  });

  const savvy = SAVVY.find((s) => s.level > level);
  if (savvy) {
    steps.push({
      track: "savvy",
      name: `Savvy Runecrafting +${savvy.bonus}%`,
      wiki: SAVVY_SOURCE.sources[0],
      image: RC_ICON,
      how: `+${savvy.bonus}% XP at every altar from Runecrafting ${savvy.level}.`,
      reqs: [levelReq("Runecrafting", savvy.level, level)],
    });
  }

  const pouch = POUCHES.find((p) => !kit.pouches?.includes(p.id));
  if (pouch) steps.push(pouchStep(pouch, "pouch"));

  const altar = [...ALTARS].sort((a, b) => a.level - b.level).find((a) => accessAt(profile, a, level).some((r) => r.state === "unmet"));
  if (altar) steps.push(altarStep(altar, "altar"));

  for (const target of kit.stock ?? []) {
    const stockAltar = altarFor(target.rune);
    const next = stockAltar?.multipliers.find((m) => m > level);
    if (stockAltar && next !== undefined) {
      steps.push({
        track: "multiplier",
        name: `${stockAltar.rune} runes: ${runesPerEssence(stockAltar, next)} per essence`,
        wiki: stockAltar.wiki,
        image: stockAltar.image,
        how: `One more ${stockAltar.rune} rune per essence from Runecrafting ${next}.`,
        reqs: [levelReq("Runecrafting", next, level)],
      });
    }
  }

  const carried = FAMILIARS.find((f) => f.id === kit.familiar)?.capacity ?? 0;
  const familiar = FAMILIARS.find((f) => f.capacity > carried);
  if (familiar) {
    steps.push({
      track: "familiar",
      name: familiar.name,
      wiki: familiar.sources[0],
      image: familiar.image,
      how: familiar.how,
      reqs: [levelReq("Summoning", familiar.summoning, profile.levels.Summoning)],
    });
  }

  for (const m of MILESTONES) {
    if (level >= m.level || steps.some((s) => s.name === m.name)) continue;
    if (m.kind === "altar") {
      const a = ALTARS.find((x) => `${x.rune} altar` === m.name);
      if (a) steps.push(altarStep(a, "milestone"));
    } else {
      const p = POUCHES.find((x) => x.name === m.name);
      if (p && !kit.pouches?.includes(p.id)) steps.push(pouchStep(p, "milestone"));
    }
  }
  return steps;
}
