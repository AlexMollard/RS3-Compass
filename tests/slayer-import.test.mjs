import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAssignments,
  parseLuaTable,
  parseMastersTable,
  parseRequirements,
  representativeMonster,
} from "../scripts/slayerWikitext.mjs";

// Trimmed from Module:Slayer assignments/Laniakea and /Kuradal (fetched 2026-11-16), the data that
// Module:Slayer Tasks by Master requires to render each Slayer assignment/<Master> table.
const laniakea = `return {

	["Abyssal demons"] = {
		min = 180,
		max = 300,
		weight = 10,
		reqs = {
			combat = 0,
			slayer = 85,
			other = '[[Morytania]] access',
		},
	},

	["Corrupted creatures"] = {
		min = 150,
		max = 250,
		weight = 10,
		reqs = {
			combat = 0,
			slayer = 88,
			other = 'partial completion of [[File:Quest.png|24px|link=Icthlarin\\'s Little Helper]] [[Icthlarin\\'s Little Helper]]',
		},
	},

	["Edimmu"] = {
		min = 170,
		max = 265,
		weight = 10,
		reqs = {
			combat = 110,
			slayer = 90,
			other = '[[File:Dungeoneering.png|24px|link=Dungeoneering]] 115, [[File:Quest.png|24px|link=Plague\\'s End]] [[Plague\\'s End]]',
		},
	},

	["Ravenous strigoi"] = {
		min = 70,
		max = 110,
		weight = 0,
		reqs = {
			slayer = 104,
			other = '',
		},
	},

	["Sanguine werewolves"] = {
		min = 50,
		max = 70,
		weight = nil,
		reqs = {
			combat = 110,
			slayer = 0,
			other = '',
		},
	},

	["Shadow creatures"] = {
		min = 100,
		max = 150,
		weight = 10,
		reqs = {
			combat = 100,
			other = '[[File:Quest.png|24px|link=Plague\\'s End]] [[Plague\\'s End]]'
		},
	},

}`;

// Trimmed from Module:Slayer assignments/Turael (fetched 2026-11-16).
const turael = `return {
	["Cave bugs"] = {
		min = 10,
		max = 20,
		weight = 10,
		reqs = {
			combat = 8,
			slayer = 7,
			other = '[[File:P2P icon.png|24px|link=Members]] [[Members]]',
		},
	},

	["Crawling hands"] = {
		min = 10,
		max = 20,
		weight = 30,
		reqs = {
			combat = 10,
			slayer = 5,
		}
	},
}`;

// Trimmed from Template:Slayer masters/table (fetched 2026-11-16).
const mastersTable = `{| class="wikitable sortable align-left-2 align-left-3 align-left-6" style="text-align:center"
! rowspan="2" colspan="2"| Master
! rowspan="2" class="leagues-global-flag" | {{CurrentLeague}}
! rowspan="2" | Location
! colspan="3" | Requirements
! colspan="3" | {{plink|Slayer points|size=21}}
|-
! {{scm|Combat level}} Combat
! {{scm|Slayer}} Slayer
! [[File:Quest.png|21x21px|link=|alt=]] Quests
! Per task
! Per 10th task
! Per 50th task
|-
| {{chatlp|Turael}} {{chatlp|Spria}} || [[Turael]] / [[Spria]]<ref name="wgsmaster" group="n">[[Spria]] and [[Lapalok]] replace [[Turael]] and [[Duradel]] upon completion of [[While Guthix Sleeps]].</ref>
|class="leagues-global-flag" | {{LeagueRegion|Asgarnia}}
| {{Maplink|text=Burthorpe|x=2890|y=3548|mtype=pin}}
| {{NA}}
| {{NA}}
| {{NA}}
| 0
| 0
| 0
|-
| data-sort-value="Raptor" | {{chatlp|The Raptor}} || [[The Raptor]]
| class="leagues-global-flag" | {{LeagueRegion|Misthalin}}
| {{Maplink|text=Fort Forinthry|x=3290|y=3540|mtype=pin}}
| {{Scm|Combat level|35}}
| {{Scm|Slayer|10}}<ref group="n">Although [[the Raptor]] himself has no specific Slayer level requirement to assign tasks, the quest that grants access to him as a slayer master requires level 10 Slayer.</ref>
| [[Unwelcome Guests]]
| data-sort-value="19" | ? — 18<ref name="trophy" group="n">Slayer points for Raptor's tasks vary by level.</ref>
| data-sort-value="91" | ? — 90<ref name="trophy" group="n" />
| data-sort-value="271" | ? — 270<ref name="trophy" group="n" />
|-
| {{chatlp|Kuradal}} || [[Kuradal]]
| class="leagues-global-flag" | {{LeagueRegion|Kandarin}}
| {{Maplink|text=Ancient Cavern|mapID=36|x=138|y=64|mtype=pin}}
| {{Scm|Combat level|110}}
| {{Scm|Slayer|75}}
| [[Barbarian Training]]<ref group="n">Access to [[Kuradal]] only requires completion of the Firemaking section of [[Barbarian Training]], up to the point of entering the [[Ancient Cavern]].</ref>
| 18
| 90
| 270
|-
| {{chatlp|Morvran}} || [[Morvran]]
| class="leagues-global-flag" | {{LeagueRegion|Tirannwn}}
| {{Maplink|text=Prifddinas|x=2194|y=3327|mtype=pin}}
| {{Scm|Combat level|120}}
| {{Scm|Slayer|85}}
| [[Plague's End]]
| 20
| 100
| 300
|}
{{Reflist|group="n"}}`;

const QUESTS = [
  { id: "plagues-end", name: "Plague's End" },
  { id: "icthlarins-little-helper", name: "Icthlarin's Little Helper" },
  { id: "unwelcome-guests", name: "Unwelcome Guests" },
];

const task = (result, name) => {
  const found = result.tasks.find((t) => t.name === name);
  assert.ok(found, `${name} is parsed`);
  return found;
};

test("parseLuaTable reads nested tables, escaped quotes, nil and missing trailing commas", () => {
  const data = parseLuaTable(laniakea);
  assert.equal(data["Abyssal demons"].min, 180);
  assert.equal(data["Shadow creatures"].reqs.other, "[[File:Quest.png|24px|link=Plague's End]] [[Plague's End]]");
  assert.equal(data["Sanguine werewolves"].weight, undefined);
  assert.throws(() => parseLuaTable("return { a = os.exit() }"));
});

test("Laniakea's Abyssal demons: amount, Slayer level, Morytania text and weight", () => {
  const result = parseAssignments("laniakea", laniakea, { quests: QUESTS, members: true });
  assert.deepEqual(task(result, "Abyssal demons"), {
    id: "abyssal-demons",
    master: "laniakea",
    name: "Abyssal demons",
    wiki: "Abyssal demons (Slayer assignment)",
    amount: [180, 300],
    slayer: 85,
    requirements: { levels: [], quests: [], text: ["Morytania access"] },
    weight: 10,
    members: true,
  });
});

test("a quest-gated task maps its quest to a QUESTS id; other levels stay", () => {
  const result = parseAssignments("laniakea", laniakea, { quests: QUESTS, members: true });
  assert.deepEqual(task(result, "Shadow creatures").requirements, {
    levels: [],
    quests: ["plagues-end"],
    text: [],
  });
  assert.deepEqual(task(result, "Edimmu").requirements, {
    levels: [{ skill: "Dungeoneering", level: 115 }],
    quests: ["plagues-end"],
    text: [],
  });
});

test("the combat level requirement is its own field, absent when it is 0", () => {
  const result = parseAssignments("laniakea", laniakea, { quests: QUESTS, members: true });
  assert.equal(task(result, "Edimmu").combat, 110);
  assert.equal(task(result, "Shadow creatures").combat, 100);
  assert.equal("combat" in task(result, "Abyssal demons"), false);
  assert.equal("combat" in task(result, "Ravenous strigoi"), false);
});

test("partial quest completion is not a quest requirement", () => {
  const result = parseAssignments("laniakea", laniakea, { quests: QUESTS, members: true });
  assert.deepEqual(task(result, "Corrupted creatures").requirements, {
    levels: [],
    quests: [],
    text: ["partial completion of Icthlarin's Little Helper"],
  });
});

test("a row with a nil weight is kept with the weight unknown, not defaulted; weight 0 is kept", () => {
  const result = parseAssignments("laniakea", laniakea, { quests: QUESTS, members: true });
  assert.equal("weight" in task(result, "Sanguine werewolves"), false);
  assert.deepEqual(result.invalid, []);
  assert.equal(task(result, "Ravenous strigoi").weight, 0);
  assert.equal(task(result, "Ravenous strigoi").slayer, 104);
});

test("a free master's task is members only when the Wiki marks it so; no Slayer level means 1", () => {
  const result = parseAssignments("turael", turael, { quests: QUESTS, members: false });
  assert.equal(task(result, "Cave bugs").members, true);
  assert.deepEqual(task(result, "Cave bugs").requirements, { levels: [], quests: [], text: [] });
  assert.equal(task(result, "Cave bugs").combat, 8);
  assert.equal(task(result, "Crawling hands").members, false);
  assert.equal(task(result, "Crawling hands").slayer, 5);
});

test("parseRequirements keeps compound clauses whole as text", () => {
  const quests = QUESTS;
  assert.deepEqual(
    parseRequirements(
      "(([[File:Strength.png|24px|link=Strength]] 60 or [[File:Agility.png|24px|link=Agility]] 60) and [[File:Constitution.png|24px|link=Constitution]] 70)",
      quests,
    ),
    { levels: [], quests: [], text: ["((Strength 60 or Agility 60) and Constitution 70)"], members: false, unmatched: [] },
  );
  assert.deepEqual(
    parseRequirements(
      "[[File:Quest.png|24px|link=The Tale of the Muspah]] [[The Tale of the Muspah]] and own a [[fire cape]], [[TokHaar-Kal]] or [[Igneous Kal]] (equipped, in backpack, in bank or player-owned house) or have purchased the alternate ice strykewyrm technique for 2,000 [[Slayer points]].",
      quests,
    ).text,
    [
      "The Tale of the Muspah and own a fire cape, TokHaar-Kal or Igneous Kal (equipped, in backpack, in bank or player-owned house) or have purchased the alternate ice strykewyrm technique for 2,000 Slayer points.",
    ],
  );
  // A quest icon without link= (Olaf's Quest) still names the quest; an unknown quest stays text and is reported.
  assert.deepEqual(
    parseRequirements("[[File:Quest.png|24px|Olaf's Quest]] [[Olaf's Quest]], toggled on for a cost of 50 [[Slayer points]]", quests),
    {
      levels: [],
      quests: [],
      text: ["Olaf's Quest", "toggled on for a cost of 50 Slayer points"],
      members: false,
      unmatched: ["Olaf's Quest"],
    },
  );
});

test("the masters table gives Kuradal and Morvran with their requirements", () => {
  const masters = parseMastersTable(mastersTable, QUESTS);
  assert.deepEqual(
    masters.map((m) => m.wiki),
    ["Turael", "The Raptor", "Kuradal", "Morvran"],
  );
  const kuradal = masters.find((m) => m.wiki === "Kuradal");
  assert.equal(kuradal.combat, 110);
  assert.equal(kuradal.slayer, 75);
  assert.deepEqual(kuradal.quests, []);
  assert.deepEqual(kuradal.text, ["Barbarian Training"]);
  assert.deepEqual(masters.find((m) => m.wiki === "Morvran").text, []);
  assert.equal(kuradal.location, "Ancient Cavern");
  const morvran = masters.find((m) => m.wiki === "Morvran");
  assert.equal(morvran.combat, 120);
  assert.equal(morvran.slayer, 85);
  assert.deepEqual(morvran.quests, ["plagues-end"]);
  const turaelRow = masters.find((m) => m.wiki === "Turael");
  assert.equal(turaelRow.name, "Turael / Spria");
  assert.equal(turaelRow.image, "Turael chathead.png");
  assert.equal(turaelRow.combat, 0);
  assert.equal(turaelRow.slayer, 1);
  const raptor = masters.find((m) => m.wiki === "The Raptor");
  assert.equal(raptor.slayer, 10);
  assert.deepEqual(raptor.quests, ["unwelcome-guests"]);
});

test("a quest cell reads linked names joined by commas or and, and stops on any other text", () => {
  const joined = mastersTable.replace("| [[Plague's End]]", "| [[Plague's End]], [[Unwelcome Guests]] and [[Barbarian Training]]");
  const morvran = parseMastersTable(joined, QUESTS).find((m) => m.wiki === "Morvran");
  assert.deepEqual(morvran.quests, ["plagues-end", "unwelcome-guests"]);
  assert.deepEqual(morvran.text, ["Barbarian Training"]);
  const partial = mastersTable.replace("| [[Plague's End]]", "| Partial completion of [[Plague's End]]");
  assert.throws(() => parseMastersTable(partial, QUESTS), /Morvran has unlinked quest text "Partial completion of"/);
});

test("a category is pictured by its singular monster, else its lowest-combat one", () => {
  // Rows trimmed from the Wiki's infobox_monster Bucket (fetched 2026-11-16).
  const birds = [
    { page_name: "Terrorbird", combat_level: 42 },
    { page_name: "Chicken", combat_level: 1 },
    { page_name: "Evil Chicken" },
  ];
  assert.equal(representativeMonster("Birds", birds), "Chicken");
  const wolves = [{ page_name: "Big wolf", combat_level: 1 }, { page_name: "Wolf", combat_level: 25 }];
  assert.equal(representativeMonster("Wolves", wolves), "Wolf");
  assert.equal(representativeMonster("Gargoyles", [{ page_name: "Gargoyle", combat_level: 90 }]), "Gargoyle");
  assert.equal(representativeMonster("Dagannoth", [{ page_name: "Dagannoth", combat_level: 90 }]), "Dagannoth");
  const elves = [{ page_name: "Unnatural Trahaearn titan", combat_level: 1 }, { page_name: "Elf warrior", combat_level: 90 }];
  assert.equal(representativeMonster("Elves", elves), "Elf warrior");
  assert.equal(representativeMonster("Elves", []), undefined);
});
