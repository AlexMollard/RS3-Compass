// Hand-written Runecrafting facts for members and Ironmen (spec: docs/superpowers/specs/2026-11-17-runecrafting-guide-design.md).
// Every value comes from the RuneScape Wiki pages cited on each entry, fetched 2026-11-17. Rates are base XP/hr from
// https://runescape.wiki/w/Pay-to-play_Runecrafting_training (Abyss, Soul altar, attuner, necrotic) and the Ironman
// strategy page (Runespan). The Wiki marks that page as needing new rates for Savvy Runecrafting, and its 95+ Abyss,
// attuner and necrotic rows are flagged `provisional` here. `quests` hold ids from src/questsImported.ts.

export type Dated = { checked: string; sources: string[] };
export type EssenceKind = "pure" | "impure";
export type Altar = Dated & {
  /** Short rune name, e.g. "Blood". */
  rune: string;
  wiki: string;
  image: string;
  level: number;
  members: boolean;
  essence: EssenceKind;
  quests: string[];
  accessNote?: string;
  checkInGame?: boolean;
  /** Levels (above `level`) at which one more rune is made per essence, from the Wiki's multiple-runes table. */
  multipliers: number[];
};
export type PouchId = "small" | "medium" | "large" | "giant" | "massive" | "expansive";
export type Pouch = Dated & {
  id: PouchId;
  name: string;
  image: string;
  level: number;
  capacity: number;
  how: string;
  otherRequirements: string[];
};
export type FamiliarId = "parasite" | "lurker" | "titan";
export type Familiar = Dated & {
  id: FamiliarId;
  name: string;
  image: string;
  summoning: number;
  capacity: number;
  how: string;
};
export type SavvyStep = { level: number; bonus: number };
export type XpMethod = Dated & {
  id: string;
  label: string;
  wiki: string;
  image: string;
  /** Runecrafting level range the method covers: from <= level < to (the last range ends at 111). */
  from: number;
  to: number;
  needsEssence: boolean;
  /** The `rune` of an ALTARS entry. */
  altar?: string;
  quests: string[];
  requiresAttuner?: boolean;
  /** Base XP per hour, low to high. */
  rate: [number, number];
  provisional: boolean;
  where: string;
};
export type EssenceSource = Dated & {
  id: string;
  label: string;
  wiki: string;
  kind: EssenceKind;
  /** 1 is best for an Ironman. The Wiki's Ironman page does not rank sources: the order is its list order. */
  rank: number;
  quests: string[];
  levels: { skill: string; level: number }[];
  note: string;
};

export const RC_CHECKED = "2026-11-17";
export const INFINITY_OUTFIT_CAPACITY = 12;
export const BACKPACK_SLOTS = 28;

const W = "https://runescape.wiki/w/";
const page = (title: string) => W + title.replaceAll(" ", "_");
const RUNECRAFTING = page("Runecrafting");
const TRAINING = page("Pay-to-play Runecrafting training");
const IRONMAN = page("Ironman Mode/Strategies/Runecrafting");
const NECROTIC = page("Necrotic rune");
const POUCH_PAGE = page("Essence pouch");
const dated = { checked: RC_CHECKED };

const altar = (
  rune: string,
  level: number,
  quests: string[],
  multipliers: number[],
  extra: Partial<Pick<Altar, "accessNote" | "checkInGame" | "essence" | "members">> = {},
): Altar => ({
  rune,
  wiki: page(`${rune} altar`),
  image: `${rune}_rune.png`,
  level,
  members: true,
  essence: "pure",
  quests,
  multipliers,
  ...dated,
  sources: [page(`${rune} altar`), RUNECRAFTING],
  ...extra,
});
// Air and Spirit share one ladder, as do Body and Bone, and Astral and Flesh.
const AIR = [11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121, 132, 143];
const BODY = [46, 92, 138];
const ASTRAL = [82, 164];
const necrotic = (rune: string, level: number, multipliers: number[]): Altar =>
  ({ ...altar(rune, level, ["rune-mythos"], multipliers, { essence: "impure" }), sources: [NECROTIC, RUNECRAFTING] });

export const ALTARS: Altar[] = [
  altar("Air", 1, [], AIR, { members: false }),
  altar("Mind", 1, [], [14, 28, 42, 56, 70, 84, 98, 112, 126, 140], { members: false }),
  altar("Water", 5, [], [19, 38, 57, 76, 95, 114, 133], { members: false }),
  altar("Earth", 9, [], [26, 52, 78, 104, 130, 156], { members: false }),
  altar("Fire", 14, [], [35, 70, 105, 140], { members: false }),
  altar("Body", 20, [], BODY, { members: false }),
  altar("Cosmic", 27, ["lost-city"], [59, 118, 177]),
  altar("Chaos", 35, ["what-lies-below"], [74, 148]),
  altar("Astral", 40, ["lunar-diplomacy"], ASTRAL),
  altar("Nature", 44, [], [91, 182]),
  altar("Law", 54, [], [110, 220]),
  altar("Death", 65, ["mournings-end-part-ii"], [131, 262]),
  altar("Blood", 77, ["legacy-of-seergaze"], [154]),
  altar("Soul", 90, ["phite-club"], [179], { accessNote: "Reached by fairy ring; the Soul altar is the AFK route from 90." }),
  altar("Time", 100, [], [198], {
    accessNote: "Needs an enchanted key for first access, then the Anachronia altar. Confirm the exact requirement in game.",
    checkInGame: true,
  }),
  necrotic("Spirit", 1, AIR),
  necrotic("Bone", 20, BODY),
  necrotic("Flesh", 40, ASTRAL),
  necrotic("Miasma", 60, [120, 180]),
];

const pouch = (
  id: PouchId,
  name: string,
  level: number,
  capacity: number,
  how: string,
  otherRequirements: string[] = [],
): Pouch => ({ id, name, image: `${name.replace(" ", "_")}.png`, level, capacity, how, otherRequirements, ...dated, sources: [POUCH_PAGE] });

export const POUCHES: Pouch[] = [
  pouch("small", "Small pouch", 1, 3, "Free from the dark mage."),
  pouch("medium", "Medium pouch", 25, 6, "Dropped by abyssal leeches, guardians and walkers; Wizard Korvak replaces lost ones free."),
  pouch("large", "Large pouch", 50, 9, "Dropped by abyssal creatures; Wizard Korvak sells it for 25,000 coins.", [
    "50 Runecrafting to enter the Runecrafting Guild",
  ]),
  pouch("giant", "Giant pouch", 75, 12, "Dropped by abyssal creatures; Wizard Korvak sells it for 50,000 coins.", [
    "50 Runecrafting to enter the Runecrafting Guild",
  ]),
  pouch("massive", "Massive pouch", 90, 18, "Bought from Wizard Finix for 1,000 Runespan points.", ["1,000 Runespan points"]),
  pouch("expansive", "Expansive pouch", 105, 70, "Crafted by the player; it replaces all other pouches, so it cannot be used with them.", [
    "95 Divination (boostable)",
    "A 9x9 Runedoku puzzle, Runespan and runecrafting tasks, and feeding in the five other pouches",
  ]),
];

const familiar = (id: FamiliarId, name: string, summoning: number, capacity: number): Familiar => ({
  id,
  name,
  image: `${name.replace(" ", "_")}_pouch.png`,
  summoning,
  capacity,
  how: "Summon it with its Summoning pouch; it carries essence and the capacity adds to your pouches.",
  ...dated,
  sources: [POUCH_PAGE],
});

export const FAMILIARS: Familiar[] = [
  familiar("parasite", "Abyssal parasite", 54, 7),
  familiar("lurker", "Abyssal lurker", 62, 12),
  familiar("titan", "Abyssal titan", 93, 20),
];

export const SAVVY: SavvyStep[] = [
  { level: 25, bonus: 75 },
  { level: 35, bonus: 150 },
  { level: 60, bonus: 200 },
  { level: 70, bonus: 250 },
  { level: 95, bonus: 275 },
  { level: 105, bonus: 300 },
];
export const SAVVY_SOURCE: Dated = { ...dated, sources: [page("Savvy runecrafting")] };

const ABYSS_QUEST = "enter-the-abyss-miniquest";
const abyss = (
  from: number,
  to: number,
  altarRune: string,
  rate: [number, number],
  quests: string[] = [],
  provisional = false,
): XpMethod => ({
  id: `abyss-${from}-${to}`,
  label: `Abyss runecrafting, ${altarRune} runes`,
  wiki: page("Runecrafting through the Abyss"),
  image: `${altarRune}_rune.png`,
  from,
  to,
  needsEssence: true,
  altar: altarRune,
  quests: [ABYSS_QUEST, ...quests],
  rate,
  provisional,
  where: `The Abyss, then the ${altarRune} altar rift.`,
  ...dated,
  sources: [TRAINING, page("Runecrafting through the Abyss")],
});

const runespan = (
  id: string,
  label: string,
  image: string,
  from: number,
  to: number,
  rate: [number, number],
  where: string,
): XpMethod => ({
  id,
  label,
  wiki: page("Runespan"),
  image,
  from,
  to,
  needsEssence: false,
  quests: [],
  rate,
  provisional: false,
  where,
  ...dated,
  sources: [IRONMAN, page("Runespan")],
});

export const XP_METHODS: XpMethod[] = [
  runespan("runespan-lower", "Lower Runespan", "Runespan_lower_level.png", 1, 33, [56500, 83000], "Lower Runespan, via the Wizards' Tower portal. Mind storms, cyclones, then vines and fireballs."),
  runespan("runespan-middle", "Middle Runespan", "Runespan_lower_level.png", 33, 66, [80000, 117000], "Middle Runespan. Jumpers at 54, shifters at 44, nebulae at 40."),
  runespan("runespan-upper", "Upper Runespan (skulls, blood pools)", "Runespan_lower_level.png", 66, 111, [118000, 136000], "Upper Runespan. Skulls from 65, blood pools from 77, living and undead souls from 90."),
  abyss(1, 25, "Body", [12000, 25000]),
  abyss(25, 35, "Cosmic", [36000, 67000], ["lost-city"]),
  abyss(35, 50, "Nature", [70000, 118000]),
  abyss(50, 60, "Law", [91000, 153000]),
  abyss(60, 70, "Death", [115000, 178000], ["mournings-end-part-ii"]),
  abyss(70, 75, "Death", [135000, 207690], ["mournings-end-part-ii"]),
  abyss(75, 90, "Blood", [170000, 254000], ["legacy-of-seergaze"]),
  abyss(90, 95, "Soul", [221000, 407000], ["phite-club"]),
  abyss(95, 105, "Soul", [237000, 449000], ["phite-club"], true),
  abyss(105, 111, "Soul", [409000, 655000], ["phite-club"], true),
  {
    id: "soul-altar",
    label: "Soul altar",
    wiki: page("Soul altar"),
    image: "Soul_rune.png",
    from: 90,
    to: 111,
    needsEssence: true,
    altar: "Soul",
    quests: ["phite-club"],
    rate: [364000, 407000],
    provisional: false,
    where: "The Soul altar, by fairy ring. About 364k XP/hr at 90, 465k at 105 or more.",
    ...dated,
    sources: [TRAINING, page("Soul altar")],
  },
  {
    id: "runic-attuner",
    label: "Runic attuner",
    wiki: page("Runic attuner"),
    image: "Runic_attuner.png",
    from: 105,
    to: 111,
    needsEssence: true,
    quests: [],
    requiresAttuner: true,
    rate: [900000, 1100000],
    provisional: true,
    where: "Any altar the attuner picks. A 1/480 drop from The Gate of Elidinis; needs 80 Runecrafting to use.",
    ...dated,
    sources: [TRAINING, page("Runic attuner")],
  },
  {
    id: "necrotic-runes",
    label: "Necrotic runes",
    wiki: NECROTIC,
    image: "Spirit_rune.png",
    from: 1,
    to: 111,
    needsEssence: true,
    quests: ["rune-mythos"],
    rate: [59000, 512000],
    provisional: true,
    where: "The Necromantic Rune Temple. The rate grows from 59k-87k at level 1 to 349k-512k from 105. Impure essence.",
    ...dated,
    sources: [TRAINING, NECROTIC],
  },
];

export const ESSENCE_SOURCES: EssenceSource[] = [
  {
    id: "rune-chest",
    label: "Rune Memories essence chest",
    wiki: page("Rune Memories"),
    kind: "pure",
    rank: 1,
    quests: ["rune-memories"],
    levels: [],
    note: "Pure essence from the rune chest once Rune Memories is done.",
    ...dated,
    sources: [IRONMAN, page("Rune Memories")],
  },
  {
    id: "abyssal-savages",
    label: "Abyssal savage drops",
    wiki: page("Abyssal savage"),
    kind: "pure",
    rank: 2,
    quests: [],
    levels: [],
    note: "Noted pure essence drops. The Wiki asks for a high combat level.",
    ...dated,
    sources: [IRONMAN, page("Abyssal savage")],
  },
  {
    id: "mine-pure-essence",
    label: "Mining pure essence",
    wiki: page("Pure essence"),
    kind: "pure",
    rank: 3,
    quests: [],
    levels: [{ skill: "Mining", level: 30 }],
    note: "Members with Mining 30 mine pure essence at the Rune essence mine.",
    ...dated,
    sources: [page("Pure essence")],
  },
  {
    id: "slayer-pvm-drops",
    label: "Slayer and PvM drops",
    wiki: IRONMAN,
    kind: "pure",
    rank: 4,
    quests: [],
    levels: [],
    note: "The Ironman page suggests Slayer and other PvM for large amounts.",
    ...dated,
    sources: [IRONMAN],
  },
  {
    id: "necromantic-rituals",
    label: "Necromantic rune temple rituals",
    wiki: NECROTIC,
    kind: "impure",
    rank: 1,
    quests: ["rune-mythos"],
    levels: [],
    note: "Rituals at the Necromantic Rune Temple turn pure essence into impure essence, using ink and necroplasm.",
    ...dated,
    sources: [IRONMAN, NECROTIC],
  },
];
