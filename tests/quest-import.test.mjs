import test from "node:test";
import assert from "node:assert/strict";
import {
  bullets,
  linkedBullets,
  mapPin,
  musicTracks,
  parseQuestreq,
  plain,
  questSeries,
  templateParams,
} from "../scripts/questWikitext.mjs";

test("reward lines keep their links as label → page, with labels exactly as the line shows them", () => {
  const [ring, cave, staff] = linkedBullets(
    "* The [[Ring of charos]], which allows access to the [[Werewolf Agility Course]]\n" +
      "* Access to the [[Experiment cave]]<ref>[[Not shown]]</ref>\n" +
      "* Ability to wield an [[ancient staff]], and buy one from [[Eblis]] for 80,000 coins",
  );
  assert.equal(ring.text, "The Ring of charos, which allows access to the Werewolf Agility Course");
  assert.deepEqual(ring.links, {
    "Ring of charos": "Ring of charos",
    "Werewolf Agility Course": "Werewolf Agility Course",
  });
  assert.deepEqual(cave.links, { "Experiment cave": "Experiment cave" });
  // Lowercase targets become page titles; the label keeps the line's own case.
  assert.deepEqual(staff.links, { "ancient staff": "Ancient staff", Eblis: "Eblis" });
});

test("piped links, link trails, anchors, plinks and joined children all land on the line", () => {
  const [line] = linkedBullets(
    "* Ability to use [[Build mode#Floor styles|floor styles]], 13 [[Bandos chronicle]]s and {{plink|Ring of visibility}}\n" +
      "** Also [[Prifddinas]] [[File:X.png]] [[Category:Y]]",
  );
  assert.equal(line.text, "Ability to use floor styles, 13 Bandos chronicles and Ring of visibility Also Prifddinas");
  assert.deepEqual(line.links, {
    "floor styles": "Build mode",
    "Bandos chronicles": "Bandos chronicle",
    Prifddinas: "Prifddinas",
    "Ring of visibility": "Ring of visibility",
  });
});

test("a label used for two pages is dropped rather than guessed", () => {
  const [line] = linkedBullets("* XP: [[Agility XP lamp|lamp]] and [[Mining XP lamp|lamp]], plus [[Coal]]");
  assert.deepEqual(line.links, { Coal: "Coal" });
});

test("TitleAnchor shows the title's text and links it to its page or the titles list", () => {
  assert.equal(plain("The {{TitleAnchor|t=of the Elves|c=#00FFFF|loc=s|bg=yes}} title"), "The of the Elves title");
  const [elves, tzhaar] = linkedBullets(
    "* The {{TitleAnchor|t=of the Elves|c=#00FFFF|loc=s|bg=yes}} title\n" +
      "* The {{TitleAnchor|t=TzHaar-|c=#C12006|loc=p|space=no|link=TzHaar (title)}} title",
  );
  assert.equal(elves.text, "The of the Elves title");
  assert.deepEqual(elves.links, { "of the Elves": "Titles" });
  assert.deepEqual(elves.titles, ["Titles"]);
  assert.equal(tzhaar.text, "The TzHaar- title");
  assert.deepEqual(tzhaar.links, { "TzHaar-": "TzHaar (title)" });
});

test("music bullets become track pages, linked or plain, once each", () => {
  assert.deepEqual(
    musicTracks(
      "* [[Bone Dry]] (Smoke Dungeon)\n* [[melzar's Maze (music track)|Melzar's Maze]]\n* Plain Song (somewhere)\n* [[Bone Dry]]\n* None",
    ),
    ["Bone Dry", "Melzar's Maze (music track)", "Plain Song"],
  );
  assert.deepEqual(musicTracks(undefined), []);
});

test("quest series reads the infobox name and position, and skips missing or odd ones", () => {
  const page = (extra) => `{{Infobox Quest\n|name = X\n${extra}\n}}\nLead.`;
  assert.deepEqual(
    questSeries(page("|main_series = [[Elf (Prifddinas)|Elf]]\n|series_nth = 9")),
    { name: "Elf", order: 9 },
  );
  assert.equal(questSeries(page("|difficulty = Easy")), undefined);
  assert.equal(questSeries(page("|main_series = None\n|series_nth = 1")), undefined);
  assert.equal(questSeries(page("|main_series = Pirate\n|series_nth = 3rd")), undefined);
  assert.equal(questSeries("no infobox"), undefined);
});

test("template parameters split at top-level pipes only", () => {
  const params = templateParams(
    "x {{Quest details\n|start = Talk to [[Warrior (Lost City)|warrior]].\n|start_path = {{Map|x=1|y=2}}\n|members = Yes\n}} y",
    "Quest details",
  );
  assert.equal(params.start, "Talk to [[Warrior (Lost City)|warrior]].");
  assert.equal(params.start_path, "{{Map|x=1|y=2}}");
  assert.equal(params.members, "Yes");
  assert.equal(templateParams("no templates", "Quest details"), undefined);
});

test("wikitext becomes plain prose with skill, XP and coin wording", () => {
  assert.equal(
    plain("{{Sxp|Crafting|3000}} [[Crafting XP lamp (Nature Spirit)|lamp]]"),
    "3,000 Crafting XP lamp",
  );
  assert.equal(
    plain("{{Skill XP|Combat|25000}} [[Combat XP lamp (Heralds of Crimson)|lamp]] in one of: {{scl|Attack}} or {{scl|Necromancy}}"),
    "25,000 Combat XP lamp in one of: Attack or Necromancy",
  );
  assert.equal(plain("{{Skillreq|Mining|20}} or {{Coins|1500}}"), "level 20 Mining or 1,500 coins");
  assert.equal(plain("'''Lost City''' is a [[quest]]<ref>x</ref>."), "Lost City is a quest.");
  assert.deepEqual(bullets("* [[Vial]]\n** nested\n* None\n* {{Coins|20}}"), ["Vial", "20 coins"]);
});

test("nested reward and supply lists join their parent line instead of vanishing", () => {
  assert.deepEqual(bullets("* Two lore books:\n** Book A\n** Book B\n* 1 quest point", true), [
    "Two lore books: Book A; Book B",
    "1 quest point",
  ]);
  assert.deepEqual(bullets("* Either:\n** One of:\n*** A\n** B", true), ["Either: One of: A; B"]);
  assert.equal(
    plain("A total of {{scm|Smithing|8500}} experience:"),
    "A total of 8,500 Smithing experience:",
  );
});

test("map pins read named, bare and colon coordinates and drop the default map", () => {
  assert.deepEqual(mapPin("{{Map|mapID=-1|plane=0|x=3438|y=9895|mtype=pin}}"), { x: 3438, y: 9895, plane: 0 });
  assert.deepEqual(mapPin("{{Maplink|mapID=28|plane=1|x=3149|y=3206}}"), { x: 3149, y: 3206, plane: 1 });
  assert.deepEqual(mapPin("{{Map|mapID=28|plane=0|3366, 3346|text=x}}"), { x: 3366, y: 3346, plane: 0 });
  assert.deepEqual(mapPin("{{Map|x:2898,y:3553,desc:a|x:2886,y:3522}}"), { x: 2898, y: 3553, plane: 0 });
  assert.deepEqual(mapPin("{{Map|mapID=714|x=10|y=20}}"), { x: 10, y: 20, plane: 0, mapId: 714 });
  assert.equal(mapPin("no pin"), undefined);
});

test("quest requirement data keeps quest lists and skips Follows and Full keys", () => {
  const map = parseQuestreq(
    '["Nature Spirit"] = {"Priest in Peril", "The Restless Ghost"},\n["Follows:Nature Spirit"] = {"X"},\n["Family Crest"] = {},',
  );
  assert.deepEqual(map.get("Nature Spirit"), ["Priest in Peril", "The Restless Ghost"]);
  assert.deepEqual(map.get("Family Crest"), []);
  assert.equal(map.has("Follows:Nature Spirit"), false);
});

test("NPC infobox map pins are read with spaced parameters", () => {
  assert.deepEqual(
    mapPin("|map = {{NPC map|npcname = Ambassador Spanfipple|npcid = 4581|x = 2984|y = 3341}}"),
    { x: 2984, y: 3341, plane: 0 },
  );
});

test("area outlines pin their centre and colon NPC pins read their first spawn", () => {
  assert.deepEqual(mapPin("|map = {{Area map|3200,3230|3220,3230|3220,3210|3200,3210}}"), { x: 3210, y: 3220, plane: 0 });
  assert.deepEqual(
    mapPin("{{NPC map|npcname=Legends' guard|npcid:398,x:2726,y:3349|npcid:399,x:2731,y:3348}}"),
    { x: 2726, y: 3349, plane: 0 },
  );
});
