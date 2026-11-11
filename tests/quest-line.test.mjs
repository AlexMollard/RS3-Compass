import test from "node:test";
import assert from "node:assert/strict";
import { questLine } from "../src/lib/questLine.ts";
import { QUESTS } from "../src/data.ts";

test("a quest line lists its series in Wiki order, matching wiki names with spaces", () => {
  const quests = [
    { id: "c", wiki: "Cabin_Fever" },
    { id: "a", wiki: "Pirate's Treasure" },
    { id: "x", wiki: "Cook's Assistant" },
    { id: "b", wiki: "Rum_Deal" },
  ];
  const series = {
    "Pirate's_Treasure": { name: "Pirate", order: 1 },
    Rum_Deal: { name: "Pirate", order: 2 },
    Cabin_Fever: { name: "Pirate", order: 3 },
  };
  assert.deepEqual(
    questLine(quests[0], quests, series)?.quests.map((q) => q.id),
    ["a", "b", "c"],
  );
  assert.equal(questLine(quests[2], quests, series), undefined);
});

test("a series with only one known quest is not a line", () => {
  const quests = [{ id: "a", wiki: "Solo" }];
  assert.equal(questLine(quests[0], quests, { Solo: { name: "Solo", order: 1 } }), undefined);
});

test("Plague's End sits last in the imported Elf series", () => {
  const plague = QUESTS.find((q) => q.id === "plagues-end");
  const line = questLine(plague, QUESTS);
  assert.equal(line?.name, "Elf (Prifddinas)");
  assert.equal(line?.quests.at(-1)?.id, "plagues-end");
  assert.equal(line?.quests[0].name, "Plague City");
});
