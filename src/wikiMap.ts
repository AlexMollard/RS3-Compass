import type { QuestRecord } from "./data";

type StartPoint = QuestRecord["start"]["map"];

// Pin the Wiki's verified cache version so map updates are deliberate.
const TILE_ROOT =
  "https://maps.runescape.wiki/rs/versions/2026-10-12-a/map_icon_squares/28";

export function wikiTileUrl(
  tile: { x: number; y: number; z: number },
  plane: StartPoint["plane"],
) {
  // Leaflet's north-up CRS has negative tile rows; Wiki rows increase northward.
  return `${TILE_ROOT}/${tile.z}/${plane}_${tile.x}_${-tile.y - 1}.png`;
}

export function questMapCenter(
  point: Pick<StartPoint, "x" | "y">,
): [number, number] {
  return [point.y + 0.5, point.x + 0.5];
}

export function externalMapUrl(point: StartPoint) {
  return `https://mejrs.github.io/rs3?m=28&z=2&p=${point.plane}&x=${point.x}&y=${point.y}`;
}
