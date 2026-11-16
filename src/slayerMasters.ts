import type { Profile } from "./data.ts";
import { COMBAT_SKILLS, combatLevel } from "./lib/combatLevel.ts";
import { levelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";
import { SLAYER_MASTERS } from "./slayerImported.ts";
import type { SlayerMaster } from "./slayerTypes.ts";

/** Wilderness masters: offered as alternatives, never as the default or the next step. */
const ALTERNATIVE_IDS = ["the-raptor", "mandrith"];

/** Orders the masters up the ladder: Slayer requirement, then combat requirement. */
const byLadder = (a: SlayerMaster, b: SlayerMaster) => a.slayer - b.slayer || a.combat - b.combat;

export type MasterChoice = {
  master?: SlayerMaster;
  next?: SlayerMaster;
  alternatives: SlayerMaster[];
  unrecorded?: SkillName[];
};

/**
 * The player's Slayer master: the usable one with the highest requirements. Quests must be done; requirements the
 * importer could only keep as text (`master.text`) can't be checked, so they never block a master. An unrecorded
 * Slayer level, or a skill the combat formula needs, leaves the choice undefined and is listed in `unrecorded`.
 */
export function masterFor(profile: Profile): MasterChoice {
  const combat = combatLevel(profile.levels);
  const slayer = profile.levels.Slayer;
  const unrecorded: SkillName[] = [
    ...(combat === undefined ? COMBAT_SKILLS.filter((skill) => profile.levels[skill] == null) : []),
    ...(slayer == null ? (["Slayer"] as const) : []),
  ];
  if (unrecorded.length || combat === undefined) return { alternatives: [], unrecorded };

  const inMode = SLAYER_MASTERS.filter((m) => profile.mode === "members" || !m.members);
  const usable = (m: SlayerMaster) =>
    levelStatus(combat, m.combat) === "met" &&
    levelStatus(slayer, m.slayer) === "met" &&
    m.quests.every((id) => profile.completedQuests.includes(id));
  const ladder = inMode.filter((m) => !ALTERNATIVE_IDS.includes(m.id)).sort(byLadder);
  const master = ladder.filter(usable).at(-1);
  return {
    master,
    next: ladder.find((m) => !master || byLadder(m, master) > 0),
    alternatives: inMode.filter((m) => ALTERNATIVE_IDS.includes(m.id) && usable(m)),
  };
}
