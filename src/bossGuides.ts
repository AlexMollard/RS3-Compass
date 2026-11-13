// Hand-written boss guides. Every fact comes from the boss's RuneScape Wiki page, its /Strategies
// page, Template:PvM recommendations, "Boss pets" or "Boss collection log" (checked 2026-11).
// `uniques` corrections make the log match the Wiki's "Boss collection log items page" for that boss.

export interface BossGuide {
  why: string;
  mechanics: { title: string; detail: string }[];
  setup: { style: "melee" | "ranged" | "magic"; minimum: string; comfortable: string }[];
  bring: string[];
  getThere: string;
  ironman?: { before: string[]; gives: string[]; next?: string };
  uniques?: { add?: string[]; remove?: string[] };
  checked: string;
}

const GWD_ENTRY =
  "the God Wars Dungeon. Complete the Troll Stronghold quest up to the point where it unlocks the dungeon entrance, then you need 60 Strength or Agility to pass the boulder. You need 40 killcount of the boss's god to open the chamber, unless a Totem of Intimidation is active or you have War's Blessing 2.";

const warpriest = (god: string) =>
  ["helm", "cape", "cuirass", "greaves", "gauntlets", "boots"].map(
    (piece) => `Warpriest of ${god} ${piece}`,
  );

export const BOSS_GUIDES: Readonly<Record<string, BossGuide>> = {
  "ivar-king-of-bones": {
    why: "An early boss built to teach defensive prayers; he always drops a colossal bone for Prayer XP, and Ivar's loincloth unlocks the pet Ivarsson.",
    mechanics: [
      {
        title: "Stay in melee range",
        detail:
          "Next to you he uses weak melee auto-attacks. At a distance he spits magic instead, which protection prayers can't reduce.",
      },
      {
        title: "Ability bar",
        detail:
          "The bar over his head fills with his auto-attacks. After four, he uses one of his three special attacks at random, each with its own chat line.",
      },
      {
        title: "Bone Bludgeon (\"MRGH!\")",
        detail:
          "A 3x3 area is marked, then he swings his club. Step out of it, or use Protect from Melee to cut the damage and avoid the knock-back and disabled protection prayers.",
      },
      {
        title: "Skeletal Shrapnel (\"RAARRRGGHH!\")",
        detail: "A 3x3 area is marked, then he throws a bone. Step out of it, or use Protect from Ranged.",
      },
      {
        title: "Conk Blast",
        detail:
          "A 3x3 area is marked, then magic blasts stun you. Step out of it, or use Protect from Magic to reduce the damage and avoid the stun.",
      },
    ],
    setup: [
      {
        style: "magic",
        minimum: "Tier 50+ weapon and armour, 50+ Magic and Defence. Ivar is weak to air spells.",
        comfortable:
          "The same gear, but switch protection prayers to each special instead of stepping out, so you keep attacking.",
      },
    ],
    bring: ["Food", "Your best combat potions"],
    getThere:
      "Hollow Hill in north-east Havenhythe, after Visions of Havenhythe. The War's Retreat boss portals also lead to him, on free-to-play worlds too.",
    ironman: {
      before: ["Complete Visions of Havenhythe", "Tier 50 weapon and armour", "Protection prayers"],
      gives: [
        "Colossal bone every kill (large Prayer XP)",
        "Bonecrusher maul (crushes bones automatically)",
        "Magic skull mask",
        "Big bones (noted) and limpwurt roots",
        "Steel arrowheads",
        "Grimy guam and tarromin, plus law, nature and cosmic runes (F2P)",
        "Grimy ranarr and toadflax, plus ranarr seeds (members)",
      ],
      next: "giant-mole",
    },
    uniques: {
      remove: ["Giant Champion's scroll", "Long bone", "Curved bone", "Ivar's head"],
      add: ["Ivarsson"],
    },
    checked: "2026-11",
  },

  "giant-mole": {
    why: "A free-to-play boss whose four side chambers each add a mechanic; Rotten fang unlocks the pet Molly.",
    mechanics: [
      {
        title: "She digs away",
        detail:
          "After losing about 8,000 life points she digs to one of four side chambers and stops being aggressive; follow her dust trail. Near 15,000 life points (23,000 in hard mode) she returns to the centre and uses every chamber's mechanic.",
      },
      {
        title: "Mini-moles! (north-west)",
        detail:
          "She calls moles that raise her Defence and damage reduction while they live. Kill them quickly; area abilities work well.",
      },
      {
        title: "Berserk (north-east)",
        detail:
          "She glows red and green and attacks harder, faster and more accurately. She can be stunned as it starts.",
      },
      {
        title: "Rockfall (south-east)",
        detail:
          "After \"You hear a crumbling noise above\", rocks fall on you while you are stunned and bound (trapped in mud in hard mode). In normal mode use Freedom, or Anticipation beforehand. It only happens in melee range.",
      },
      {
        title: "Rubble! (south-west)",
        detail:
          "A 5x5 attack centred on you; move out of it. She also uses it anywhere if you stay out of melee range too long.",
      },
    ],
    setup: [
      {
        style: "melee",
        minimum: "Tier 50+ weapon and armour, 65+ Attack and 55+ Defence (normal mode).",
        comfortable:
          "A two-handed weapon for area abilities on the mini-moles; tier 60+ gear and 75+ Attack for hard mode.",
      },
      {
        style: "magic",
        minimum: "Tier 50+ weapon and armour, 60+ Magic and 55+ Defence (normal mode).",
        comfortable: "70+ Magic for hard mode, for a 100% hit chance. Chain and Dragon Breath clear mini-moles.",
      },
    ],
    bring: ["Food", "Two-handed weapon or a magic weapon for area abilities"],
    getThere:
      "Climb down the plant roots in the west of Falador Park into the Falador Mole Lair, then create or join an instance.",
    ironman: {
      before: [
        "Gravite weapon (Dungeoneering tokens)",
        "Brawler's hook or arcane blast necklace (15,500 Dungeoneering tokens, 50 Dungeoneering)",
        "Explorer's ring 4 (hard Lumbridge achievements)",
      ],
      gives: [
        "Yew logs and pure essence (noted)",
        "Iron and adamantite stone spirits",
        "Mystic cloth (noted)",
        "Numbing root",
        "Nature runes, limpwurt roots, uncut diamonds and grapes (F2P)",
        "Blood runes, ranarr seeds and red dragonhide (members)",
      ],
      next: "king-black-dragon",
    },
    uniques: {
      remove: ["Mole skin", "Mole claw", "Long bone", "Curved bone", "Giant mole's head"],
      add: ["Molly"],
    },
    checked: "2026-11",
  },

  "king-black-dragon": {
    why: "A free-to-play dragon whose rare drops include the draconic visage; King black dragon scale unlocks the pet King Black Dragonling (summoning it needs 99 Summoning).",
    mechanics: [
      {
        title: "Keep dragonfire protection up",
        detail:
          "Unprotected, his dragonfire can hit over 4,000. In free-to-play an anti-dragon shield or Protect from Magic gives partial protection, but they don't stack; members can use super antifires.",
      },
      {
        title: "Freezing dragonfire",
        detail: "Binds you in place for several seconds. Special dragonfire still hits up to 1,000 through a shield or prayer.",
      },
      {
        title: "Shocking dragonfire",
        detail:
          "Lowers most of your stats by 2 (not Constitution or Prayer) and drains Summoning points. Stat-restoring potions counter it.",
      },
      {
        title: "Poisonous dragonfire",
        detail: "Poisons you. It doesn't poison on free-to-play worlds.",
      },
      {
        title: "Dragonfire over melee",
        detail:
          "Out of melee range he only uses dragonfire, and even in range he uses it more often than his melee attacks.",
      },
    ],
    setup: [
      {
        style: "melee",
        minimum: "Tier 70+ weapon, tier 65+ armour, 65+ Attack, Strength and Defence.",
        comfortable:
          "In free-to-play, Gud raider or corrupt dragon gear (corrupt dragon crumbles after about 30 minutes of use), dual-wielded with Protect from Magic; about 100 combat kills him reliably.",
      },
      {
        style: "magic",
        minimum: "Tier 70+ weapon, tier 65+ armour, 65+ Magic and Defence.",
        comfortable:
          "In free-to-play, a gravite wand with battle robes and Protect from Magic; about 100 combat kills him reliably.",
      },
    ],
    bring: ["Prayer potions", "High-healing food", "Stat-boosting potions", "Super antifire (members)"],
    getThere:
      "Use an artefact into the King Black Dragon's Lair: the safe one north-west of the Edgeville lodestone, or the one in level 42 Wilderness, which gives a 10% damage boost. After one kill, a War's Retreat boss portal can be attuned to the Edgeville artefact.",
    ironman: {
      before: [
        "Font of Life relic from the Archaeology tutorial (+500 life points, the only relic in free-to-play)",
        "Protect from Magic or an anti-dragon shield",
        "Prayer potions, or restore at War's Retreat's Altar of War between kills",
      ],
      gives: [
        "Dragon bones and black dragonhide every kill",
        "Law and death runes",
        "Rune arrows",
        "Gold, adamantite and runite stone spirits",
        "Rune salvage",
        "Yew logs (noted)",
        "Raw swordfish, wine of Zamorak and uncut rubies, all noted (F2P)",
        "Blood runes and magic logs (members)",
      ],
      next: "chaos-elemental",
    },
    uniques: {
      remove: ["Black dragon egg (unchecked)"],
      add: ["King Black Dragonling"],
    },
    checked: "2026-11",
  },

  "chaos-elemental": {
    why: "The strongest free-to-play boss, known for the dragon 2h sword (members), rare corrupt dragon gear and rare Ancient Warriors' gear (members); Ribs of chaos unlocks the pet Ellie.",
    mechanics: [
      {
        title: "Discord",
        detail:
          "A green projectile that deals random magic, ranged or melee damage, up to 1,104. Use Protect from Magic, since magic is its most accurate, or Soul Split (members).",
      },
      {
        title: "Confusion",
        detail:
          "A fiery red projectile that teleports you nearby. Find it and resume; right-clicking it as the attack starts lets you attack straight after the teleport.",
      },
      {
        title: "Madness",
        detail:
          "Unequips your main-hand weapon and up to three other items. It can't happen when your backpack is full, so keep it full or leave one slot open.",
      },
      {
        title: "Deep Wilderness",
        detail:
          "It lives in level 50-52 Wilderness. On members worlds approach from the east, away from the abyssal savages, and keep praying until its drops appear.",
      },
    ],
    setup: [
      {
        style: "ranged",
        minimum: "Blue or green dragonhide with rune or adamant crossbows (free-to-play), 70+ Ranged and Defence.",
        comfortable: "Royal or black dragonhide with a black salamander and harralander tar (members).",
      },
    ],
    bring: [
      "Food that leaves a container, such as stews or bottles of wine (summer pies in members)",
      "Beast of burden for extra supplies (members)",
    ],
    getThere:
      "West of Rogues' Castle in level 50-52 Wilderness. The Edgeville teleport lever takes you to the nearby Deserted Keep, and a Wilderness obelisk is close. No boss portal can be attuned to it. Edward banks for free players outside the Dragonkin Laboratory.",
    ironman: {
      before: [
        "Food that leaves a container (stew or bottle of wine in free-to-play) to keep your backpack full",
        "Blue or green dragonhide armour and rune or adamant crossbows",
      ],
      gives: [
        "Rune arrows",
        "Chaos runes",
        "Mithril darts",
        "Stews and strange fruit",
        "Big bones",
        "Swordfish, prayer potions and uncut rubies (F2P)",
        "Sharks and Saradomin brews (members)",
      ],
    },
    uniques: {
      remove: [
        "Corrupt dragon equipment",
        "Ancient Warriors' equipment",
        "Corrupt Statius's warhammer",
        "Corrupt Vesta's longsword",
        "Corrupt Vesta's spear",
        "Corrupt Zuriel's staff",
        "Corrupt Morrigan's javelin",
        "Corrupt Morrigan's throwing axe",
        "Corrupt Statius's full helm",
        "Corrupt Statius's platebody",
        "Corrupt Statius's platelegs",
        "Corrupt Vesta's chainbody",
        "Corrupt Vesta's plateskirt",
        "Corrupt Zuriel's hood",
        "Corrupt Zuriel's robe top",
        "Corrupt Zuriel's robe bottom",
        "Corrupt Morrigan's coif",
        "Corrupt Morrigan's leather body",
        "Corrupt Morrigan's leather chaps",
        "Chaos Elemental's head",
      ],
      add: ["Ellie"],
    },
    checked: "2026-11",
  },

  "the-barrows-brothers": {
    why: "Each run can give armour and weapons from every brother you killed, plus the amulet of the forsaken; killing all the brothers gives the most rolls.",
    mechanics: [
      {
        title: "Crypts and the tunnel",
        detail:
          "Dig on each mound and search the sarcophagus to fight its brother. One mound offers a hole instead: decline it, kill the others, then come back and enter it to reach the chest.",
      },
      {
        title: "Each brother's weakness",
        detail:
          "Dharok, Verac, Guthan, Torag and Linza fight with melee and are weak to fire, earth, air, water and fire spells. Karil uses ranged and is weak to stab; Ahrim and Akrisae use magic and are weak to arrows and bolts.",
      },
      {
        title: "Kill order",
        detail:
          "Fight Dharok first, while you have food: he can hit hardest. Fight Karil before Ahrim, who drains your Strength. Low levels should skip Linza and Akrisae.",
      },
      {
        title: "Bind the melee brothers",
        detail:
          "Snare (50 Magic) or Entangle (79 Magic) with nature runes stops them attacking; recast when the bind ends.",
      },
      {
        title: "Prayer drain and the door puzzle",
        detail:
          "Prayer drains while underground (halved by the hard Morytania achievements). The door to the chest room has a puzzle, and a wrong answer shuffles the path; War's Blessing 1 adds a portal straight to the chest.",
      },
    ],
    setup: [
      {
        style: "magic",
        minimum: "Tier 70+ magic weapon, 65+ Magic and Defence, for the melee brothers.",
        comfortable: "Staff of light (75 Magic) in Warpriest hybrid armour, as in the Wiki's low-level preset.",
      },
      {
        style: "ranged",
        minimum: "Tier 70+ ranged switch for Ahrim and Akrisae.",
        comfortable: "Royal crossbow (80 Ranged).",
      },
      {
        style: "melee",
        minimum: "Tier 70+ melee switch for Karil.",
        comfortable: "Bandos godsword (75 Attack).",
      },
    ],
    bring: [
      "Melee, ranged and magic weapon switches",
      "Air, water, earth and fire runes",
      "Nature runes for Snare or Entangle",
      "Super restores",
      "Super potions",
      "Food",
      "Barrows amulet (optional)",
    ],
    getThere:
      "The Barrows in southern Morytania. Teleport out once you have looted the chest, and restore at War's Retreat before the next run.",
    uniques: {
      remove: ["Barrows equipment"],
      add: [
        "Corruption sigil",
        "Ahrim's hood",
        "Ahrim's robe top",
        "Ahrim's robe skirt",
        "Ahrim's staff",
        "Ahrim's wand",
        "Ahrim's book of magic",
        "Akrisae's hood",
        "Akrisae's robe top",
        "Akrisae's robe skirt",
        "Akrisae's war mace",
        "Dharok's helm",
        "Dharok's platebody",
        "Dharok's platelegs",
        "Dharok's greataxe",
        "Guthan's helm",
        "Guthan's platebody",
        "Guthan's chainskirt",
        "Guthan's warspear",
        "Karil's coif",
        "Karil's top",
        "Karil's skirt",
        "Karil's crossbow",
        "Karil's pistol crossbow",
        "Karil's off-hand pistol crossbow",
        "Torag's helm",
        "Torag's platebody",
        "Torag's platelegs",
        "Torag's hammer",
        "Verac's helm",
        "Verac's brassard",
        "Verac's plateskirt",
        "Verac's flail",
        "Linza's helm",
        "Linza's cuirass",
        "Linza's greaves",
        "Linza's hammer",
        "Linza's shield",
      ],
    },
    checked: "2026-11",
  },

  "silverquill-the-dreadhog": {
    why: "An early members boss built to teach telegraphed attacks; she always drops silver or sanguine spines for havensilver bolts, and Silverquill's blood-filled cyst unlocks the pet Needlemouse.",
    mechanics: [
      {
        title: "Distance picks her attack",
        detail:
          "In melee range she claws you; further away she fires ranged darts. Pray against the one you'll face, or use Soul Split.",
      },
      {
        title: "Reflect",
        detail:
          "Attacking her from melee range reflects damage back at you, whatever your style. Halberds and magic let you fight from further away.",
      },
      {
        title: "Blood Tumours",
        detail:
          "After four auto-attacks she throws three tumours around you that explode for magic damage in marked areas. Move away, and watch that auto-retaliate doesn't run you back in.",
      },
      {
        title: "Sanguine tumours and Blood Hog",
        detail:
          "At two-thirds and one-third health she becomes immune, summons tumours and reflects damage at any distance. Kill the tumours before her charge bar fills or they heal her; then switch to Protect from Magic for the homing Blood Hog.",
      },
    ],
    setup: [
      {
        style: "melee",
        minimum: "Tier 50+ halberd and armour, 50+ Attack, Strength and Defence. She is weak to stab.",
        comfortable: "A halberd with Soul Split, which the Wiki's AFK melee setup uses.",
      },
      {
        style: "magic",
        minimum: "Tier 50+ weapon and armour, 50+ Magic and Defence.",
        comfortable: "Higher Magic reaches a 100% hit chance without approaching her.",
      },
    ],
    bring: ["Food", "Your best combat potions"],
    getThere:
      "The Blighted Cave in east Havenhythe, after Hearts of Sanguine. Create or join the instance at the cave ventricle north of the cave entrance.",
    uniques: {
      remove: ["Long bone", "Curved bone", "Silverquill's head"],
      add: ["Needlemouse"],
    },
    checked: "2026-11",
  },

  "dagannoth-kings": {
    why: "Each King drops its own ring (Rex two), among the best damage bonuses for its style, and each has a pet: Rex, Prime and Supreme hatchlings.",
    mechanics: [
      {
        title: "Three Kings, three styles",
        detail:
          "Rex uses melee and is weak to magic (fire spells). Supreme uses ranged and is weak to melee (stab). Prime uses magic and is weak to ranged (arrows). Each is immune to every other style, Necromancy included.",
      },
      {
        title: "They fight together",
        detail:
          "The Kings respawn separately and every living King attacks you, so you'll usually face two at once. Prime only hits one target but hits hardest.",
      },
      {
        title: "Pull them apart",
        detail:
          "At lower levels, start in the south-east corner and lure Rex away with magic. Then switch to ranged for Prime, who keeps north, and melee for Supreme to the south-west.",
      },
      {
        title: "Spinolyps",
        detail: "Spinolyps by the water attack with weak magic and poisoned ranged attacks.",
      },
    ],
    setup: [
      {
        style: "melee",
        minimum: "Tier 70+ weapon, 65+ Attack, Strength and Defence, for Supreme.",
        comfortable: "Zamorakian spear (75 Attack) with Warpriest hybrid armour, as in the Wiki's tribrid preset.",
      },
      {
        style: "ranged",
        minimum: "Tier 70+ ranged switch, 65+ Ranged, for Prime.",
        comfortable: "Royal crossbow (80 Ranged).",
      },
      {
        style: "magic",
        minimum: "Tier 70+ magic switch, 65+ Magic, for Rex.",
        comfortable: "Staff of light (75 Magic) with fire spells.",
      },
    ],
    bring: [
      "Melee, ranged and magic weapon switches",
      "Air and fire runes",
      "Super restores",
      "Super potions",
      "Food",
      "Antipoison (for the spinolyps)",
    ],
    getThere:
      "The sixth level of the Waterbirth Island Dungeon. A Dagannoth Kings teleport lands near the arena; once you've killed a King, the War's Retreat boss portal goes straight to the entrance.",
    uniques: {
      remove: ["Dagannoth king heads"],
      add: ["Prime hatchling", "Rex hatchling", "Supreme hatchling"],
    },
    checked: "2026-11",
  },

  "kalphite-queen": {
    why: "Drops the dragon chainbody and dragon 2h sword; Kalphite egg unlocks the pet Kalphite Grublet.",
    mechanics: [
      {
        title: "Two forms",
        detail:
          "Her first form is immune to magic and ranged, so use melee or Necromancy. Her flying second form is immune to melee: switch to ranged or magic, or keep using Necromancy.",
      },
      {
        title: "Spines",
        detail: "A ranged attack that always hits and drains 10 prayer points.",
      },
      {
        title: "Lightning",
        detail: "A magic attack that always hits and bounces between nearby players.",
      },
      {
        title: "Kalphite workers",
        detail:
          "Workers spawn from the cocoons on the walls while she is near them, and die with her. Move so she stands between you and them.",
      },
    ],
    setup: [
      {
        style: "melee",
        minimum: "Tier 70+ weapon, 75+ Attack, Strength and Defence, for the first form.",
        comfortable: "Bandos godsword (75 Attack) in Warpriest hybrid armour, as in the Wiki's preset.",
      },
      {
        style: "ranged",
        minimum: "Tier 70+ ranged switch for the second form.",
        comfortable: "Royal crossbow (80 Ranged).",
      },
    ],
    bring: [
      "2 ropes (first visit only)",
      "Melee weapon plus a ranged or magic switch",
      "Super restores",
      "Super potions",
      "Food",
    ],
    getThere:
      "The Kalphite Hive, due west of Shantay Pass. Your first visit needs one rope into the hive and another for the queen's room. In the room guarded by two kalphite guardians, the tunnel leads to her: Quick-Climb for the open fight, or Climb down for an instance.",
    uniques: {
      remove: ["Lava battlestaff"],
      add: ["Kalphite Grublet"],
    },
    checked: "2026-11",
  },

  "flesh-hatcher-mhekarnahz": {
    why: "A solo-together boss built to teach telegraphs, with a 50% combat XP boost; it drops the dragon harpoon and stalker's charm, and Mhekarnahz's eye unlocks the pet Flesh-hatchling Mhekarnahz.",
    mechanics: [
      {
        title: "Ability bar",
        detail:
          "It attacks with magic. After four auto-attacks the bar over it fills and it uses a special attack.",
      },
      {
        title: "Square telegraph",
        detail:
          "A 3x3 area fills under you, then a fireball hits for up to 4,000 ranged damage and binds and stuns you. Step out, or pray Protect from Ranged and use Freedom.",
      },
      {
        title: "Inner, middle and outer telegraphs",
        detail:
          "The area around it, a ring mid-arena, or the arena's edges fill, then explode for up to 4,000. Step a few tiles away. Each happens once per rotation, in a random order.",
      },
      {
        title: "Flesh sacs",
        detail:
          "It becomes immune and summons three warped flesh sacs per player. After about 10 seconds they turn into Warped Seekers and attack, so kill them fast with area abilities.",
      },
    ],
    setup: [
      {
        style: "ranged",
        minimum: "Tier 50+ weapon and armour, 50+ Ranged and Defence. It is weak to ranged.",
        comfortable: "Ruinous weapons deal extra damage to it; Bombardment clears the flesh sacs.",
      },
    ],
    bring: ["Food", "Your best combat potions"],
    getThere:
      "A mysterious entrance in eastern level 30 Wilderness, west of the charming moths; needs 40 Dungeoneering. Opt out of PvP with Vala in Edgeville first. Walk north from the Fort Forinthry lodestone, or south-west from Daemonheim with a ring of kinship. The dungeon itself isn't Wilderness.",
    uniques: {
      remove: ["Seeker's charm", "Hexhunter bow", "Flesh-hatcher Mhekarnahz's eye"],
    },
    checked: "2026-11",
  },

  kreearra: {
    why: "Drops Armadyl armour, tier 70 ranged armour, and the Armadyl hilt; Giant feather unlocks the pet Chick'arra.",
    mechanics: [
      {
        title: "No melee",
        detail: "His wings push melee attackers back. Use ranged, magic or Necromancy.",
      },
      {
        title: "Gale and tornado",
        detail:
          "A ranged gale and a magic tornado, each up to 1,080, push you back and interrupt channelled abilities. Stand in a corner or on the tile in front of the door, and use Protect from Ranged unless you use Soul Split.",
      },
      {
        title: "Bodyguards",
        detail:
          "After Kree'arra, kill Wingman Skree, then Flockleader Geerin, then Flight Kilisa. They drop manta rays and mushroom potatoes for healing.",
      },
      {
        title: "Hard mode whirlwinds",
        detail:
          "Ranged and magic whirlwinds roam the room for 2,100-3,400 typeless damage. On \"Storms, align to me!\" he becomes invulnerable, gathers them, then fires them outward. Avoid them; prayers don't help.",
      },
    ],
    setup: [
      {
        style: "ranged",
        minimum: "Tier 70+ weapon and armour, 75+ Ranged and Defence (70 Ranged to enter).",
        comfortable: "The same tier 70 gear and 90+ combat stats for hard mode.",
      },
      {
        style: "magic",
        minimum: "Tier 70+ weapon and armour, 75+ Magic and Defence (70 Ranged to enter).",
        comfortable: "The same tier 70 gear and 90+ combat stats for hard mode.",
      },
    ],
    bring: ["God-aligned item or Shard of Zaros", "Super potions", "Food"],
    getThere: `Armadyl's Eyrie at the south end of ${GWD_ENTRY} Entering the Eyrie needs 70 Ranged (unboostable).`,
    uniques: {
      remove: [
        "Warpriest of Armadyl armour",
        "Armadyl equipment",
        "Armadyl godsword",
        "Crystal key",
        "Long bone",
        "Curved bone",
        "Kree'arra's head",
      ],
      add: [...warpriest("Armadyl"), "Armadyl's Assault", "Chick'arra"],
    },
    checked: "2026-11",
  },

  "commander-zilyana": {
    why: "Drops the Saradomin sword, Armadyl crossbow and Saradomin hilt; Auburn lock unlocks the pet Commander Miniana.",
    mechanics: [
      {
        title: "Fast close-range attacks",
        detail:
          "She attacks every two ticks: magic lightning up to 2,200 that can hit several players when her sword glows blue, and melee up to 1,800. Both only work at close range. Use Protect from Magic.",
      },
      {
        title: "No blood spells",
        detail:
          "Repeated blood spells enrage her and make her attacks stronger (Exsanguinate doesn't).",
      },
      {
        title: "Bodyguards",
        detail:
          "Starlight (melee), Growler (magic) and Bree (ranged). Kill Zilyana first; the guards can die in any order. With magic, stand on the west side one square from the middle of the wall so Dragon Breath hits Growler too.",
      },
      {
        title: "Hard mode",
        detail:
          "Two phases of 50,000 life points. In the second, lightning bounces round the room for 200-1,700 typeless damage; move out of it. When she collapses, hit her with a damaging ultimate ability before her bar fills, or she heals 25,000.",
      },
    ],
    setup: [
      {
        style: "magic",
        minimum: "Tier 70+ weapon and armour, 75+ Magic and Defence.",
        comfortable: "Tier 80+ gear and 90+ Magic for hard mode, where the Wiki recommends Magic.",
      },
    ],
    bring: ["God-aligned item or Shard of Zaros", "Super potions", "Food"],
    getThere: `The back room of Saradomin's Encampment in ${GWD_ENTRY} Reaching her needs 70 Agility (unboostable).`,
    uniques: {
      remove: ["Warpriest of Saradomin armour", "Saradomin godsword", "Zilyana's wings"],
      add: [...warpriest("Saradomin"), "Zilyana's Notes", "Commander Miniana"],
    },
    checked: "2026-11",
  },

  "general-graardor": {
    why: "The only source of the Bandos hilt, and drops Bandos armour, tier 70 melee power armour; Decaying tooth unlocks the pet General Awwdor.",
    mechanics: [
      {
        title: "Heavy melee",
        detail:
          "His arm thrust hits his main target for up to 3,000. Use Protect from Melee unless you use Soul Split.",
      },
      {
        title: "Shockwave",
        detail: "A ranged ground slam hits every player in the chamber for up to 1,676.",
      },
      {
        title: "Bodyguards",
        detail:
          "Kill Graardor, then Sergeant Steelwill (magic, the most dangerous), then Strongstack and Grimspike. At lower levels, stand against the north wall before he spawns and Steelwill may not notice you.",
      },
      {
        title: "Hard mode specials",
        detail:
          "100,000 life points. \"Graardor smash!\" drops rocks; move away. \"Graardor protect.\" reflects damage, so stop attacking. \"Graardor mad!\" pummels the tiles in front of him; get out of range. Kiting him round the room stops his specials.",
      },
    ],
    setup: [
      {
        style: "melee",
        minimum: "Tier 70+ weapon and armour, 75+ Attack, Strength and Defence. He is almost fully immune to ranged in normal mode.",
        comfortable: "Tier 80+ gear and 90+ combat stats for hard mode.",
      },
    ],
    bring: ["God-aligned item or Shard of Zaros", "Super potions", "Prayer renewal potions", "Food"],
    getThere: `Bandos's Stronghold in the north-west of ${GWD_ENTRY} Entering the stronghold needs 70 Strength (unboostable); goblins and spiritual rangers are the quickest killcount.`,
    uniques: {
      remove: [
        "Warpriest of Bandos armour",
        "Bandos equipment",
        "Bandos godsword",
        "General Graardor's head",
      ],
      add: [...warpriest("Bandos"), "The Glory of General Graardor", "General Awwdor"],
    },
    checked: "2026-11",
  },
};
