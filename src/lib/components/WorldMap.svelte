<script lang="ts">
  import { onMount } from "svelte";
  import type * as Leaflet from "leaflet";
  import type { QuestRecord } from "../../data";
  import { wikiImage } from "../../wiki";
  import { externalMapUrl, questMapCenter, wikiTileUrl } from "../../wikiMap";
  import "leaflet/dist/leaflet.css";
  import "../../WorldMap.css";

  type Point = QuestRecord["start"]["map"];
  let { point, npc }: { point: Point; npc: string } = $props();
  const bounds: Leaflet.LatLngBoundsExpression = [
    [0, 0],
    [12800, 6400],
  ];
  let container: HTMLDivElement;
  let map: Leaflet.Map | undefined;
  let marker: Leaflet.Marker | undefined;
  let tiles: Leaflet.TileLayer | undefined;
  let plane: Point["plane"] = 0;
  let visible = $state(false);
  let ready = $state(false);
  let tileFailed = $state(false);
  let rendered = $state<{ point: Point; npc: string } | null>(null);
  let pending = $derived(
    !rendered ||
      rendered.point.x !== point.x ||
      rendered.point.y !== point.y ||
      rendered.point.plane !== point.plane ||
      rendered.npc !== npc,
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
      tiles.getTileUrl = (coords) => wikiTileUrl(coords, plane);
      tiles.on("tileerror", () => {
        tileFailed = true;
      });
      marker = L.marker(questMapCenter(point), {
        icon: L.icon({
          iconUrl: wikiImage("Quest_map_icon.png"),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        keyboard: true,
      }).addTo(map);
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
      point: { x: point.x, y: point.y, plane: point.plane },
      npc,
    };
    if (!ready || !map || !tiles || !marker) return;
    const currentMap = map;
    const currentTiles = tiles;
    const currentMarker = marker;
    // Detach immediately while hidden or changing selection, so no old-view tiles load.
    if (currentMap.hasLayer(currentTiles)) currentMap.removeLayer(currentTiles);
    if (!visible) return;
    const timer = window.setTimeout(() => {
      plane = selected.point.plane;
      tileFailed = false;
      const position = questMapCenter(selected.point);
      currentMarker.setLatLng(position);
      const label = document.createElement("span");
      label.textContent = selected.npc;
      currentMarker.bindTooltip(label, {
        permanent: true,
        direction: "top",
        offset: [0, -16],
      });
      currentMap.invalidateSize();
      currentMap.setView(position, 2, { animate: false });
      currentMarker
        .getElement()
        ?.setAttribute("aria-label", `${selected.npc} — quest start`);
      currentTiles.addTo(currentMap);
      rendered = selected;
    }, 300);
    return () => window.clearTimeout(timer);
  });
</script>

<section class="world-map" aria-label={`Map of ${npc}'s quest start`}>
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
      aria-label={`Interactive map showing ${npc}'s quest start`}
    ></div>
    {#if pending}<div class="world-map-loading" role="status">
        Preparing map…
      </div>{/if}
  </div>
  {#if tileFailed && !pending}<p class="world-map-error" role="status">
      Some map tiles could not be loaded. <a
        href={externalMapUrl(point)}
        target="_blank"
        rel="noreferrer">Open the world map</a
      >.
    </p>{/if}
</section>
