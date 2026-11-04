import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { wikiImage } from "./wiki";
import { externalMapUrl, questMapCenter, wikiTileUrl } from "./wikiMap";
import "./WorldMap.css";

const WORLD_BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [12800, 6400],
];
const SELECTION_SETTLE_MS = 300;

interface WorldMapProps {
  point: { x: number; y: number; plane: 0 | 1 | 2 | 3 };
  npc: string;
}

export default function WorldMap({ point, npc }: WorldMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const planeRef = useRef(point.plane);
  const visibleRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState<WorldMapProps | null>(null);
  const [tileFailed, setTileFailed] = useState(false);
  const pending =
    !rendered ||
    rendered.point.x !== point.x ||
    rendered.point.y !== point.y ||
    rendered.point.plane !== point.plane ||
    rendered.npc !== npc;

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 4,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    mapRef.current = map;
    class WikiTiles extends L.TileLayer {
      override getTileUrl(coords: L.Coords) {
        return wikiTileUrl(coords, planeRef.current);
      }
    }
    const tiles = new WikiTiles("", {
      minZoom: 0,
      maxZoom: 4,
      maxNativeZoom: 3,
      bounds: WORLD_BOUNDS,
      noWrap: true,
      updateWhenIdle: true,
      updateWhenZooming: false,
      attribution:
        'Map tiles © <a href="https://runescape.wiki/" target="_blank" rel="noreferrer">RuneScape Wiki</a> · © <a href="https://www.jagex.com/" target="_blank" rel="noreferrer">Jagex</a>',
    });
    tiles.on("tileerror", () => setTileFailed(true));
    tiles.addTo(map);
    tilesRef.current = tiles;
    markerRef.current = L.marker(questMapCenter(point), {
      icon: L.icon({
        iconUrl: wikiImage("Quest_map_icon.png"),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      keyboard: true,
    }).addTo(map);
    // Do not set the view (which requests tiles) until visible and settled.
    const intersection = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      setVisible(entry.isIntersecting);
    });
    intersection.observe(container.current);
    const resize = new ResizeObserver(() => {
      if (visibleRef.current) map.invalidateSize();
    });
    resize.observe(container.current);
    return () => {
      intersection.disconnect();
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tilesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!visible || !pending) return;
    const timer = window.setTimeout(() => {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (!map || !marker) return;
      const changedPlane = planeRef.current !== point.plane;
      planeRef.current = point.plane;
      setTileFailed(false);
      if (changedPlane) tilesRef.current?.redraw();
      const position = questMapCenter(point);
      marker.setLatLng(position);
      const label = document.createElement("span");
      label.textContent = npc;
      marker.bindTooltip(label, {
        permanent: true,
        direction: "top",
        offset: [0, -16],
      });
      marker.getElement()?.setAttribute("aria-label", `${npc} — quest start`);
      map.setView(position, 2, { animate: false });
      setRendered({ point, npc });
    }, SELECTION_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [point.x, point.y, point.plane, npc, visible, pending]);

  return (
    <section className="world-map" aria-label={`Map of ${npc}'s quest start`}>
      <div className="world-map-stage" aria-busy={pending}>
        <button
          className="world-map-recenter"
          type="button"
          disabled={pending}
          onClick={() =>
            mapRef.current?.setView(questMapCenter(point), 2, {
              animate: false,
            })
          }
        >
          Recenter
        </button>
        <div
          ref={container}
          className="world-map-canvas"
          inert={pending}
          aria-hidden={pending}
          aria-label={`Interactive map showing ${npc}'s quest start`}
        />
        {pending && (
          <div className="world-map-loading" role="status">
            Preparing map…
          </div>
        )}
      </div>
      {tileFailed && (
        <p className="world-map-error" role="status">
          Some map tiles could not be loaded.{" "}
          <a href={externalMapUrl(point)} target="_blank" rel="noreferrer">
            Open the world map
          </a>
          .
        </p>
      )}
    </section>
  );
}
