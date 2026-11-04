import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS } from "../src/data.ts";
import { questMapCenter, wikiTileUrl } from "../src/wikiMap.ts";

test("north-up Leaflet rows address Wiki tiles without a one-row shift", () => {
  const southEdge = new URL(wikiTileUrl({ x: 0, y: -1, z: 0 }, 0));
  const lumbridge = new URL(wikiTileUrl({ x: 50, y: -51, z: 2 }, 0));
  const upperFloor = new URL(wikiTileUrl({ x: 50, y: -51, z: 2 }, 3));
  assert.equal(southEdge.pathname.endsWith("/28/0/0_0_0.png"), true);
  assert.equal(lumbridge.pathname.endsWith("/28/2/0_50_50.png"), true);
  assert.equal(upperFloor.pathname.endsWith("/28/2/3_50_50.png"), true);
});

test("NPC markers sit at tile centres with northing before easting", () => {
  assert.deepEqual(questMapCenter({ x: 3209, y: 3215 }), [3215.5, 3209.5]);
  assert.deepEqual(questMapCenter({ x: 0, y: 0 }), [0.5, 0.5]);
});

test("quest starts use integer tiles inside the supported RuneScape surface", () => {
  const invalid = QUESTS.filter(
    ({ start: { map } }) =>
      !Number.isInteger(map.x) ||
      !Number.isInteger(map.y) ||
      map.x < 0 ||
      map.x >= 6400 ||
      map.y < 0 ||
      map.y >= 12800,
  ).map((quest) => ({ quest: quest.name, point: quest.start.map }));
  assert.deepEqual(invalid, []);
});
