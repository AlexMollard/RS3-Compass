import type { ItemReference, SkillRecord } from "./data.ts";
import type { LocationRecord } from "./locations.ts";

export const SUPPORT_LOCATIONS: Record<string, LocationRecord> = {
  "Burthorpe Agility Course": {
    name: "Burthorpe Agility Course",
    wiki: "Burthorpe Agility Course",
    image: "Burthorpe_Agility_Course.png",
    members: false,
    summary:
      "A beginner course in north-east Burthorpe, beside Drill Sergeant Hartman.",
  },
  Runespan: {
    name: "Runespan",
    wiki: "Runespan",
    image: "Runespan_lower_level.png",
    members: false,
    summary:
      "Enter the lower-level portal at the top of Wizards’ Tower, south of Draynor.",
    access:
      "Talk to Wizard Finix. Free players can use the lower level and part of the middle level.",
  },
  Rimmington: {
    name: "Rimmington",
    wiki: "Rimmington",
    image: "Rimmington_view.png",
    members: false,
    summary:
      "The house portal, estate agent and housing facilities are in Rimmington, west of Port Sarim.",
  },
  Daemonheim: {
    name: "Daemonheim",
    wiki: "Daemonheim",
    image: "Daemonheim_entrance.png",
    members: false,
    summary:
      "The dungeon entrance and Dungeoneering tutor are at the castle on the eastern peninsula.",
    access:
      "Take the ferry from Al Kharid or use the ring of kinship after obtaining it from the tutor.",
  },
  "Invention Guild": {
    name: "Invention Guild",
    wiki: "Invention Guild",
    image: "Invention_Guild_entrance.png",
    members: true,
    summary:
      "Doc and the inventor’s workbench are north-east of Falador, by the Dwarven Mine entrance.",
    access:
      "Requires membership and level 80 Crafting, Divination and Smithing.",
  },
  "Kharid-et Dig Site": {
    name: "Kharid-et Dig Site",
    wiki: "Kharid-et Dig Site",
    image: "Kharid-et.png",
    members: false,
    summary:
      "A Zarosian excavation east of Al Kharid; the exterior contains venator remains.",
  },
  // Exact scene sources: /w/Archaeology_Guild, /w/Barbarian_Outpost_Agility_Course, and each linked wisp article.
  "Archaeology Guild": {
    name: "Archaeology Guild",
    wiki: "Archaeology_Guild",
    image: "Archaeology_Guild.png",
    members: false,
    summary:
      "The tutorial, screening station and restoration workbenches are at the campus east of Varrock.",
    access: "Speak to Acting Guildmaster Reiniger to begin the tutorial.",
  },
  "Barbarian Outpost Agility Course": {
    name: "Barbarian Outpost Agility Course",
    wiki: "Barbarian_Outpost_Agility_Course",
    image: "Barbarian_Outpost_Agility_Course.png",
    members: true,
    summary:
      "An obstacle course at the Barbarian Outpost, north-east of Baxtorian Falls.",
    access:
      "Requires 35 Agility and completion of Bar Crawl. Failed obstacles can cause damage.",
  },
  "Pale wisp colony": {
    name: "Pale wisp colony",
    wiki: "Pale_wisp",
    image: "Pale_wisp_colony.png",
    members: false,
    summary:
      "Harvest pale wisps and convert memories at the rift south of Draynor jail.",
    access: "Free Divination experience stops at level 5.",
  },
  "Flickering wisp colony": {
    name: "Flickering wisp colony",
    wiki: "Flickering_wisp",
    image: "Flickering_wisp_colony.png",
    members: true,
    summary: "A level 10 colony by the standing stones north of Falador.",
  },
  "Bright wisp colony": {
    name: "Bright wisp colony",
    wiki: "Bright_wisp",
    image: "Bright_wisp_colony.png",
    members: true,
    summary: "A level 20 colony just north-west of the Archaeology Guild.",
    access:
      "Walk south from Varrock’s east gate, or use the Archaeology journal after its tutorial.",
  },
};

export const SUPPORT_ITEMS: ItemReference[] = [
  {
    name: "Bronze mattock",
    wiki: "Bronze mattock",
    image: "Bronze_mattock.png",
  },
  {
    name: "Crude wooden chair",
    wiki: "Crude wooden chair",
    image: "Crude_wooden_chair.png",
    aliases: ["crude wooden chairs"],
  },
  { name: "Iron mattock", wiki: "Iron mattock", image: "Iron_mattock.png" },
  {
    name: "Ring of kinship",
    wiki: "Ring of kinship",
    image: "Ring_of_kinship.png",
  },
  {
    name: "Augmentor",
    wiki: "Augmentor",
    image: "Augmentor.png",
    aliases: ["augmentors"],
  },
  {
    name: "Equipment siphon",
    wiki: "Equipment siphon",
    image: "Equipment_siphon.png",
    aliases: ["equipment siphons"],
  },
];

export const SUPPORT_SKILLS: SkillRecord[] = [
  // https://runescape.wiki/w/Burthorpe_Agility_Course and https://runescape.wiki/w/Agility_training
  {
    name: "Agility",
    category: "Support",
    icon: "Agility-icon.png",
    description: "Run obstacle courses to build Agility and unlock shortcuts.",
    goal: 30,
    payoff: "Higher Agility opens more courses and shortcuts.",
    freeToPlayCap: 5,
    wiki: "Agility",
    trainingWiki: "Agility_training",
    membersNote:
      "Free players can train to level 5; further progress requires membership.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Burthorpe course trial",
        locations: ["Burthorpe Agility Course"],
        method:
          "Start beside Drill Sergeant Hartman in north-east Burthorpe. Complete every obstacle in order and return to the start for the lap bonus.",
        supplies: [],
      },
      {
        from: 5,
        to: 35,
        title: "Continue the beginner course",
        locations: ["Burthorpe Agility Course"],
        members: true,
        method:
          "Repeat complete laps of the Burthorpe course. Membership lets you keep earning experience beyond the free trial.",
        supplies: [],
      },
      {
        from: 35,
        to: 60,
        title: "Barbarian Outpost course",
        locations: ["Barbarian Outpost Agility Course"],
        members: true,
        method:
          "Travel to the Barbarian Outpost north-east of Baxtorian Falls. Complete Bar Crawl and reach 35 Agility before entering the course; bring food because failed obstacles can cause damage.",
        supplies: ["Food for failed obstacles"],
      },
    ],
  },
  // https://runescape.wiki/w/Thieving_training and https://runescape.wiki/w/Man
  {
    name: "Thieving",
    category: "Support",
    icon: "Thieving-icon.png",
    description: "Pick pockets and unlock more demanding theft targets.",
    goal: 40,
    payoff: "Higher levels open new targets and theft activities.",
    freeToPlayCap: 5,
    wiki: "Thieving",
    trainingWiki: "Thieving_training",
    membersNote: "The free trial stops at level 5; members can continue.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Practice pickpocketing",
        locations: ["Lumbridge"],
        method:
          "Pickpocket men or women around Lumbridge. A failed attempt can stun and damage you, so keep an eye on your health.",
        supplies: ["Food"],
      },
      {
        from: 5,
        to: 10,
        title: "Continue pickpocketing",
        locations: ["Lumbridge"],
        members: true,
        method:
          "Continue on men and women around Lumbridge until level 10. Clear your inventory as it fills and heal after failed attempts.",
        supplies: ["Food"],
      },
      {
        from: 10,
        to: 40,
        title: "Pickpocket farmers",
        locations: ["Draynor Village"],
        members: true,
        method:
          "Pickpocket farmers around the fields north of Draynor Village. At level 38, try the master farmer in Draynor for a higher-level target; bank the loot regularly.",
        supplies: ["Food", "Inventory space"],
      },
      {
        from: 40,
        to: 62,
        title: "Pickpocket guards",
        locations: ["Falador"],
        members: true,
        method:
          "Pickpocket guards around Falador. Watch your health and switch targets or resume after being caught.",
        supplies: ["Food", "Inventory space"],
      },
    ],
  },
  // https://runescape.wiki/w/Runespan and https://runescape.wiki/w/Free-to-play_Runecrafting_training
  // https://secure.runescape.com/m=news/the-runespan
  // https://secure.runescape.com/m=news/110-runecrafting---new-skilling-update
  {
    name: "Runecrafting",
    category: "Artisan",
    icon: "Runecrafting-icon.png",
    description: "Craft runes at altars or siphon energy in Runespan.",
    goal: 50,
    payoff: "Unlock higher-level runes and Runespan nodes.",
    wiki: "Runecrafting",
    trainingWiki: "Free-to-play_Runecrafting_training",
    membersNote:
      "Free players can train Runecrafting to 110. Membership opens more Runespan islands and nodes.",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Enter the lower Runespan",
        locations: ["Runespan"],
        method:
          "Go upstairs in Wizards’ Tower south of Draynor, speak to Wizard Finix and enter the low-level portal. Collect floating essence, siphon creatures to replenish it, and use accessible nodes such as cyclones. For runes you can keep, craft at runecrafting altars instead.",
        supplies: ["Empty inventory space"],
      },
      {
        from: 20,
        to: 110,
        title: "Siphon higher nodes",
        locations: ["Runespan"],
        method:
          "Siphon fleshy growths from level 20 and fire storms from 27 when available. At 33 the middle level opens, but free players are restricted to part of it. Runes gathered here are exchanged for points on exit, not kept.",
        supplies: ["Empty inventory space"],
      },
    ],
  },
  // https://runescape.wiki/w/There%27s_No_Place_Like_Home... and https://runescape.wiki/w/Crude_wooden_chair
  {
    name: "Construction",
    category: "Artisan",
    icon: "Construction-icon.png",
    description: "Build furniture and improve your player-owned house.",
    goal: 40,
    payoff: "Unlock more furniture and house options.",
    freeToPlayCap: 20,
    wiki: "Construction",
    trainingWiki: "Construction_training",
    membersNote:
      "Free players can train to 20; membership is needed beyond the trial.",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Build your first furniture",
        locations: ["Rimmington"],
        method:
          "Start There’s No Place Like Home by speaking to Alfred Stonemason in Rimmington; follow the tutorial to obtain a house and learn its furniture workbench. Make crude wooden chairs with two planks and two steel nails each; use the tool-belt hammer and saw.",
        supplies: ["Planks", "Steel nails"],
      },
      {
        from: 20,
        to: 40,
        title: "Continue furnishing",
        locations: ["Rimmington"],
        members: true,
        method:
          "After the housing tutorial, use the furniture workbench in your house and choose furniture your level and materials permit. Check the recipe before buying supplies; building consumes materials.",
        supplies: ["Planks", "Steel nails"],
      },
    ],
  },
  // https://runescape.wiki/w/Dungeoneering and https://runescape.wiki/w/Dungeoneering/Training
  {
    name: "Dungeoneering",
    category: "Support",
    icon: "Dungeoneering-icon.png",
    description:
      "Explore procedurally generated Daemonheim floors alone or with a party.",
    goal: 40,
    payoff: "Open additional floors and earn tokens for rewards.",
    wiki: "Dungeoneering",
    trainingWiki: "Dungeoneering/Training",
    membersNote:
      "Daemonheim is free to play, but some floors, rooms and rewards require membership.",
    stages: [
      {
        from: 1,
        to: 11,
        title: "Learn the frozen floors",
        locations: ["Daemonheim"],
        method:
          "Take the ferry from Al Kharid to Daemonheim and speak to the tutor for a ring of kinship. Form a party using the ring, enter the dungeon and clear the highest available floor; solve rooms, find keys and defeat the boss.",
        supplies: ["Ring of kinship", "Leave outside equipment in the bank"],
      },
      {
        from: 11,
        to: 40,
        title: "Advance and reset prestige",
        locations: ["Daemonheim"],
        method:
          "Unlock and complete new floors as your level rises. Once you have completed all accessible floors, reset your ring’s progress to build prestige, then clear floors again. Choose a dungeon complexity you can manage.",
        supplies: ["Ring of kinship"],
      },
    ],
  },
  // https://runescape.wiki/w/Divination_training and https://runescape.wiki/w/Pale_wisp
  {
    name: "Divination",
    category: "Gathering",
    icon: "Divination-icon.png",
    description: "Harvest wisps and convert memories at energy rifts.",
    goal: 30,
    payoff: "Unlock stronger wisps and useful divine energy.",
    freeToPlayCap: 5,
    wiki: "Divination",
    trainingWiki: "Divination_training",
    membersNote:
      "Free players can train to level 5; further Divination training requires membership.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Pale wisps",
        locations: ["Pale wisp colony"],
        method:
          "Walk south-east from Draynor Village to the Divination camp south of the jail. Harvest pale wisps, gather from the resulting spring, then convert your memories at the nearby rift.",
        supplies: ["Empty inventory space"],
      },
      {
        from: 5,
        to: 10,
        title: "Continue pale wisps",
        locations: ["Pale wisp colony"],
        members: true,
        method:
          "Continue harvesting pale springs south of Draynor jail and converting memories at the rift until level 10.",
        supplies: ["Empty inventory space"],
      },
      {
        from: 10,
        to: 20,
        title: "Flickering wisps",
        locations: ["Flickering wisp colony"],
        members: true,
        method:
          "Go to the standing stones north of Falador for the flickering wisp colony. Harvest the springs and convert memories at its rift.",
        supplies: ["Empty inventory space"],
      },
      {
        from: 20,
        to: 30,
        title: "Bright wisps",
        locations: ["Bright wisp colony"],
        members: true,
        method:
          "Find bright wisps just north-west of the Archaeology Guild, between Varrock and the Dig Site. Harvest the springs and convert memories at the colony rift.",
        supplies: ["Empty inventory space"],
      },
    ],
  },
  // https://runescape.wiki/w/Invention_training
  {
    name: "Invention",
    category: "Elite",
    icon: "Invention-icon.png",
    description:
      "A members-only elite skill unlocked with 80 Crafting, 80 Divination and 80 Smithing.",
    goal: 27,
    payoff:
      "Augment equipment, discover blueprints and unlock equipment siphons.",
    freeToPlayCap: 0,
    wiki: "Invention",
    trainingWiki: "Invention_training",
    membersNote:
      "Invention cannot be trained free to play. Train Crafting, Divination and Smithing to 80, then speak to Doc north-east of Falador and complete the tutorial.",
    stages: [
      {
        from: 1,
        to: 4,
        title: "Complete Doc’s tutorial",
        locations: ["Invention Guild"],
        members: true,
        method:
          "With all three prerequisite skills at 80, speak to Doc at the Invention Guild north-east of Falador. Complete the tutorial and its discoveries at the workbench.",
        supplies: ["Level 80 Crafting, Divination and Smithing"],
      },
      {
        from: 4,
        to: 27,
        title: "Level augmented equipment",
        locations: ["Invention Guild"],
        members: true,
        method:
          "Discover the maximum equipment level 5 blueprint at the workbench. Use an augmentor on suitable augmentable combat equipment, use it in combat to gain item levels, then disassemble it for Invention experience. Disassembly destroys the equipment and augmentor.",
        supplies: ["Augmentor", "Replaceable augmentable combat equipment"],
      },
      {
        from: 27,
        to: 60,
        title: "Discover siphoning",
        locations: ["Invention Guild"],
        members: true,
        method:
          "Discover the equipment siphon and equipment level 10 blueprints. Level augmented equipment in combat and siphon it to gain Invention experience without destroying the item; return to the workbench for newly unlocked discoveries.",
        supplies: ["Equipment siphon", "Augmented equipment"],
      },
    ],
  },
  // https://runescape.wiki/w/Archaeology_training and https://runescape.wiki/w/Kharid-et_Dig_Site
  // https://secure.runescape.com/m=news/archaeology-information-overview
  {
    name: "Archaeology",
    category: "Gathering",
    icon: "Archaeology-icon.png",
    description:
      "Excavate damaged artefacts, restore them and complete collections.",
    goal: 40,
    payoff: "Discover new dig sites, collections and qualifications.",
    freeToPlayCap: 20,
    wiki: "Archaeology",
    trainingWiki: "Archaeology_training",
    membersNote:
      "Free players can train to 20 at the Archaeology Campus and Kharid-et; membership is required beyond the trial.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Archaeology tutorial",
        locations: ["Archaeology Guild"],
        method:
          "Go to the Archaeology Campus east of Varrock and speak to Acting Guildmaster Reiniger. Complete the tutorial, excavate its site, screen soil and restore the damaged artefact as instructed.",
        supplies: ["Bronze mattock"],
      },
      {
        from: 5,
        to: 20,
        title: "Kharid-et exterior",
        locations: ["Kharid-et Dig Site"],
        method:
          "After the tutorial, travel east of Al Kharid to Kharid-et and excavate venator remains. Deposit materials in the cart, screen soil at the campus and restore artefacts at a workbench. An iron mattock is usable from level 10.",
        supplies: [
          "Bronze mattock",
          "Iron mattock at level 10",
          "Inventory space",
        ],
      },
      {
        from: 20,
        to: 40,
        title: "Continue Kharid-et",
        locations: ["Kharid-et Dig Site"],
        members: true,
        method:
          "Excavate castra debris in the barracks (level 17), then prodomoi remains at level 24. Restore artefacts with the matching materials and hand in collections; check the site’s access requirements before entering deeper areas.",
        supplies: ["Mattock appropriate to your level", "Inventory space"],
      },
    ],
  },
];
