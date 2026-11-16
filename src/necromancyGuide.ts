// Hand-judged Necromancy advice, written for an Ironman (spec: docs/superpowers/specs/2026-11-16-necromancy-guide-design.md).
// Level ranges follow the Summary on https://runescape.wiki/w/Necromancy_training. Where
// https://runescape.wiki/w/Ironman_Mode/Guide/Necromancy differs because an Ironman can't buy something, the Ironman
// call wins and the regular-account call goes in `mainNote`. Quest levels and unlocks come from each quest's own page,
// soul gates from the Well of Souls and the talent table, and Kili's targets from each Kili's Knowledge page.
// Checked 2026-11-16.
// Types only: this module must not pull the generated Necromancy data into the main chunk.
import type { SkillName } from "./skillNames.ts";

type Checked = { checked: string; sources: string[] };

/** One storyline quest, in the order the page lists them. `quest` is a QUESTS id; the page uses that quest's icon. */
export type StoryStep = Checked & {
  quest: string;
  /** The Necromancy level the quest asks for. */
  level: number;
  /** Vessel souls needed to start it. */
  souls?: number;
  unlocks: string;
  members: boolean;
  /** XP and souls only: not needed for gear, the storyline or the bosses, so "next" can skip it. */
  optional?: true;
  /** Shown on regular-account profiles only. */
  mainNote?: string;
};

/** A Well of Souls threshold. `unlocks` names the levels and quests that also gate what it opens. */
export type SoulGate = Checked & { souls: number; unlocks: string };

/**
 * The method to train at Necromancy levels [from, to). `optionId` is a training option id in skillsCombat.ts's
 * Necromancy stages. Ids repeat across stages (`necro-combat` is the troll cave from 1 to 20 and the Lumbridge
 * Catacombs skeletons from 20 to 60), so resolve the option in the stage the app picks for the player's level:
 * `trainingStage` then `availableTrainingOptions`. `members: false` entries also serve free-to-play, up to level 20.
 * Each mode's last entry also covers its `to`: 120 for members, and 20 for the last free entry. Clamp a free-to-play
 * level to 20 before the lookup.
 */
export type XpTarget = Checked & {
  from: number;
  to: number;
  optionId: string;
  /** A second option for the same range, e.g. the AFK one beside the fastest. */
  altOptionId?: string;
  members: boolean;
  note: string;
  mainNote?: string;
};

/** Something to kill, fetch or do. `wiki` is a page title, `image` a Wiki file name. */
export type Target = { name: string; wiki: string; image?: string; detail: string };

export type UpgradeLine = "weapon" | "deathwarden" | "deathdealer";
export type StepKey = `${UpgradeLine}:${number}`;
export const progressKey = (line: UpgradeLine, tier: number): StepKey => `${line}:${tier}`;

/**
 * What moves one upgrade step forward, beyond its quests and materials (those are in NECRO_UPGRADES). `task` equals
 * the imported step's Kili task, `targets` are what that task asks for, and `drop` is a material only a boss drops.
 */
export type StepTarget = Checked & {
  line: UpgradeLine;
  tier: number;
  task: string;
  targets: Target[];
  /** What the task needs beyond the tier's Necromancy level and the previous task. */
  requires?: string;
  drop?: { item: string; qty: number; image?: string; from: Target; rate: string };
  note?: string;
  mainNote?: string;
};

/** A tier 95 boss: what it drops for which line, and what it takes to fight. `quests` are QUESTS ids. */
export type EndgameTarget = Checked & {
  boss: string;
  wiki: string;
  image?: string;
  lines: ("weapon" | "robe")[];
  drops: { item: string; rate: string; image?: string }[];
  quests: string[];
  skills: { skill: SkillName; level: number }[];
  note: string;
};

/** Necromancy weapons bought with Dungeoneering tokens: a side note on the weapon path, not a step. */
export type DungeoneeringWeapon = Checked & {
  name: "Gravite" | "Chaotic" | "Ruinous";
  /** The Necromancy level to wield it. */
  level: number;
  dungeoneering: number;
  purchases: { items: string[]; tokens: number; plus?: string; image?: string }[];
  note: string;
  /** Set when the Wiki contradicts itself on a cost. */
  unverified?: string;
};

const CHECKED = "2026-11-16";
const W = "https://runescape.wiki/w/";
const page = (title: string) => W + title.replaceAll(" ", "_");
const TRAINING = page("Necromancy training");
const IRONMAN = page("Ironman Mode/Guide/Necromancy");
const WELL = page("Well of Souls");
const TALENTS = page("Talents");
const dated = (...sources: string[]): Checked => ({ checked: CHECKED, sources });

export const NECRO_STORY: StoryStep[] = [
  {
    quest: "necromancy",
    level: 1,
    unlocks:
      "Necromancy itself: the tier 10 death guard and skull lantern, Necromancy abilities, the Well of Souls and rituals at the Um ritual site. Claim the free Deathwarden robes from Sostratus afterwards; Kili Row needs them.",
    members: false,
    ...dated(page("Necromancy!")),
  },
  {
    quest: "kili-row",
    level: 20,
    unlocks:
      "Ensoul rituals (lesser, regular and greater), tier 20 upgrades at Kili's soul forge, Kili's upgrade tasks every 10 levels after it, and Thalmund's Wares.",
    members: true,
    ...dated(page("Kili Row")),
  },
  {
    quest: "rune-mythos",
    level: 24,
    unlocks:
      "Essence rituals that turn pure essence into impure essence, necrotic runecrafting, and incantations, starting with City of Um Teleport and Lesser Bone Shield.",
    members: true,
    ...dated(page("Rune Mythos")),
  },
  {
    quest: "that-old-black-magic",
    level: 32,
    unlocks:
      "XP and souls only: four parts at 32, 45, 50 and 65 Necromancy (the full quest also needs 51 Archaeology), worth 85 souls and lamps for 45,000 Necromancy XP in all.",
    members: true,
    optional: true,
    ...dated(page("That Old Black Magic"), page("City of Um quest series")),
  },
  {
    quest: "vessel-of-the-harbinger",
    level: 46,
    unlocks:
      "25 souls and a 10,000 Necromancy XP lamp; the next step of the storyline, which The Spirit of War needs. Also needs 40 Prayer and Ghosts Ahoy.",
    members: true,
    ...dated(page("Vessel of the Harbinger")),
  },
  {
    quest: "housing-of-parliament",
    level: 54,
    unlocks:
      "XP and souls only: a 20,000 Necromancy XP lamp, 25 souls and an uncut moonstone. Ironmen also need 66 Fishing (boostable).",
    members: true,
    optional: true,
    ...dated(page("Housing of Parliament"), page("City of Um quest series")),
  },
  {
    quest: "the-spirit-of-war",
    level: 65,
    souls: 3000,
    unlocks:
      "Kili's tier 70 to 90 upgrades, the Hermod boss fight (hermodic plates for Deathdealer robes), Kharen's ferry around Um, one hermodic plate and a 45,000 Necromancy XP lamp.",
    members: true,
    ...dated(page("The Spirit of War"), WELL),
  },
  {
    quest: "tomes-of-the-warlock",
    level: 75,
    unlocks:
      "The incantations Darkness, Greater Bone Shield, Invoke Death and Life Transfer at the Well of Souls, and a 60,000 Necromancy XP lamp. Also needs 86 Archaeology, 66 Magic and The Jack of Spades.",
    members: true,
    ...dated(page("Tomes of the Warlock")),
  },
  {
    quest: "requiem-for-a-dragon",
    level: 75,
    unlocks:
      "The Ungael ritual site, which allows every glyph spot before 90 Necromancy but gives 20% less XP and no communion rituals, plus Zorgoth's ring and a 100,000 Necromancy XP lamp. Its rituals need 75 Necromancy; its five greater ensouled bars need 80 Necromancy and, for Ironmen, 80 Smithing (both boostable), unless bought from Thalmund's Wares.",
    members: true,
    ...dated(page("Requiem for a Dragon"), page("Ungael ritual site"), TRAINING),
  },
  {
    quest: "remains-of-the-necrolord",
    level: 85,
    unlocks:
      "A 100,000 Necromancy XP lamp and the last step before Alpha vs Omega; freeing the listless dead afterwards adds 14 souls. Also needs 77 Dungeoneering and the unabridged Vengeance and Nadir sagas.",
    members: true,
    ...dated(page("Remains of the Necrolord"), WELL),
  },
  {
    quest: "alpha-vs-omega",
    level: 95,
    souls: 30000,
    unlocks:
      "The Rasial boss fight, which drops the tier 95 First Necromancer's equipment, and a 150,000 Necromancy XP lamp.",
    members: true,
    ...dated(page("Alpha vs Omega"), WELL),
  },
];

export const SOUL_GATES: SoulGate[] = [
  {
    souls: 3000,
    unlocks: "Starts The Spirit of War (65 Necromancy), which opens Kili's tier 70 to 90 upgrades.",
    ...dated(WELL, TRAINING),
  },
  {
    souls: 4500,
    unlocks:
      "Talent tier 5 at 70 Necromancy: Spectral Scythe's second cast, Conjure Phantom Guardian and Spirit Pact II. Greater Bone Shield (73) and Life Transfer (76) there also need Tomes of the Warlock.",
    ...dated(TALENTS, TRAINING),
  },
  {
    souls: 8500,
    unlocks:
      "Talent tier 6 at 80 Necromancy: Spectral Scythe's third cast, Command Phantom Guardian and Spirit Pact III. Darkness (86) and Invoke Death there also need Tomes of the Warlock.",
    ...dated(TALENTS, TRAINING),
  },
  {
    souls: 30000,
    unlocks: "Starts Alpha vs Omega (95 Necromancy), which opens the Rasial boss fight.",
    ...dated(WELL, TRAINING),
  },
  {
    souls: 35000,
    unlocks:
      "Talent tier 7 at 90 Necromancy, the last: Split Soul (92, also needs The Temple at Senntisten) and Conjure Undead Army (99).",
    ...dated(TALENTS, WELL, TRAINING),
  },
];

export const XP_TARGETS: XpTarget[] = [
  {
    from: 1,
    to: 5,
    optionId: "necro-combat",
    members: false,
    note: "The Necromancy! quest itself takes you to about 5; the troll cave is where its combat starts.",
    ...dated(TRAINING, IRONMAN),
  },
  {
    from: 5,
    to: 20,
    optionId: "necro-combat",
    members: false,
    note: "The Ironman guide trains combat in the City of Um troll cave from 5, after a few lesser communion rituals for the first 50 souls.",
    mainNote:
      "The Wiki's main guide runs lesser communion with 50 fragile mementos from the Grand Exchange instead, to about level 26 and the 400 souls for talent tier 3.",
    ...dated(IRONMAN, TRAINING),
  },
  {
    from: 20,
    to: 40,
    optionId: "necro-combat",
    members: true,
    note: "The Ironman guide's Lumbridge Catacombs skeletons (20 to 70), or the troll cave the main guide keeps to 40. Do Kili Row at 20 and Rune Mythos at 24, and upgrade again with Kili's Knowledge I at 30.",
    mainNote: "The main guide keeps to lesser communion with fragile mementos until about 26, then does both quests.",
    ...dated(IRONMAN, TRAINING),
  },
  {
    from: 40,
    to: 60,
    optionId: "necro-ankou",
    members: true,
    note: "Ankou from 40 per the main guide; ghouls north of Canifis and shadow warriors under the Legends' Guild are its other picks to 60.",
    ...dated(TRAINING, IRONMAN),
  },
  {
    from: 60,
    to: 80,
    optionId: "armoured-zombies",
    members: true,
    note: "The main guide's first pick from 60 to 90; it needs part of Defender of Varrock. Bound skeletons north of Fort Forinthry are its alternative.",
    ...dated(TRAINING, IRONMAN),
  },
  {
    from: 80,
    to: 90,
    optionId: "necro-abyssals",
    members: true,
    note: "Abyssal demons in the level 18 Wilderness, or abyssal savages west of Rogues' Castle, per the main guide's 80 to 90 list.",
    ...dated(TRAINING, IRONMAN),
  },
  {
    from: 90,
    to: 120,
    optionId: "powerful-communion",
    altOptionId: "ravenous-ghouls",
    members: true,
    note: "Powerful rituals are the fastest XP, and the Ironman guide runs communion to 35,000 souls; ravenous ghouls are the AFK alternative.",
    ...dated(TRAINING, IRONMAN),
  },
];

const ROBE_CLOTH_NOTE =
  "Regular accounts can buy the robe pieces that the ensoul rituals turn into cloth on the Grand Exchange; the ensouled cloth itself is untradeable.";
const HOLD_ARMOUR =
  "The main guide holds armour at tier 70 until you can run a full ritual site: 90 Necromancy at Um, or 75 with the Ungael ritual site. The Ironman guide waits for 90 and a boost to 103 for Multiply III glyphs.";

const chickens: Target = {
  name: "Chickens",
  wiki: "Chicken",
  image: "Chicken.png",
  detail: "Fill the soul urn: kill five chickens with Necromancy, or run one lesser communion ritual.",
};
const kiliRow = {
  task: "Kili Row",
  targets: [chickens],
  note: "Kili Row is a quest; it also needs the Deathwarden robes from Sostratus.",
  ...dated(page("Kili Row")),
};
const knowledge1 = {
  task: "Kili's Knowledge I",
  targets: [
    {
      name: "Ghostly trolls",
      wiki: "City of Um troll cave",
      image: "Ghostly_troll_bruiser.png",
      detail: "Fill the soul urn: 25 troll kills in the City of Um troll cave, or three lesser communion rituals.",
    },
  ],
  ...dated(page("Kili's Knowledge I"), IRONMAN),
};
const knowledge2 = {
  task: "Kili's Knowledge II",
  targets: [
    {
      name: "Undead",
      wiki: "Undead",
      detail: "Fill the soul urn: 50 undead kills, or five lesser communion rituals.",
    },
    {
      name: "Meat pie",
      wiki: "Meat pie",
      image: "Meat_pie.png",
      detail: "Give Kili a meat pie; Let Them Eat Pie and Nature Spirit both give one.",
    },
  ],
  ...dated(page("Kili's Knowledge II"), IRONMAN),
};
const knowledge3 = {
  task: "Kili's Knowledge III",
  targets: [
    {
      name: "Mogres",
      wiki: "Mogre",
      image: "Necromancer's_flippers.png",
      detail: "Kill mogres with Necromancy for the necromancer's flippers, a common drop once the mogre lore activity is done.",
    },
    {
      name: "Demons",
      wiki: "Imp",
      image: "Imp.png",
      detail: "Fill the soul urn: 75 demon kills (imps in the Karamja Volcano resource dungeon are fast), or 10 lesser communion rituals.",
    },
    {
      name: "Apple pie",
      wiki: "Apple pie",
      image: "Apple_pie.png",
      detail: "Give Kili an apple pie; starting Nature Spirit gives three.",
    },
  ],
  requires:
    "32 Slayer (boostable) and the mogre lore activity. Ironmen: 20 Cooking (boostable) or partial Nature Spirit for the pie.",
  ...dated(page("Kili's Knowledge III"), IRONMAN),
};
const knowledge4 = {
  task: "Kili's Knowledge IV",
  targets: [
    {
      name: "Ankou",
      wiki: "Ankou",
      image: "Ankou_residue.png",
      detail: "Use Kili's ankou agitator on ankou out of combat ten times; the tougher ankou that spawns drops the ankou residue. Any style.",
    },
    {
      name: "Level 70+ monsters",
      wiki: "Abyssal leech",
      image: "Abyssal_leech.png",
      detail: "Fill the soul urn: 50 kills of monsters of combat level 70 or more (Abyss leeches, walkers and guardians die fast), or 10 greater communion rituals.",
    },
    {
      name: "Garden pie",
      wiki: "Garden pie",
      image: "Garden_pie.png",
      detail: "Give Kili a garden pie.",
    },
  ],
  ...dated(page("Kili's Knowledge IV"), IRONMAN),
};
const knowledge5 = {
  task: "Kili's Knowledge V",
  targets: [
    {
      name: "Barrows Brothers",
      wiki: "The Barrows Brothers",
      image: "United_Barrows_necroplasm.png",
      detail: "Kill the six original brothers and use 20 greater necroplasm on each sarcophagus, then loot the chest for the united Barrows necroplasm.",
    },
    {
      name: "Dragons",
      wiki: "Baby blue dragon",
      image: "Baby_blue_dragon.png",
      detail: "Fill the soul urn: 100 dragons killed with Necromancy (baby blue dragons in Taverley Dungeon are quick), or 20 greater communion rituals.",
    },
    {
      name: "Fish pie",
      wiki: "Fish pie",
      image: "Fish_pie.png",
      detail: "Give Kili a fish pie.",
    },
  ],
  requires: "The Spirit of War. Ironmen: 47 Cooking to cook the pie, or 28 Hunter for a gourmet impling.",
  ...dated(page("Kili's Knowledge V"), IRONMAN),
};
const knowledge6 = {
  task: "Kili's Knowledge VI",
  targets: [
    {
      name: "God Wars Dungeon generals",
      wiki: "Spiritbound hammer (charged)",
      image: "Spiritbound_hammer_(charged).png",
      detail: "Kill General Graardor, Kree'arra, K'ril Tsutsaroth and Commander Zilyana with Necromancy, using the hammer on each one's altar straight after, to charge the spiritbound hammer.",
    },
    {
      name: "Slayer monsters",
      wiki: "Slayer assignment",
      detail: "Fill the soul urn: 150 monsters on Slayer assignments killed with Necromancy, or 30 greater communion rituals.",
    },
    {
      name: "Redberry pie",
      wiki: "Redberry pie",
      image: "Redberry_pie.png",
      detail: "Give Kili a redberry pie.",
    },
  ],
  requires: "Partial Troll Stronghold, and 70 Agility, Constitution, Ranged and Strength.",
  ...dated(page("Kili's Knowledge VI"), IRONMAN),
};
const knowledge7 = {
  task: "Kili's Knowledge VII",
  targets: [
    {
      name: "Heart of Gielinor generals",
      wiki: "Kili's Knowledge VII",
      image: "Powered_necromantic_seal_of_the_Cywir.png",
      detail: "Kill the Twin Furies, Helwyr, Gregorovic and Vindicta & Gorvek (any style) carrying 25 greater necroplasm for ten unpowered seals of each, then power each seal through its own activity.",
    },
    {
      name: "TzTok-Jad",
      wiki: "TzTok-Jad",
      image: "Pulsating_onyx.png",
      detail: "Beat TzTok-Jad at the end of the TzHaar Fight Cave for the pulsating onyx.",
    },
    {
      name: "Soul Reaper",
      wiki: "Soul Reaper",
      detail: "Fill the soul urn: one soul from a Soul Reaper task, or 50 powerful communion rituals.",
    },
    {
      name: "Blueberry pie",
      wiki: "Blueberry pie",
      image: "Blueberry_pie.png",
      detail: "Give Kili a blueberry pie: Evil Bob trades the blueberries for golden wool.",
    },
  ],
  requires:
    "Partial The Fremennik Trials and A Fairy Tale II - Cure a Queen; 80 Attack, Magic, Prayer and Ranged and 60 Runecrafting (all boostable); 20 Archaeology.",
  ...dated(page("Kili's Knowledge VII"), IRONMAN),
};

const hermod: Target = {
  name: "Hermod, the Spirit of War",
  wiki: "Hermod, the Spirit of War",
  image: "Hermod,_the_Spirit_of_War.png",
  detail: "The Spirit of War opens the fight; Kharen's gondola in north-west Um takes you to Rasial's Citadel.",
};
const plates = (qty: number) => ({
  item: "Hermodic plate",
  qty,
  image: "Hermodic_plate.png",
  from: hermod,
  rate: "1/10 (1/9 with tier 3 luck)",
});
const HERMOD = page("Hermod, the Spirit of War");
const PLATE = page("Hermodic plate");

const power5 = {
  task: "Kili's Knowledge V (power)",
  targets: [
    {
      name: "Giant mole",
      wiki: "Giant mole",
      image: "Giant_mole.png",
      detail: "Five hideous moleskins: they drop only when the mole dies to Necromancy.",
    },
    {
      name: "Kalphite Queen",
      wiki: "Kalphite Queen",
      image: "Kalphite_Queen.png",
      detail: "Five royal chitin: kill her second form with Necromancy (the exiled Kalphite Queen counts too).",
    },
  ],
  requires: "The Spirit of War.",
  ...dated(page("Kili's Knowledge V (power)"), IRONMAN),
};
const power6 = {
  task: "Kili's Knowledge VI (power)",
  targets: [
    {
      name: "Nex",
      wiki: "Nex",
      image: "Nex.png",
      detail: "Five Zaryte fragments: every player who used Necromancy gets one per kill, so masses work.",
    },
    {
      name: "Queen Black Dragon",
      wiki: "Queen Black Dragon",
      image: "Queen_Black_Dragon.png",
      detail: "Five tortured soul essences: kill her with Necromancy.",
    },
  ],
  requires: "The Dig Site, partial Troll Stronghold, 70 Agility, Constitution, Ranged and Strength, and 60 Summoning.",
  ...dated(page("Kili's Knowledge VI (power)"), IRONMAN),
};
const power7 = {
  task: "Kili's Knowledge VII (power)",
  targets: [
    {
      name: "Vorago, Telos or Solak",
      wiki: "Fragment of anima",
      image: "Fragment_of_anima.png",
      detail: "One fragment of anima: kill any one of them with Necromancy.",
    },
    {
      name: "The Ambassador",
      wiki: "The Ambassador",
      image: "Ulthven_necroplasm.png",
      detail: "Ulthven necroplasm: kill him in the Shadow Reef on normal mode (not story mode), mostly with Necromancy.",
    },
    {
      name: "Araxxi",
      wiki: "Araxxi",
      image: "Venomous_greater_ensouled_cloth.png",
      detail: "Venomous greater ensouled cloth: use a greater ensouled cloth on Araxxi's body after the kill. Any style.",
    },
  ],
  ...dated(page("Kili's Knowledge VII (power)"), IRONMAN),
};

type TaskTarget = Omit<StepTarget, "line" | "tier">;
const EITHER =
  "Either Kili task for this tier, tank or power, unlocks the weapon upgrade; the tank task is listed here.";
const weapon = (tier: number, t: TaskTarget, note?: string): StepTarget => ({
  line: "weapon",
  tier,
  ...t,
  ...(note ? { note: t.note ? `${t.note} ${note}` : note } : {}),
  sources: [...t.sources, IRONMAN].filter((s, i, all) => all.indexOf(s) === i),
});
const robe = (line: "deathwarden" | "deathdealer", tier: number, t: TaskTarget, extra: Partial<StepTarget> = {}): StepTarget => ({
  line,
  tier,
  ...t,
  mainNote: ROBE_CLOTH_NOTE,
  ...extra,
  sources: [...t.sources, ...(extra.sources ?? [])].filter((s, i, all) => all.indexOf(s) === i),
});

/** Tier 10 steps have no Kili task and so no entry: callers fall back to the step's quest (Necromancy!). */
export const PROGRESS_TARGETS: Partial<Record<StepKey, StepTarget>> = Object.fromEntries(
  [
    weapon(20, kiliRow),
    weapon(30, knowledge1),
    weapon(40, knowledge2),
    weapon(50, knowledge3),
    weapon(60, knowledge4),
    weapon(70, knowledge5, EITHER),
    weapon(80, knowledge6, EITHER),
    weapon(90, knowledge7, EITHER),
    robe("deathwarden", 20, kiliRow),
    robe("deathwarden", 30, knowledge1),
    robe("deathwarden", 40, knowledge2),
    robe("deathwarden", 50, knowledge3),
    robe("deathwarden", 60, knowledge4),
    robe("deathwarden", 70, knowledge5),
    robe("deathwarden", 80, knowledge6, { note: HOLD_ARMOUR, sources: [TRAINING] }),
    robe("deathwarden", 90, knowledge7, { note: HOLD_ARMOUR, sources: [TRAINING] }),
    robe("deathdealer", 70, power5, {
      drop: plates(5),
      note: "Deathdealer branches from tier 60 Deathwarden robes.",
      sources: [HERMOD, PLATE],
    }),
    robe("deathdealer", 80, power6, { drop: plates(10), note: HOLD_ARMOUR, sources: [HERMOD, PLATE, TRAINING] }),
    robe("deathdealer", 90, power7, { drop: plates(15), note: HOLD_ARMOUR, sources: [HERMOD, PLATE, TRAINING] }),
  ].map((t) => [progressKey(t.line, t.tier), t]),
) as Partial<Record<StepKey, StepTarget>>;

const RASIAL = page("Rasial, the First Necromancer");
export const ENDGAME_TARGETS: EndgameTarget[] = [
  {
    boss: "Rasial, the First Necromancer",
    wiki: "Rasial, the First Necromancer",
    image: "Rasial,_the_First_Necromancer.png",
    lines: ["weapon", "robe"],
    drops: [
      { item: "Omni guard", rate: "1/640", image: "Omni_guard.png" },
      { item: "Soulbound lantern", rate: "1/640", image: "Soulbound_lantern.png" },
      { item: "Crown of the First Necromancer", rate: "1/640", image: "Crown_of_the_First_Necromancer.png" },
      { item: "Robe top of the First Necromancer", rate: "1/640", image: "Robe_top_of_the_First_Necromancer.png" },
      { item: "Robe bottom of the First Necromancer", rate: "1/640", image: "Robe_bottom_of_the_First_Necromancer.png" },
      { item: "Hand wrap of the First Necromancer", rate: "1/640", image: "Hand_wrap_of_the_First_Necromancer.png" },
      { item: "Foot wraps of the First Necromancer", rate: "1/640", image: "Foot_wraps_of_the_First_Necromancer.png" },
    ],
    quests: ["alpha-vs-omega"],
    skills: [
      { skill: "Necromancy", level: 95 },
      { skill: "Dungeoneering", level: 77 },
      { skill: "Archaeology", level: 86 },
      { skill: "Magic", level: 66 },
      { skill: "Prayer", level: 40 },
    ],
    note: "Alpha vs Omega opens the fight and needs 30,000 souls to start. The weapons and the robes roll separately each kill, so one kill can give both.",
    ...dated(RASIAL, page("Alpha vs Omega"), page("First Necromancer's equipment")),
  },
  {
    boss: "Amascut, the Devourer",
    wiki: "Amascut, the Devourer",
    image: "Amascut,_the_Devourer.png",
    lines: ["weapon"],
    drops: [
      { item: "Devourer's Guard", rate: "1/4,800 on normal mode; 1/560 at 100% enrage, down to 1/200 at 2,000% and above", image: "Devourer's_Guard.png" },
    ],
    quests: ["eclipse-of-the-heart"],
    skills: [
      { skill: "Agility", level: 65 },
      { skill: "Necromancy", level: 90 },
    ],
    note: "A boss for teams of up to five. Eclipse of the Heart opens it, and that quest's own tree runs through the Desert quests, Requiem for a Dragon and Tomes of the Warlock. Devourer's Guard is a main-hand guard with no off-hand, and needs 95 Necromancy to wield.",
    ...dated(page("Amascut, the Devourer"), page("Eclipse of the Heart"), page("Devourer's Guard")),
  },
];

export const DUNGEONEERING_WEAPONS: DungeoneeringWeapon[] = [
  {
    name: "Gravite",
    level: 55,
    dungeoneering: 35,
    purchases: [
      { items: ["Gravite guard"], tokens: 22500, image: "Gravite_guard.png" },
      { items: ["Gravite lantern"], tokens: 7500, image: "Gravite_lantern.png" },
    ],
    note: "Tier 55, no Kili task needed; degrades. From Marmaros outside Daemonheim.",
    ...dated(page("Gravite weaponry"), page("Gravite guard"), page("Gravite lantern")),
  },
  {
    name: "Chaotic",
    level: 80,
    dungeoneering: 70,
    purchases: [
      { items: ["Chaotic guard"], tokens: 150000, image: "Chaotic_guard.png" },
      { items: ["Chaotic lantern"], tokens: 50000, image: "Chaotic_lantern.png" },
    ],
    note: "Tier 80, no Kili task needed; breaks on death and must be repaired.",
    ...dated(page("Chaotic equipment"), page("Chaotic guard"), page("Chaotic lantern")),
  },
  {
    name: "Ruinous",
    level: 90,
    dungeoneering: 90,
    purchases: [
      {
        items: ["Ruinous guard", "Ruinous lantern"],
        tokens: 1000000,
        plus: "1 warped stone",
        image: "Ruinous_guard.png",
      },
    ],
    note: "Tier 90 damage with tier 100 accuracy; degrades in combat. Bought as a pair since 1 June 2026. The Siphon page's 750,000 is the older main-hand-only price.",
    ...dated(page("Ruinous weapons"), page("Ruinous guard"), page("Ruinous lantern"), page("Siphon")),
  },
];
