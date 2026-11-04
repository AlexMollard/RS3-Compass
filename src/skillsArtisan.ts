import type { ItemReference, SkillRecord } from "./data.ts";
import type { LocationRecord } from "./locations.ts";

// Sources: https://runescape.wiki/w/Free-to-play_Cooking_training and /w/Taverley
// /w/Free-to-play_Woodcutting_training and /w/Fletching (2026 re-tiered levels)
// /w/Free-to-play_Firemaking_training and /w/Free-to-play_Crafting_training
// /w/Unfinished_potions, /w/Potato_patch, /w/Falador_farm and /w/Bird_snare
// /w/Taverley_Hunter_area, /w/Feldip_Hunter_area and /w/Free-to-play
export const ARTISAN_SKILLS: SkillRecord[] = [
  {
    name: "Cooking",
    category: "Artisan",
    icon: "Cooking-icon.png",
    goal: 99,
    description:
      "Cook your catch into food; the required Cooking level and the level needed to catch it are not always the same.",
    payoff: "Prepare food for combat and quests.",
    wiki: "Cooking",
    trainingWiki: "Free-to-play Cooking training",
    membersNote:
      "Cooking is available throughout free play; members have additional foods and training spots.",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Cook the local catch",
        locations: ["Taverley"],
        method:
          "Fish raw crayfish at the lake north of Taverley, or bring a supply to the range beside Mess Sergeant Ramsey in the Pick and Lute. Expect some burns.",
        supplies: ["Raw crayfish"],
      },
      {
        from: 20,
        to: 40,
        title: "River fish",
        locations: ["Lumbridge"],
        method:
          "Cook raw trout on a fire beside the east-bank river fishing spots. Catching them yourself needs 20 Fishing; at 25 Cooking you can also cook raw salmon, caught with 30 Fishing.",
        supplies: ["Raw trout", "Raw salmon", "Logs"],
      },
      {
        from: 40,
        to: 99,
        title: "Cook lobsters",
        locations: ["Taverley"],
        method:
          "Bring raw lobster to Ramsey's range in the Pick and Lute, banking between batches. Burns are common at the minimum level; continue with trout or salmon if supplies are scarce.",
        supplies: ["Raw lobster"],
      },
    ],
  },
  {
    name: "Woodcutting",
    category: "Gathering",
    icon: "Woodcutting-icon.png",
    goal: 110,
    description:
      "Cut trees for materials used in Firemaking and Fletching; current tree tiers differ from older guides.",
    payoff: "Supply logs and unlock higher-tier trees.",
    wiki: "Woodcutting",
    trainingWiki: "Free-to-play Woodcutting training",
    membersNote:
      "The skill reaches 110 in free play; members can access additional trees and equipment.",
    stages: [
      {
        from: 1,
        to: 10,
        title: "Regular trees",
        locations: ["Taverley"],
        method:
          "Cut the ordinary trees in Ewean's Grove north-east of Taverley. The starter bronze hatchet is already on the tool belt; bank the logs or use them nearby.",
        supplies: ["Bronze hatchet"],
      },
      {
        from: 10,
        to: 20,
        title: "Oak trees",
        locations: ["Taverley"],
        method:
          "Cut the oaks in Ewean's Grove. Upgrade the hatchet when your Woodcutting level allows; it can work from the tool belt without being wielded.",
        supplies: ["A suitable hatchet"],
      },
      {
        from: 20,
        to: 70,
        title: "Draynor willows",
        locations: ["Draynor Village"],
        method:
          "Cut the coastal willows south-west of Draynor bank and deposit your harvest there. Willow trees unlock at 20 Woodcutting, not 30.",
        supplies: ["A suitable hatchet"],
      },
      {
        from: 70,
        to: 110,
        title: "Lumbridge yews",
        locations: ["Lumbridge"],
        method:
          "Cut the yews near Lumbridge Market and bank your harvest. Willow remains a practical alternative if these trees are crowded.",
        supplies: ["A suitable hatchet"],
      },
    ],
  },
  {
    name: "Fletching",
    category: "Artisan",
    icon: "Fletching-icon.png",
    goal: 110,
    description:
      "Shape logs into bows and prepare ammunition; Fletching is a full free-to-play skill.",
    payoff: "Make ranged weapons and ammunition from gathered materials.",
    wiki: "Fletching",
    trainingWiki: "Free-to-play Fletching training",
    membersNote:
      "Free players can train to 110, though some individual high-tier recipes are members-only.",
    stages: [
      {
        from: 1,
        to: 10,
        title: "Shafts and shortbows",
        locations: ["Lumbridge Castle"],
        method:
          "Use the tool-belt knife on logs to make shafts or a shortbow. Add a bowstring to finish the bow; the castle bank supports repeated batches.",
        supplies: ["Knife", "Logs", "Bowstring if stringing bows"],
      },
      {
        from: 10,
        to: 20,
        title: "Oak shortbows",
        locations: ["Lumbridge Castle"],
        method:
          "Use oak logs with the knife to cut oak shortbows, then string them if desired. The current requirement is 10 Fletching.",
        supplies: ["Oak logs", "Knife", "Bowstring if stringing bows"],
      },
      {
        from: 20,
        to: 40,
        title: "Willow shortbows",
        locations: ["Draynor Village"],
        method:
          "Cut willow logs into willow shortbows beside Draynor bank, and string the bows separately for more experience.",
        supplies: ["Willow logs", "Knife", "Bowstring if stringing bows"],
      },
      {
        from: 40,
        to: 110,
        title: "Maple shortbows",
        locations: ["Lumbridge Castle"],
        method:
          "At the castle bank, cut maple logs into maple shortbows and optionally string them. These remain a free-play option at higher levels; check the skill guide for later unlocks.",
        supplies: ["Maple logs", "Knife", "Bowstring if stringing bows"],
      },
    ],
  },
  {
    name: "Firemaking",
    category: "Artisan",
    icon: "Firemaking-icon.png",
    goal: 110,
    description:
      "Light fires or feed a bonfire with logs gathered through Woodcutting.",
    payoff: "Make cooking fires and unlock higher-tier burning materials.",
    wiki: "Firemaking",
    trainingWiki: "Free-to-play Firemaking training",
    membersNote:
      "Firemaking reaches 110 in free play; members have extra activities and materials.",
    stages: [
      {
        from: 1,
        to: 15,
        title: "Start a bonfire",
        locations: ["Lumbridge"],
        method:
          "Light logs in a clear open space near Lumbridge bank, then add more to the fire. Your tool belt already contains a tinderbox.",
        supplies: ["Logs", "Tinderbox"],
      },
      {
        from: 15,
        to: 30,
        title: "Burn oak",
        locations: ["Lumbridge"],
        method:
          "Add oak logs to your own fire near the bank or to an existing bonfire. Withdraw another batch when needed.",
        supplies: ["Oak logs", "Tinderbox"],
      },
      {
        from: 30,
        to: 45,
        title: "Burn willow",
        locations: ["Draynor Village"],
        method:
          "Cut willows south-west of the bank or withdraw willow logs there, then feed an accessible fire in open space.",
        supplies: ["Willow logs", "Tinderbox"],
      },
      {
        from: 45,
        to: 110,
        title: "Burn maple",
        locations: ["Lumbridge"],
        method:
          "Feed maple logs to a bonfire near the bank. At 60 Firemaking, yew logs are another option; gather the logs yourself through Woodcutting.",
        supplies: ["Maple logs", "Yew logs", "Tinderbox"],
      },
    ],
  },
  {
    name: "Crafting",
    category: "Artisan",
    icon: "Crafting-icon.png",
    goal: 110,
    description: "Turn fibres and gems into useful materials and jewellery.",
    payoff: "Produce bowstrings and cut gems for other skills.",
    wiki: "Crafting",
    trainingWiki: "Free-to-play Crafting training",
    membersNote:
      "Crafting reaches 110 in free play; members gain additional recipes and facilities.",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Spin flax",
        locations: ["Lumbridge Castle"],
        method:
          "Spin flax into bowstring at the castle's spinning wheel, one floor below its bank. Collect flax in Taverley or bring it from the bank.",
        supplies: ["Flax"],
      },
      {
        from: 20,
        to: 27,
        title: "Cut sapphires",
        locations: ["Lumbridge Castle"],
        method:
          "Withdraw uncut sapphire and use a chisel to cut gems at the castle bank. Mine common gem rocks for a self-supplied source.",
        supplies: ["Uncut sapphire", "Chisel"],
      },
      {
        from: 27,
        to: 43,
        title: "Cut emeralds",
        locations: ["Lumbridge Castle"],
        method:
          "Use a chisel on uncut emerald at the bank, then deposit the cut gems. This needs no furnace or quest unlock.",
        supplies: ["Uncut emerald", "Chisel"],
      },
      {
        from: 43,
        to: 110,
        title: "Cut diamonds",
        locations: ["Lumbridge Castle"],
        method:
          "Cut uncut diamond with a chisel at a bank; cutting emeralds remains an alternative if diamonds are scarce.",
        supplies: ["Uncut diamond", "Chisel"],
      },
    ],
  },
  {
    name: "Herblore",
    category: "Artisan",
    icon: "Herblore-icon.png",
    goal: 120,
    freeToPlayCap: 5,
    description:
      "Combine herbs and secondary ingredients into potions. The free trial stops at level 5.",
    payoff: "Make practical combat and utility potions.",
    wiki: "Herblore",
    trainingWiki: "Herblore training",
    membersNote:
      "Members can train beyond level 5. Druidic Ritual is optional for these basic recipes, not a prerequisite.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Mix an attack potion",
        locations: ["Taverley"],
        method:
          "Visit Jatix's stall west of the gate for a free starter sample. Combine clean guam with a vial of water, then add eye of newt to make an attack potion.",
        supplies: ["Clean guam", "Vial of water", "Eye of newt"],
      },
      {
        from: 5,
        to: 13,
        title: "Continue basic potions",
        locations: ["Taverley"],
        members: true,
        method:
          "Members can continue mixing attack potions at the bank south of the lodestone. Jatix sells some ingredients; obtain additional herbs separately.",
        supplies: ["Clean guam", "Vial of water", "Eye of newt"],
      },
      {
        from: 13,
        to: 120,
        title: "Mix antipoison",
        locations: ["Taverley"],
        members: true,
        method:
          "Combine clean marrentill and a vial of water, then add unicorn horn dust to make antipoison. Bank between batches; check the training guide for later recipes.",
        supplies: ["Clean marrentill", "Vial of water", "Unicorn horn dust"],
      },
    ],
  },
  {
    name: "Farming",
    category: "Gathering",
    icon: "Farming-icon.png",
    goal: 120,
    freeToPlayCap: 5,
    description:
      "Plant crops, leave them to grow, and return to harvest. Free players can try Farming to level 5.",
    payoff: "Grow produce and ingredients while doing other activities.",
    wiki: "Farming",
    trainingWiki: "Farming training",
    membersNote:
      "Membership permits experience beyond level 5 and opens normal crop progression.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Taverley potato patch",
        locations: ["Taverley potato patch"],
        method:
          "Rake the patch beside Head Farmer Jones and plant three potato seeds. Jones supplies a starter sample and protects this special patch for free; return after the crop grows and harvest it.",
        supplies: ["Rake", "Potato seeds"],
      },
      {
        from: 5,
        to: 15,
        title: "Member allotments",
        locations: ["Falador farm"],
        members: true,
        method:
          "On a members' world, use the two allotments on the farm's north-east edge. Plant potato seeds, return after growth and harvest; unlike the Taverley tutorial patch these crops can become diseased.",
        supplies: ["Potato seeds", "Rake"],
      },
      {
        from: 15,
        to: 120,
        title: "Add a tree run",
        locations: ["Taverley potato patch"],
        members: true,
        method:
          "At 15 Farming, plant an oak sapling in the tree patch south of Farmer Jones. Return once grown to check its health; Alain can watch it for a payment. Continue allotments between visits.",
        supplies: ["Oak sapling"],
      },
    ],
  },
  {
    name: "Hunter",
    category: "Gathering",
    icon: "Hunter-icon.png",
    goal: 110,
    freeToPlayCap: 5,
    description:
      "Set and tend traps to catch creatures; the free Hunter trial reaches level 5.",
    payoff: "Gather hunting products and unlock new creatures.",
    wiki: "Hunter",
    trainingWiki: "Hunter training",
    membersNote:
      "Membership permits training beyond level 5 and access to further hunting areas.",
    stages: [
      {
        from: 1,
        to: 5,
        title: "Taverley bird snares",
        locations: ["Taverley Hunter area"],
        method:
          "Ask Ayleth for a sample bird snare in Ewean's Grove, then set it near crimson swifts north of the stone circle. Check catches promptly, reset sprung snares and leave inventory space for the catch.",
        supplies: ["Bird snare"],
      },
      {
        from: 5,
        to: 19,
        title: "Continue snaring",
        locations: ["Taverley Hunter area"],
        members: true,
        method:
          "On a members' world, continue tending snares among the crimson swifts in Ewean's Grove. Place them where birds can approach and step away after setting them.",
        supplies: ["Bird snare"],
      },
      {
        from: 19,
        to: 110,
        title: "Feldip wagtails",
        locations: ["Feldip Hunter area"],
        members: true,
        method:
          "Catch tropical wagtails west of the hunting expert's hut in the Feldip Hunter area. Attend the snares and clear inventory space; consult the Hunter guide for later creatures.",
        supplies: ["Bird snare"],
      },
    ],
  },
];

// Location images are the files shown by their linked Wiki articles.
export const ARTISAN_LOCATIONS: Record<string, LocationRecord> = {
  Taverley: {
    name: "Taverley",
    wiki: "Taverley",
    image: "Taverley.png",
    members: false,
    summary:
      "A free-play village with a bank, Jatix's stall and Ramsey's range.",
    access:
      "Walk south from Burthorpe; activate the lodestone before relying on its teleport.",
  },
  "Taverley potato patch": {
    name: "Taverley potato patch",
    wiki: "Potato patch",
    image: "Potato_patch_(clean).png",
    members: false,
    summary:
      "Farmer Jones tends this potato-only patch beside the Taverley flax field.",
    access: "The nearby tree patch is a separate members' training option.",
  },
  "Falador farm": {
    name: "Falador farm",
    wiki: "Falador farm",
    image: "Falador_Farm.png",
    members: false,
    summary: "A farm south of Falador, with allotments on its north-east edge.",
    access:
      "The normal allotment training in this guide requires a members' world.",
  },
  "Taverley Hunter area": {
    name: "Taverley Hunter area",
    wiki: "Taverley Hunter area",
    image: "Taverley_hunting_area_kebbit_location.png",
    members: false,
    summary: "Ayleth's camp and birds are north of Taverley's stone circle.",
    access:
      "The bird area is free-play accessible; free Hunter experience stops at level 5.",
  },
  "Feldip Hunter area": {
    name: "Feldip Hunter area",
    wiki: "Feldip Hunter area",
    image: "Feldip_Hunter_area.png",
    members: true,
    summary:
      "Hunter grounds north of Oo'glog with tropical wagtails near the hunting expert.",
    access:
      "Members can walk south through Feldip or use the Oo'glog lodestone once activated; quest transport routes have separate requirements.",
  },
};

// Inventory filenames are taken from the linked Wiki skill, recipe and item pages.
export const ARTISAN_ITEMS: ItemReference[] = [
  {
    name: "Raw lobster",
    wiki: "Raw lobster",
    image: "Raw_lobster.png",
    aliases: ["raw lobsters"],
  },
  {
    name: "Bronze hatchet",
    wiki: "Bronze hatchet",
    image: "Bronze_hatchet.png",
  },
  {
    name: "Hatchet",
    wiki: "Hatchet",
    image: "Bronze_hatchet.png",
    aliases: ["hatchets"],
  },
  { name: "Oak logs", wiki: "Oak logs", image: "Oak_logs.png" },
  { name: "Willow logs", wiki: "Willow logs", image: "Willow_logs.png" },
  { name: "Maple logs", wiki: "Maple logs", image: "Maple_logs.png" },
  { name: "Yew logs", wiki: "Yew logs", image: "Yew_logs.png" },
  { name: "Knife", wiki: "Knife", image: "Knife.png" },
  { name: "Shaft", wiki: "Shaft", image: "Shaft_5.png", aliases: ["shafts"] },
  {
    name: "Shortbow",
    wiki: "Shortbow",
    image: "Shortbow.png",
    aliases: ["shortbows"],
  },
  {
    name: "Oak shortbow",
    wiki: "Oak shortbow",
    image: "Oak_shortbow.png",
    aliases: ["oak shortbows"],
  },
  {
    name: "Willow shortbow",
    wiki: "Willow shortbow",
    image: "Willow_shortbow.png",
    aliases: ["willow shortbows"],
  },
  {
    name: "Maple shortbow",
    wiki: "Maple shortbow",
    image: "Maple_shortbow.png",
    aliases: ["maple shortbows"],
  },
  {
    name: "Bowstring",
    wiki: "Bowstring",
    image: "Bowstring.png",
    aliases: ["bowstrings"],
  },
  { name: "Tinderbox", wiki: "Tinderbox", image: "Tinderbox.png" },
  { name: "Flax", wiki: "Flax", image: "Flax.png" },
  { name: "Chisel", wiki: "Chisel", image: "Chisel.png" },
  {
    name: "Uncut sapphire",
    wiki: "Uncut sapphire",
    image: "Uncut_sapphire.png",
  },
  { name: "Uncut emerald", wiki: "Uncut emerald", image: "Uncut_emerald.png" },
  { name: "Uncut diamond", wiki: "Uncut diamond", image: "Uncut_diamond.png" },
  {
    name: "Sapphire",
    wiki: "Sapphire",
    image: "Sapphire.png",
    aliases: ["sapphires"],
  },
  {
    name: "Emerald",
    wiki: "Emerald",
    image: "Emerald.png",
    aliases: ["emeralds"],
  },
  { name: "Clean guam", wiki: "Clean guam", image: "Clean_guam.png" },
  { name: "Vial of water", wiki: "Vial of water", image: "Vial_of_water.png" },
  { name: "Eye of newt", wiki: "Eye of newt", image: "Eye_of_newt.png" },
  {
    name: "Attack potion",
    wiki: "Attack potion",
    image: "Attack_potion_(3).png",
    aliases: ["attack potions"],
  },
  {
    name: "Clean marrentill",
    wiki: "Clean marrentill",
    image: "Clean_marrentill.png",
  },
  {
    name: "Unicorn horn dust",
    wiki: "Unicorn horn dust",
    image: "Unicorn_horn_dust.png",
  },
  { name: "Antipoison", wiki: "Antipoison", image: "Antipoison_(3).png" },
  {
    name: "Potato seed",
    wiki: "Potato seed",
    image: "Potato_seed_5.png",
    aliases: ["potato seeds"],
  },
  { name: "Raw potato", wiki: "Raw potato", image: "Raw_potato.png" },
  { name: "Rake", wiki: "Rake", image: "Rake.png" },
  { name: "Oak sapling", wiki: "Oak sapling", image: "Oak_sapling.png" },
  {
    name: "Bird snare",
    wiki: "Bird snare",
    image: "Bird_snare.png",
    aliases: ["bird snares"],
  },
];
