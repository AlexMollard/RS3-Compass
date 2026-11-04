import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS } from "../src/data.ts";
import { externalMapUrl, questMapCenter, wikiTileUrl } from "../src/wikiMap.ts";

test("north-up Leaflet rows address Wiki tiles without a one-row shift", () => {
  const southEdge = new URL(wikiTileUrl({ x: 0, y: -1, z: 0 }, 0));
  const lumbridge = new URL(wikiTileUrl({ x: 50, y: -51, z: 2 }, 0));
  const upperFloor = new URL(wikiTileUrl({ x: 50, y: -51, z: 2 }, 3));
  assert.equal(southEdge.pathname.endsWith("/28/0/0_0_0.png"), true);
  assert.equal(lumbridge.pathname.endsWith("/28/2/0_50_50.png"), true);
  assert.equal(upperFloor.pathname.endsWith("/28/2/3_50_50.png"), true);
});

test("Instance tiles and external links retain their map identity instead of pointing at the mainland", () => {
  const island = { x: 3789, y: 4274, plane: 0, mapId: 714 };
  const hollow = { x: 608, y: 1709, plane: 0, mapId: 752 };
  assert.equal(
    new URL(
      wikiTileUrl({ x: 59, y: -67, z: 2 }, 0, island.mapId),
    ).pathname.endsWith("/714/2/0_59_66.png"),
    true,
  );
  assert.equal(
    new URL(
      wikiTileUrl({ x: 9, y: -27, z: 2 }, 0, hollow.mapId),
    ).pathname.endsWith("/752/2/0_9_26.png"),
    true,
  );
  assert.equal(new URL(externalMapUrl(island)).searchParams.get("m"), "714");
  assert.equal(new URL(externalMapUrl(hollow)).searchParams.get("m"), "752");
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
