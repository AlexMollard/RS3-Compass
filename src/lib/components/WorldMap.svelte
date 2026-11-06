<script lang="ts">
  import { onMount } from "svelte";
  import type * as Leaflet from "leaflet";
  import type { QuestRecord } from "../../data";
  import { wikiHref, wikiImage } from "../../wiki";
  import { mapTilesNotice } from "../sourceStatus";
  import SourceBanner from "./SourceBanner.svelte";
  import { externalMapUrl, questMapCenter, wikiTileUrl } from "../../wikiMap";
  import "leaflet/dist/leaflet.css";
  import "../../WorldMap.css";

  type Point = QuestRecord["start"]["map"];
  let {
    point,
    label,
    markerIcon = "Quest_map_icon.png",
    markerWiki,
  }: {
    point: Point;
    label: string;
    markerIcon?: string;
    markerWiki?: string;
  } = $props();
  const bounds: Leaflet.LatLngBoundsExpression = [
    [0, 0],
    [12800, 6400],
  ];
  let container: HTMLDivElement;
  let map: Leaflet.Map | undefined;
  let marker: Leaflet.Marker | undefined;
  let tiles: Leaflet.TileLayer | undefined;
  let makeIcon: ((file: string) => Leaflet.Icon) | undefined;
  let plane: Point["plane"] = 0;
  let mapId = 28;
  let visible = $state(false);
  let ready = $state(false);
  let tileFailed = $state(false);
  let rendered = $state<{
    point: Point;
    label: string;
    markerIcon: string;
  } | null>(null);
  let pending = $derived(
    !rendered ||
      rendered.point.x !== point.x ||
      rendered.point.y !== point.y ||
      rendered.point.plane !== point.plane ||
      rendered.point.mapId !== point.mapId ||
      rendered.label !== label ||
      rendered.markerIcon !== markerIcon,
  );

  onMount(() => {
    let disposed = false;
    let intersection: IntersectionObserver | undefined;
    let resize: ResizeObserver | undefined;
    void import("leaflet").then((L) => {
      if (disposed) return;
      map = L.map(container, {
        crs: L.CRS.Simple,
        minZoom: 0,
        maxZoom: 4,
        maxBounds: bounds,
        maxBoundsViscosity: 1,
        scrollWheelZoom: false,
        zoomControl: true,
      });
      tiles = L.tileLayer("", {
        minZoom: 0,
        maxZoom: 4,
        maxNativeZoom: 3,
        bounds,
        noWrap: true,
        updateWhenIdle: true,
        updateWhenZooming: false,
        attribution:
          'Map tiles © <a href="https://runescape.wiki/" target="_blank" rel="noreferrer">RuneScape Wiki</a> · © <a href="https://www.jagex.com/" target="_blank" rel="noreferrer">Jagex</a>',
      });
      tiles.getTileUrl = (coords) => wikiTileUrl(coords, plane, mapId);
      tiles.on("tileerror", () => {
        tileFailed = true;
      });
      makeIcon = (file) =>
        L.icon({
          iconUrl: wikiImage(file),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      marker = L.marker(questMapCenter(point), {
        icon: makeIcon(markerIcon),
        keyboard: true,
      }).addTo(map);
      marker.on("click", () => {
        if (markerWiki)
          window.open(wikiHref(markerWiki), "_blank", "noopener,noreferrer");
      });
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      intersection.observe(container);
      resize = new ResizeObserver(() => {
        if (visible && map) map.invalidateSize();
      });
      resize.observe(container);
      ready = true;
    });
    return () => {
      disposed = true;
      intersection?.disconnect();
      resize?.disconnect();
      map?.remove();
      map = undefined;
      marker = undefined;
      tiles = undefined;
    };
  });

  $effect(() => {
    const selected = {
      point: { x: point.x, y: point.y, plane: point.plane, mapId: point.mapId },
      label,
      markerIcon,
    };
    if (!ready || !map || !tiles || !marker || !makeIcon) return;
    const currentMap = map;
    const currentTiles = tiles;
    const currentMarker = marker;
    const icon = makeIcon;
    // Detach immediately while hidden or changing selection, so no old-view tiles load.
    if (currentMap.hasLayer(currentTiles)) currentMap.removeLayer(currentTiles);
    if (!visible) return;
    const timer = window.setTimeout(() => {
      plane = selected.point.plane;
      mapId = selected.point.mapId ?? 28;
      tileFailed = false;
      const position = questMapCenter(selected.point);
      currentMarker.setLatLng(position);
      if (rendered?.markerIcon !== selected.markerIcon)
        currentMarker.setIcon(icon(selected.markerIcon));
      const tooltip = document.createElement("span");
      tooltip.textContent = selected.label;
      currentMarker.bindTooltip(tooltip, {
        permanent: true,
        direction: "bottom",
        offset: [0, 16],
      });
      currentMap.invalidateSize();
      currentMap.setView(position, 2, { animate: false });
      currentMarker.getElement()?.setAttribute("aria-label", selected.label);
      currentTiles.addTo(currentMap);
      rendered = selected;
    }, 300);
    return () => window.clearTimeout(timer);
  });
</script>

<section class="world-map" aria-label={`Map of ${label}`}>
  <div class="world-map-stage" aria-busy={pending}>
    <button
      class="world-map-recenter"
      type="button"
      disabled={pending}
      onclick={() => map?.setView(questMapCenter(point), 2, { animate: false })}
      >Recenter</button
    >
    <div
      bind:this={container}
      class="world-map-canvas"
      inert={pending}
      aria-hidden={pending}
      aria-label={`Interactive map showing ${label}`}
    ></div>
    {#if pending}<div class="world-map-loading" role="status">
        Preparing map…
      </div>{/if}
  </div>
  {#if tileFailed && !pending}<SourceBanner notice={mapTilesNotice()}>
      <a
        class="text-link"
        href={externalMapUrl(point)}
        target="_blank"
        rel="noreferrer">Open the world map</a
      >
    </SourceBanner>{/if}
</section>
