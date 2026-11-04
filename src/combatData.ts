import { FOUNDATION_COMBAT } from "./questsFoundations.ts";
import { UNLOCK_COMBAT } from "./questsUnlocks.ts";
import { TALE_COMBAT } from "./questsTales.ts";
import { ADVENTURE_COMBAT } from "./questsAdventures.ts";
import { SIDE_COMBAT } from "./questsSideActivities.ts";
import { SEASONAL_COMBAT } from "./questsSeasonal.ts";

export interface QuestEnemy {
  name: string;
  wiki: string;
  image?: string;
  level: number | string;
}
export interface CombatPlan {
  required: QuestEnemy[];
  hazards: QuestEnemy[];
  notes: string[];
}

// Combat fields and enemy images are sourced from each quest and NPC Wiki article.
export const QUEST_COMBAT: Record<string, CombatPlan> = {
  ...FOUNDATION_COMBAT,
  ...UNLOCK_COMBAT,
  ...TALE_COMBAT,
  ...ADVENTURE_COMBAT,
  ...SIDE_COMBAT,
  ...SEASONAL_COMBAT,
  "cooks-assistant": { required: [], hazards: [], notes: [] },
  "knights-sword": {
    required: [],
    hazards: [
      {
        name: "Ice warrior",
        wiki: "Ice warrior",
        image: "Ice_warrior.png",
        level: 40,
      },
      {
        name: "Ice giant",
        wiki: "Ice giant",
        image: "Ice_giant.png",
        level: 47,
      },
    ],
    notes: [
      "Aggressive monsters guard the blurite rocks. Bring food and armour, and plan an exit; you do not need to fight them.",
    ],
  },
  "dragon-slayer": {
    required: [
      {
        name: "Zombie rat",
        wiki: "Zombie rat",
        image: "Zombie_rat.png",
        level: 2,
      },
      {
        name: "Ghost",
        wiki: "Ghost (Melzar's Maze)",
        image: "Ghost_(Melzar's_Maze).png",
        level: 12,
      },
      {
        name: "Skeleton",
        wiki: "Skeleton (Melzar's Maze)",
        image: "Skeleton_(Melzar's_Maze).png",
        level: 12,
      },
      {
        name: "Zombie",
        wiki: "Zombie (Melzar's Maze)",
        image: "Zombie_(Melzar's_Maze).png",
        level: 14,
      },
      {
        name: "Melzar the Mad",
        wiki: "Melzar the Mad",
        image: "Melzar_the_Mad.png",
        level: 39,
      },
      {
        name: "Lesser demon",
        wiki: "Lesser demon (Melzar's Maze)",
        image: "Lesser_demon_(Melzar's_Maze).png",
        level: 56,
      },
      { name: "Elvarg", wiki: "Elvarg", image: "Elvarg.png", level: 63 },
    ],
    hazards: [
      {
        name: "Wormbrain · optional fight",
        wiki: "Wormbrain",
        image: "Wormbrain.png",
        level: 5,
      },
    ],
    notes: [
      "Bring combat equipment and food. Some maze enemies may need more than one kill for their key drop.",
      "Dragonfire protection is essential. Obtain the anti-dragon shield during the quest and equip it for the dragon fight; it is not a normal pre-start pickup.",
      "The final cavern has no safespots. Plan an escape rather than relying on one.",
    ],
  },
  "waterfall-quest": {
    required: [],
    hazards: [
      {
        name: "Fire giant",
        wiki: "Fire giant",
        image: "Fire_giant.png",
        level: 85,
      },
      {
        name: "Skeleton",
        wiki: "Skeleton",
        image: "Skeleton_(level_58).png",
        level: 58,
      },
    ],
    notes: [
      "Dangerous dungeon travel: evade aggressive enemies rather than fighting them. Bring food and plan an exit.",
      "Weapons, armour, runes, familiars and prayers cannot be used in Glarial's Tomb.",
      "Falls and river mistakes can deal damage. Bring a rope.",
    ],
  },
  "tree-gnome-village": {
    required: [
      {
        name: "Khazard warlord",
        wiki: "Khazard warlord",
        image: "Khazard_warlord.png",
        level: 53,
      },
    ],
    hazards: [
      {
        name: "Khazard commanders · avoidable",
        wiki: "Khazard commander",
        image: "Khazard_commander.png",
        level: 49,
      },
    ],
    notes: [
      "Bring combat gear and food for the required fight. The commanders can be avoided; they are not additional required kills.",
    ],
  },
};
