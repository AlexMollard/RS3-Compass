import type { ItemReference, SkillRecord } from "./data.ts";
import type { LocationRecord } from "./locations.ts";

// Locations and images: https://runescape.wiki/w/Burthorpe_Troll_Cave
// https://runescape.wiki/w/Lumbridge_Catacombs https://runescape.wiki/w/City_of_Um
// https://runescape.wiki/w/Pikkupstix%27s_Summoning_Shop
export const COMBAT_LOCATIONS: Record<string, LocationRecord> = {
  "Burthorpe Troll Cave": {
    name: "Burthorpe Troll Cave",
    wiki: "Burthorpe_Troll_Cave",
    image: "Burthorpe_Troll_Cave.png",
    members: false,
    summary: "Low-level trolls north of Burthorpe; combat tutors stand inside.",
    access:
      "Bring food and leave if overwhelmed; different troll types use different styles.",
  },
  "Lumbridge Catacombs": {
    name: "Lumbridge Catacombs",
    wiki: "Lumbridge_Catacombs",
    image: "Lumbridge_Catacombs.png",
    members: false,
    summary: "Low-level undead and experiments beneath Lumbridge cemetery.",
    access: "Complete The Blood Pact to reach the lower catacombs.",
  },
  "City of Um": {
    name: "City of Um",
    wiki: "City_of_Um",
    image: "City_of_Um.png",
    members: false,
    summary: "The ritual site and Well of Souls are in the underworld city.",
    access:
      "Enter the portal north of Draynor lodestone and complete Necromancy! to train the skill.",
  },
  "Pikkupstix's Summoning Shop": {
    name: "Pikkupstix's Summoning Shop",
    wiki: "Pikkupstix's_Summoning_Shop",
    image: "Pikkupstix's_Summoning_Shop_exterior.png",
    members: false,
    summary:
      "Pikkupstix sells supplies at the Taverley shop; an obelisk is inside.",
    access:
      "Wolf Whistle introduces Summoning but is not required to train it.",
  },
};

// Item images and recipes: https://runescape.wiki/w/Free-to-play_Prayer_training
// https://runescape.wiki/w/Dreadfowl_pouch https://runescape.wiki/w/Summoning_training
// https://runescape.wiki/w/Free-to-play_Ranged_training https://runescape.wiki/w/Free-to-play_Magic_training
export const COMBAT_ITEMS: ItemReference[] = [
  { name: "Bones", wiki: "Bones", image: "Bones.png", aliases: ["bone"] },
  { name: "Big bones", wiki: "Big_bones", image: "Big_bones.png" },
  {
    name: "Gold charm",
    wiki: "Gold_charm",
    image: "Gold_charm.png",
    aliases: ["gold charms"],
  },
  {
    name: "Spirit shards",
    wiki: "Spirit_shards",
    image: "Spirit_shards.png",
    aliases: ["spirit shard"],
  },
  {
    name: "Pouch",
    wiki: "Pouch",
    image: "Pouch.png",
    aliases: ["empty pouch", "empty pouches"],
  },
  { name: "Raw chicken", wiki: "Raw_chicken", image: "Raw_chicken.png" },
  {
    name: "Granite crab pouch",
    wiki: "Granite_crab_pouch",
    image: "Granite_crab_pouch.png",
    aliases: ["granite crab pouches"],
  },
  {
    name: "Dreadfowl pouch",
    wiki: "Dreadfowl_pouch",
    image: "Dreadfowl_pouch.png",
    aliases: ["dreadfowl pouches"],
  },
  // https://runescape.wiki/w/Spirit_wolf_pouch
  {
    name: "Spirit wolf pouch",
    wiki: "Spirit_wolf_pouch",
    image: "Spirit_wolf_pouch.png",
    aliases: ["spirit wolf pouches"],
  },
  { name: "Wolf bones", wiki: "Wolf_bones", image: "Wolf_bones.png" },
  { name: "Chargebow", wiki: "Chargebow", image: "Chargebow.png" },
  { name: "Staff of air", wiki: "Staff_of_air", image: "Staff_of_air.png" },
];

// Combat settings and monsters: https://runescape.wiki/w/Free-to-play_melee_training
// https://runescape.wiki/w/Burthorpe_Troll_Cave https://runescape.wiki/w/Lumbridge_Catacombs
// https://secure.runescape.com/m=news/the-blood-pact-and-lumbridge-catacombs
export const COMBAT_SKILLS: SkillRecord[] = [
  {
    name: "Attack",
    category: "Combat",
    icon: "Attack.png",
    description: "Train melee accuracy and unlock stronger melee weapons.",
    goal: 20,
    payoff: "Equip higher-tier melee weapons and improve hit chance.",
    wiki: "Attack",
    trainingWiki: "Free-to-play_melee_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Learn melee accuracy",
        locations: ["Burthorpe Troll Cave", "Lumbridge"],
        method:
          "Select Attack experience in combat settings. Fight troll chuckers in the north of the cave, or chickens at the farm north-east of Lumbridge. Ask the cave tutors about ability bars.",
        supplies: ["A melee weapon appropriate to your Attack level", "Food"],
      },
      {
        from: 20,
        to: 50,
        title: "Upgrade and keep fighting",
        locations: ["Lumbridge Catacombs", "Burthorpe Troll Cave"],
        method:
          "After The Blood Pact, try the weak creatures in the lower catacombs; otherwise continue with cave trolls. Upgrade your melee weapon when your Attack level permits, and retreat if needed.",
        supplies: ["A level-appropriate melee weapon", "Food"],
      },
    ],
    membersNote:
      "The same basic training is available without membership; Attack reaches 120.",
  },
  {
    name: "Defence",
    category: "Combat",
    icon: "Defence.png",
    description:
      "Improve survivability and unlock protective armour across combat styles.",
    goal: 20,
    payoff: "Wear stronger armour and withstand harder encounters.",
    wiki: "Defence",
    trainingWiki: "Free-to-play_melee_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Choose defensive experience",
        locations: ["Burthorpe Troll Cave", "Lumbridge"],
        method:
          "Set combat experience to Defence, using a style and weapon you can wield. Practise on cave trolls or Lumbridge farm chickens; check your remaining life points.",
        supplies: ["Appropriate weapon and armour", "Food"],
      },
      {
        from: 20,
        to: 50,
        title: "Practise in the catacombs",
        locations: ["Lumbridge Catacombs", "Burthorpe Troll Cave"],
        method:
          "Complete The Blood Pact before entering the lower catacombs, then fight its weaker monsters. The cave remains an unlocked alternative; equip stronger armour as Defence permits.",
        supplies: ["Level-appropriate armour", "Food and a way to leave"],
      },
    ],
    membersNote:
      "Defence can also be trained alongside members Slayer assignments.",
  },
  {
    name: "Strength",
    category: "Combat",
    icon: "Strength.png",
    description: "Develop melee damage through combat and stronger abilities.",
    goal: 20,
    payoff:
      "Improve melee damage while progressing towards stronger abilities.",
    wiki: "Strength",
    trainingWiki: "Free-to-play_melee_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Build melee strength",
        locations: ["Lumbridge", "Burthorpe Troll Cave"],
        method:
          "Choose Strength experience in combat settings. Fight chickens at the farm north-east of Lumbridge or troll chuckers in the cave, using a weapon suited to your Attack level.",
        supplies: ["A suitable melee weapon", "Food"],
      },
      {
        from: 20,
        to: 50,
        title: "Train against weak monsters",
        locations: ["Burthorpe Troll Cave", "Lumbridge Catacombs"],
        method:
          "Keep fighting cave trolls or complete The Blood Pact and use the lower catacombs. Match a melee weapon to a target weakness when possible; improve Attack for weapon upgrades too.",
        supplies: ["A suitable melee weapon", "Food"],
      },
    ],
    membersNote:
      "Strength reaches 120; this is an early training route, not an endgame progression.",
  },
  {
    name: "Constitution",
    category: "Combat",
    icon: "Constitution.png",
    description:
      "Increase maximum life points by fighting with any combat style.",
    goal: 20,
    payoff: "Gain a larger life-point pool for quests and combat.",
    wiki: "Constitution",
    trainingWiki: "Free-to-play_melee_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Gain life points through combat",
        locations: ["Lumbridge", "Burthorpe Troll Cave"],
        method:
          "Fight chickens north-east of Lumbridge or trolls in the cave using your preferred combat style. Constitution experience accompanies combat; monitor health rather than assuming enemies are harmless.",
        supplies: ["Weapons for your chosen style", "Food"],
      },
      {
        from: 20,
        to: 50,
        title: "Combine combat with other goals",
        locations: ["Lumbridge Catacombs", "Burthorpe Troll Cave"],
        method:
          "Use the lower catacombs after The Blood Pact, or stay with trolls if the quest is unfinished. Train your chosen combat skill at the same time and bank between trips.",
        supplies: ["Level-appropriate combat equipment", "Food"],
      },
    ],
    membersNote:
      "Members can combine Constitution training with Slayer when suitably prepared.",
  },
  // https://runescape.wiki/w/Free-to-play_Ranged_training
  {
    name: "Ranged",
    category: "Combat",
    icon: "Ranged.png",
    description: "Fight from a distance with ranged weapons and abilities.",
    goal: 20,
    payoff: "Unlock stronger ranged weapons and abilities.",
    wiki: "Ranged",
    trainingWiki: "Free-to-play_Ranged_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Practise ranged attacks",
        locations: ["Burthorpe Troll Cave", "Lumbridge"],
        method:
          "Fight cave trolls or chickens at the farm north-east of Lumbridge. A chargebow needs no ammunition; other bows need compatible ammunition. Set combat experience to Ranged.",
        supplies: ["Chargebow or another suitable ranged weapon", "Food"],
      },
      {
        from: 20,
        to: 50,
        title: "Upgrade your ranged setup",
        locations: ["Lumbridge Catacombs", "Burthorpe Troll Cave"],
        method:
          "Fight cave trolls or, after The Blood Pact, the weaker lower-catacomb creatures. Upgrade your weapon and compatible ammunition as your level allows; use ranged armour suited to your Defence.",
        supplies: [
          "Level-appropriate ranged weapon",
          "Compatible ammunition if required",
          "Food",
        ],
      },
    ],
    membersNote:
      "Ranged reaches 120; stronger enemies and equipment become available to members.",
  },
  // 2026 altar update: https://runescape.wiki/w/Chaos_altar_(Prayer)
  // https://runescape.wiki/w/Altar https://runescape.wiki/w/Free-to-play_Prayer_training
  // https://secure.runescape.com/m=news/patch-notes-early-game-rebalance
  {
    name: "Prayer",
    category: "Combat",
    icon: "Prayer.png",
    description:
      "Offer remains to gain prayers that support combat and survival.",
    goal: 20,
    payoff: "Unlock useful prayers and increase your prayer-point pool.",
    wiki: "Prayer",
    trainingWiki: "Free-to-play_Prayer_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Collect and offer remains",
        locations: ["Lumbridge"],
        method:
          "Collect bones from chickens at the farm north-east of Lumbridge and offer them at the Lumbridge church altar. Most surface altars offer 50% more experience than burying; you can also bury remains on the spot.",
        supplies: ["Bones from combat"],
      },
      {
        from: 20,
        to: 50,
        title: "Choose affordable remains",
        locations: ["Lumbridge", "Falador"],
        method:
          "Continue collecting bones, or use big bones if you have a supply. Offer them at Lumbridge church or the White Knights’ Castle altar in Falador; compare costs before buying supplies.",
        supplies: ["Bones or big bones"],
      },
    ],
    membersNote:
      "Members have additional altar options; check their individual access requirements.",
  },
  // https://runescape.wiki/w/Free-to-play_Magic_training
  {
    name: "Magic",
    category: "Combat",
    icon: "Magic.png",
    description: "Use spells for combat, travel and utility.",
    goal: 20,
    payoff: "Unlock spells and improve magical combat.",
    wiki: "Magic",
    trainingWiki: "Free-to-play_Magic_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Cast your first combat spells",
        locations: ["Lumbridge", "Burthorpe Troll Cave"],
        method:
          "Select a combat spell and Magic experience, then fight Lumbridge farm chickens or cave trolls. A staff of air supplies air runes for air spells; higher-tier weapons improve damage.",
        supplies: [
          "Staff of air or another magic weapon",
          "Runes required by your chosen spell",
          "Food",
        ],
      },
      {
        from: 20,
        to: 50,
        title: "Match spells to enemies",
        locations: ["Lumbridge Catacombs", "Burthorpe Troll Cave"],
        method:
          "Fight cave trolls or complete The Blood Pact for the lower catacombs. Match your spell to the target’s elemental weakness, use magic armour, and upgrade your weapon when possible.",
        supplies: [
          "A level-appropriate magic weapon",
          "Runes required by your chosen spell",
          "Food",
        ],
      },
    ],
    membersNote:
      "Magic reaches 120; members can additionally unlock other spellbooks through their quests.",
  },
  // https://runescape.wiki/w/Slayer_training https://runescape.wiki/w/Jacquelyn
  {
    name: "Slayer",
    category: "Combat",
    icon: "Slayer.png",
    description:
      "Complete assignments from Slayer masters to learn to fight specialised creatures.",
    goal: 20,
    payoff:
      "Unlock new creatures and assignments as Slayer and combat levels rise.",
    freeToPlayCap: 5,
    wiki: "Slayer",
    trainingWiki: "Slayer_training",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Try a Slayer assignment",
        locations: ["Lumbridge"],
        method:
          "Ask Jacquelyn in Lumbridge for an assignment and kill the assigned creatures. Check their location, combat danger and any special equipment before leaving; free players can train only to level 5.",
        supplies: ["Combat equipment appropriate to the assignment", "Food"],
      },
      {
        from: 5,
        to: 30,
        title: "Continue assignments",
        locations: ["Lumbridge"],
        members: true,
        method:
          "Return to Jacquelyn for another assignment. Use her guidance to locate the assigned monsters and check their requirements; choose a safer task or resupply if the target is beyond your combat ability.",
        supplies: [
          "Suitable combat equipment",
          "Food and any required Slayer equipment",
        ],
      },
      {
        from: 30,
        to: 60,
        title: "Consider a stronger master",
        locations: ["Lumbridge"],
        members: true,
        method:
          "Continue with Jacquelyn or, at combat level 30, consider Vannaka in Edgeville Dungeon. His tasks can be harder: check each creature and its access before travelling, and return to Jacquelyn if needed.",
        supplies: [
          "Task-specific combat equipment",
          "Food and an escape route",
        ],
      },
    ],
    membersNote:
      "The free trial ends at level 5. Slayer assignments depend on combat level and may require special equipment or quests.",
  },
  // https://runescape.wiki/w/Summoning_training https://runescape.wiki/w/Wolf_Whistle
  // https://runescape.wiki/w/Dreadfowl_pouch
  {
    name: "Summoning",
    category: "Combat",
    icon: "Summoning.png",
    description: "Infuse pouches at an obelisk to unlock familiars.",
    goal: 16,
    payoff: "Create familiars for combat and utility.",
    freeToPlayCap: 5,
    wiki: "Summoning",
    trainingWiki: "Summoning_training",
    stages: [
      {
        from: 1,
        to: 5,
        title: "First Summoning pouches",
        locations: ["Pikkupstix's Summoning Shop"],
        method:
          "Wolf Whistle is optional and grants experience and gold charms. From level 1, infuse a spirit wolf pouch at Pikkupstix’s obelisk with an empty pouch, 7 spirit shards, a gold charm and wolf bones. At level 4, dreadfowl pouches use 8 spirit shards and raw chicken instead of wolf bones.",
        supplies: [
          "Gold charm",
          "Empty pouch",
          "Spirit shards",
          "Wolf bones",
          "Raw chicken if making dreadfowl pouches",
        ],
      },
      {
        from: 5,
        to: 16,
        title: "Continue infusing pouches",
        locations: ["Pikkupstix's Summoning Shop"],
        members: true,
        method:
          "Continue making dreadfowl pouches at the obelisk with collected charms and ingredients. Pikkupstix sells empty pouches and spirit shards; budget for the ingredients and bank between trips.",
        supplies: [
          "Gold charms",
          "Empty pouches",
          "Spirit shards",
          "Raw chicken",
        ],
      },
      {
        from: 16,
        to: 40,
        title: "Infuse granite crabs",
        locations: ["Pikkupstix's Summoning Shop"],
        members: true,
        method:
          "At level 16, use the obelisk to infuse granite crab pouches with a gold charm, empty pouch, spirit shards and iron ore. Collect charms through combat and bank between batches.",
        supplies: ["Gold charms", "Empty pouches", "Spirit shards", "Iron ore"],
      },
    ],
    membersNote:
      "Free players can train only to level 5; membership is required to progress beyond the trial.",
  },
  // https://runescape.wiki/w/Necromancy_training https://runescape.wiki/w/City_of_Um
  // https://secure.runescape.com/m=news/quest-preparation---ode-of-the-devourer
  // https://secure.runescape.com/m=news/quick-guide-necromancy-level-milestones
  {
    name: "Necromancy",
    category: "Combat",
    icon: "Necromancy.png",
    description:
      "Learn a distinct combat style and perform rituals in the City of Um.",
    goal: 20,
    payoff: "Unlock Necromancy abilities and progress the Well of Souls.",
    freeToPlayCap: 20,
    wiki: "Necromancy",
    trainingWiki: "Necromancy_training",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Enter the Underworld",
        locations: ["City of Um", "Lumbridge"],
        method:
          "Enter the portal north of Draynor lodestone to start Necromancy!, and complete it before training. Practise the new style on chickens at the Lumbridge farm; use the City of Um ritual site to learn rituals and gather souls for talents.",
        supplies: ["Necromancy equipment from the introductory quest", "Food"],
      },
      {
        from: 20,
        to: 40,
        title: "Upgrade with Kili",
        locations: ["City of Um", "Lumbridge Catacombs"],
        members: true,
        method:
          "At level 20, claim your first Deathwarden robes from Sostratus if needed and complete Kili Row before upgrading your weapons; the tier 20 weapon upgrades also require 15 Smithing. Continue combat against catacomb skeletons after completing The Blood Pact, or return to easy Lumbridge farm targets.",
        supplies: [
          "Necromancy combat equipment",
          "Food",
          "Materials required for Kili’s upgrades",
        ],
      },
      {
        from: 40,
        to: 70,
        title: "Develop talents and equipment",
        locations: ["City of Um", "Lumbridge Catacombs"],
        members: true,
        method:
          "Continue fighting catacomb skeletons after The Blood Pact, and return to Um for communion rituals and talents. Complete Kili’s tasks and check the crafting and ritual requirements before each equipment upgrade.",
        supplies: [
          "Upgraded Necromancy equipment when available",
          "Food",
          "Materials for your chosen ritual",
        ],
      },
    ],
    membersNote:
      "Free players can train to level 20. Continued training and Kili Row require membership.",
  },
];
