// What a Slayer task card hands to the gear window: a method built from the master's own Slayer option (so the
// "wear at least" tier comes from that master's assignment table), and the few items a task needs on top.
import { skillByName, type TrainingOption } from "./data.ts";
import { SLAYER_MASTER_OPTIONS, type CombatClass } from "./trainingEquipment.ts";
import type { TaskVerdict } from "./slayerGuide.ts";
import { SLAYER_MASTERS } from "./slayerMastersImported.ts";
import { byLadder } from "./slayerMasters.ts";
import type { SlayerMaster, SlayerTask } from "./slayerTypes.ts";

/**
 * Items a task needs, named on the Wiki's Slayer equipment page
 * (https://runescape.wiki/w/Slayer_equipment, read 2026-11-16) and on the monster page each verdict already cites.
 * `helmet` is true where the Wiki says a Slayer helmet (or its parts) covers the item. `image` is the item's Wiki
 * inventory icon (file names checked against the Wiki's API, 2026-11-16).
 */
export const SLAYER_TASK_EXTRAS: Readonly<
  Record<string, { item: string; image: string; why: string; helmet: boolean; source: string }[]>
> = {
  Gargoyles: [
    {
      item: "Rock hammer",
      image: "Rock_hammer.png",
      why: "Finishes gargoyles; a normal hammer won't do.",
      helmet: false,
      source: "Gargoyle",
    },
  ],
  Banshees: [
    {
      item: "Earmuffs",
      image: "Earmuffs.png",
      why: "Protect against the banshee's screech.",
      helmet: true,
      source: "Banshee",
    },
  ],
  "Wall beasts": [
    {
      item: "Spiny helmet",
      image: "Spiny_helmet.png",
      why: "Protects against wall beasts' grabs.",
      helmet: true,
      source: "Wall beast",
    },
  ],
  "Aberrant spectres": [
    {
      item: "Nose peg",
      image: "Nose_peg.png",
      why: "Blocks the aberrant spectre's stench.",
      helmet: true,
      source: "Aberrant spectre",
    },
  ],
  "Dust devils": [
    {
      item: "Face mask",
      image: "Face_mask.png",
      why: "Blocks the dust devil's choking dust.",
      helmet: true,
      source: "Dust devil",
    },
  ],
  Basilisks: [
    {
      item: "Mirror shield",
      image: "Mirror_shield.png",
      why: "Reflects the basilisk's gaze.",
      helmet: false,
      source: "Basilisk",
    },
  ],
  "Mutated zygomites": [
    {
      item: "Fungicide spray",
      image: "Fungicide_spray_10.png",
      why: "Finishes mutated zygomites.",
      helmet: false,
      source: "Mutated zygomite",
    },
  ],
  Bloodveld: [
    {
      item: "Witchwood icon",
      image: "Witchwood_icon.png",
      why: "Needed for the cave horrors of Mos Le'Harmless.",
      helmet: false,
      source: "Cave horror",
    },
  ],
};

/** The Slayer helmet's Wiki inventory icon (checked 2026-11-16), shown where it covers a task's item. */
export const SLAYER_HELMET_IMAGE = "Slayer_helmet.png";

/** The gear style the gear window opens on. "any" means melee; the window still lets the player switch. */
export const gearStyleFor = (style: NonNullable<TaskVerdict["fastest"]>["style"]): CombatClass =>
  style === "any" ? "melee" : style;

/**
 * A training method for the gear window: the task's name and map site over the master's Slayer option. Masters with
 * no option of their own (Chaeldar, Duradel, Morvran...) borrow the tier of the nearest master strictly below them on
 * the (Slayer, combat) ladder, so a tie never borrows from a higher master.
 */
export function slayerGearMethod(
  master: SlayerMaster,
  task: SlayerTask,
  site?: TrainingOption["sites"][number],
): TrainingOption | undefined {
  const options = skillByName("Slayer")?.stages.flatMap((stage) => stage.options) ?? [];
  const own = options.find((option) => option.id === master.id && option.gear);
  const borrowed = SLAYER_MASTERS
    .filter((m) => SLAYER_MASTER_OPTIONS.includes(m.id) && byLadder(m, master) < 0)
    .sort(byLadder)
    .at(-1);
  const base = own ?? options.find((option) => option.id === borrowed?.id && option.gear);
  if (!base?.gear) return undefined;
  return {
    ...base,
    id: "slayer-assignment",
    title: task.name,
    wiki: task.wiki,
    sites: site ? [site] : [],
    locations: [],
  };
}
