<script setup lang="ts">
import { computed } from "vue";

import type { MarkingListItem, OrganiserCheckPointDetails, OrganiserMarkingListItem } from "@/types/nutikas";
import { checkpointTypeLabel } from "@/utils/format";

const props = defineProps<{
  checkpoints?: OrganiserCheckPointDetails[] | null;
  markings?: Array<MarkingListItem | OrganiserMarkingListItem> | null;
  title?: string;
}>();

interface MapPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: "checkpoint" | "marking";
}

const normalized = computed(() => {
  const sourcePoints = [
    ...(props.checkpoints ?? []).map((item) => ({
      id: item.id,
      lat: parseFloat(item.lat ?? ""),
      lon: parseFloat(item.lon ?? ""),
      label: `${item.cpCode ?? item.cpid ?? "CP"} · ${checkpointTypeLabel(item.checkPointType)}`,
      kind: "checkpoint" as const,
    })),
    ...(props.markings ?? []).map((item) => ({
      id: item.id,
      lat: parseFloat(item.lat ?? ""),
      lon: parseFloat(item.lon ?? ""),
      label: `${item.checkPointCPCode ?? item.checkPointCPID ?? "Mark"} · ${new Date(item.dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      kind: "marking" as const,
    })),
  ].filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  if (!sourcePoints.length) {
    return [];
  }

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
    x: 24 + ((item.lon - minLon) / lonSpan) * 552,
    y: 24 + (1 - (item.lat - minLat) / latSpan) * 272,
    label: item.label,
    kind: item.kind,
  }));
});

const track = computed(() => normalized.value.filter((item) => item.kind === "marking"));
</script>

<template>
  <section class="panel map-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Map View</p>
        <h2>{{ title ?? "Checkpoint spread and team track" }}</h2>
      </div>
      <p class="muted">Coordinates are normalised into a local SVG plot so the app can work without a third-party map SDK.</p>
    </div>

    <div v-if="normalized.length" class="map-frame">
      <svg viewBox="0 0 600 320" role="img" aria-label="Checkpoint map">
        <polyline
          v-if="track.length > 1"
          :points="track.map((item) => `${item.x},${item.y}`).join(' ')"
          class="track-line"
        />
        <g v-for="point in normalized" :key="point.id">
          <circle :cx="point.x" :cy="point.y" :class="point.kind === 'checkpoint' ? 'checkpoint-dot' : 'marking-dot'" r="8" />
          <text :x="point.x + 12" :y="point.y - 10">{{ point.label }}</text>
        </g>
      </svg>
    </div>

    <p v-else class="empty-state">No usable coordinates are available yet. Add checkpoint lat/lon or submit markings with location data to populate the map.</p>
  </section>
</template>
