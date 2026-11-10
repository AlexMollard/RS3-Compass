import test from "node:test";
import assert from "node:assert/strict";
import {
  bullets,
  mapPin,
  parseQuestreq,
  plain,
  templateParams,
} from "../scripts/questWikitext.mjs";

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
  assert.equal(plain("{{Skillreq|Mining|20}} or {{Coins|1500}}"), "level 20 Mining or 1,500 coins");
  assert.equal(plain("'''Lost City''' is a [[quest]]<ref>x</ref>."), "Lost City is a quest.");
  assert.deepEqual(bullets("* [[Vial]]\n** nested\n* None\n* {{Coins|20}}"), ["Vial", "20 coins"]);
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
