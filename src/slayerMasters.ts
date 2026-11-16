// Master choice only: this module may be loaded by every skill page, so it imports no task, verdict or quest data.
import type { Profile } from "./data.ts";
import { COMBAT_SKILLS, combatLevel } from "./lib/combatLevel.ts";
import { levelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";
import { SLAYER_MASTERS } from "./slayerImported.ts";
import type { SlayerMaster } from "./slayerTypes.ts";

/** Wilderness masters: offered as alternatives, never as the default or the next step. */
export const ALTERNATIVE_IDS = ["the-raptor", "mandrith"];

/**
 * Orders the masters up the ladder: Slayer requirement, then combat requirement. Turael, the Wiki's starting master,
 * sorts above Jacquelyn when their requirements tie, so he is the one chosen.
 */
export const byLadder = (a: SlayerMaster, b: SlayerMaster) =>
  a.slayer - b.slayer || a.combat - b.combat || Number(a.id === "turael") - Number(b.id === "turael");

export type MasterChoice = {
  master?: SlayerMaster;
  next?: SlayerMaster;
  alternatives: SlayerMaster[];
  unrecorded?: SkillName[];
};

/** The masters a profile can use at all: F2P profiles see only the free ones. */
export const mastersFor = (profile: Profile) =>
  SLAYER_MASTERS.filter((m) => profile.mode === "members" || !m.members);

/**
 * Whether the profile's recorded levels and quests allow a master. Requirements kept only as Wiki text
 * (`master.text`) can't be checked, so they never block. An unknown combat level blocks every master that needs combat.
 */
export function canUseMaster(profile: Profile, m: SlayerMaster): boolean {
  const combat = combatLevel(profile.levels);
  return (
    (combat === undefined ? m.combat === 0 : levelStatus(combat, m.combat) === "met") &&
    levelStatus(profile.levels.Slayer, m.slayer) === "met" &&
    m.quests.every((id) => profile.completedQuests.includes(id))
  );
}

/**
 * The player's Slayer master: the usable one with the highest requirements. Quests must be done; requirements the
 * importer could only keep as text (`master.text`) can't be checked, so they never block a master. An unrecorded
 * Slayer level leaves the choice undefined. An unknown combat level (a formula skill is unrecorded) blocks only the
 * masters that need combat, so the starter masters stay usable. `unrecorded` lists every missing skill that mattered.
 */
export function masterFor(profile: Profile): MasterChoice {
  const combat = combatLevel(profile.levels);
  const slayer = profile.levels.Slayer;
  const unrecorded: SkillName[] = [
    ...(combat === undefined ? COMBAT_SKILLS.filter((skill) => profile.levels[skill] == null) : []),
    ...(slayer == null ? (["Slayer"] as const) : []),
  ];
  if (slayer == null) return { alternatives: [], unrecorded };

  const inMode = mastersFor(profile);
  const usable = (m: SlayerMaster) => canUseMaster(profile, m);
  const ladder = inMode.filter((m) => !ALTERNATIVE_IDS.includes(m.id)).sort(byLadder);
  const master = ladder.filter(usable).at(-1);
  return {
    master,
    next: ladder.find((m) => !master || byLadder(m, master) > 0),
    alternatives: inMode.filter((m) => ALTERNATIVE_IDS.includes(m.id) && usable(m)),
    ...(unrecorded.length ? { unrecorded } : {}),
  };
}
