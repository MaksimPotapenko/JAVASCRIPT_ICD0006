<script setup lang="ts">
import { computed, reactive } from "vue";

import type { MapCheckpointPoint, MarkingListItem, OrganiserMarkingListItem } from "@/types/nutikas";
import { checkpointTypeLabel } from "@/utils/format";

const props = defineProps<{
  checkpoints?: MapCheckpointPoint[] | null;
  markings?: Array<MarkingListItem | OrganiserMarkingListItem> | null;
  title?: string;
  subtitle?: string;
}>();

interface MapPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: "checkpoint" | "marking";
  type: number;
}

// Filters let the user focus on starts/finishes/no-score checkpoints or only the travelled track.
const filters = reactive({
  showCheckpoints: true,
  showMarkings: true,
  includeRegular: true,
  includeStart: true,
  includeFinish: true,
  includeNoScore: true,
  query: "",
});

/** Normalizes geographic coordinates into SVG coordinates for the local lightweight map view. */
const normalized = computed(() => {
  const sourcePoints = [
    ...(props.checkpoints ?? []).map((item) => ({
      id: item.id,
      lat: parseFloat(item.lat ?? ""),
      lon: parseFloat(item.lon ?? ""),
      label: `${item.cpCode ?? item.cpid ?? "CP"} · ${checkpointTypeLabel(item.checkPointType)}`,
      kind: "checkpoint" as const,
      type: item.checkPointType,
    })),
    ...(props.markings ?? []).map((item) => ({
      id: item.id,
      lat: parseFloat(item.lat ?? ""),
      lon: parseFloat(item.lon ?? ""),
      label: `${item.checkPointCPCode ?? item.checkPointCPID ?? "Mark"} · ${new Date(item.dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      kind: "marking" as const,
      type: item.checkPointType,
    })),
  ].filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  if (!sourcePoints.length) {
    return [];
  }

  // Find the coordinate bounds first so all points can be scaled into the same SVG viewport.
  const latitudes = sourcePoints.map((item) => item.lat);
  const longitudes = sourcePoints.map((item) => item.lon);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latSpan = maxLat - minLat || 0.01;
  const lonSpan = maxLon - minLon || 0.01;

  return sourcePoints.map<MapPoint>((item) => ({
    id: item.id,
    // Add margins so labels are not clipped at the edges of the SVG.
    x: 24 + ((item.lon - minLon) / lonSpan) * 552,
    y: 24 + (1 - (item.lat - minLat) / latSpan) * 272,
    label: item.label,
    kind: item.kind,
    type: item.type,
  }));
});

/** Applies the current filter toggles and free-text search to the normalized map points. */
const filteredPoints = computed(() => {
  const query = filters.query.trim().toLowerCase();

  return normalized.value.filter((point) => {
    // First decide whether this point kind is visible at all.
    const matchesKind =
      (point.kind === "checkpoint" && filters.showCheckpoints) ||
      (point.kind === "marking" && filters.showMarkings);

    // Then decide whether this checkpoint type passes the type-specific checkboxes.
    const matchesType =
      (point.type === 1 && filters.includeRegular) ||
      (point.type === 2 && filters.includeFinish) ||
      (point.type === 3 && filters.includeStart) ||
      (point.type === 4 && filters.includeNoScore);

    // Free-text search filters by the already formatted label visible in the SVG.
    const matchesQuery = !query || point.label.toLowerCase().includes(query);

    return matchesKind && matchesType && matchesQuery;
  });
});

// The polyline track should connect only actual marking points, not organiser-defined checkpoints.
const track = computed(() => filteredPoints.value.filter((item) => item.kind === "marking"));
</script>

<template>
  <section class="panel map-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Map View</p>
        <h2>{{ title ?? "Checkpoint spread and team track" }}</h2>
      </div>
      <p class="muted">
        {{ subtitle ?? "Coordinates are normalised into a local SVG plot so the app can work without a third-party map SDK." }}
      </p>
    </div>

    <div class="map-filters">
      <label><input v-model="filters.showCheckpoints" type="checkbox" /> Checkpoints</label>
      <label><input v-model="filters.showMarkings" type="checkbox" /> Track</label>
      <label><input v-model="filters.includeRegular" type="checkbox" /> Regular</label>
      <label><input v-model="filters.includeStart" type="checkbox" /> Start</label>
      <label><input v-model="filters.includeFinish" type="checkbox" /> Finish</label>
      <label><input v-model="filters.includeNoScore" type="checkbox" /> NoScore</label>
      <input v-model="filters.query" class="map-search" placeholder="Filter by CP code" type="search" />
    </div>

    <div v-if="filteredPoints.length" class="map-frame">
      <svg viewBox="0 0 600 320" role="img" aria-label="Checkpoint map">
        <polyline
          v-if="track.length > 1"
          :points="track.map((item) => `${item.x},${item.y}`).join(' ')"
          class="track-line"
        />
        <g v-for="point in filteredPoints" :key="point.id">
          <circle :cx="point.x" :cy="point.y" :class="point.kind === 'checkpoint' ? 'checkpoint-dot' : 'marking-dot'" r="8" />
          <text :x="point.x + 12" :y="point.y - 10">{{ point.label }}</text>
        </g>
      </svg>
    </div>

    <p v-if="filteredPoints.length" class="muted map-caption">
      Showing {{ filteredPoints.length }} visible points with filter controls for checkpoint type and track visibility.
    </p>

    <p v-else class="empty-state">No usable coordinates are available yet. Add checkpoint lat/lon or submit markings with location data to populate the map.</p>
  </section>
</template>
