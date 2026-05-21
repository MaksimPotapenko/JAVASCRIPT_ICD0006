<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink } from "vue-router";

import EventMap from "@/components/EventMap.vue";
import { useAuthStore } from "@/stores/auth";
import { useNutikasStore } from "@/stores/nutikas";
import { checkpointTypeLabel, formatCoordinate, formatDate } from "@/utils/format";

const props = defineProps<{
  contestId: string;
  teamId: string;
}>();

const authStore = useAuthStore();
const nutikasStore = useNutikasStore();

// team holds the fully expanded public result detail for one team route.
const team = computed(() => nutikasStore.teamResults[props.teamId]);
// Use organiser checkpoints when possible so the route can be compared against configured control points.
const checkPoints = computed(() =>
  authStore.isOrganiser
    ? (nutikasStore.organiserCheckPoints[props.contestId] ?? []).map((item) => ({ ...item, source: "organiser" as const }))
    : nutikasStore.publicCheckPoints[props.contestId] ?? [],
);

onMounted(async () => {
  // Team detail is shareable directly by URL, so it loads everything it needs on entry.
  await nutikasStore.loadTeamResult(props.contestId, props.teamId);
  await nutikasStore.loadPublicCheckpointHints(props.contestId);

  if (authStore.isOrganiser) {
    // Organisers see the richer checkpoint source on the same detail page.
    await nutikasStore.loadOrganiserContestBundle(props.contestId);
  }
});
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Team result</p>
          <h2>{{ team?.name ?? "Loading team..." }}</h2>
        </div>
        <div class="inline-actions">
          <RouterLink class="button ghost" :to="{ name: 'results', params: { contestId } }">Back to results</RouterLink>
          <span v-if="team" class="pill pill-open">{{ team.finalScore }} pts</span>
        </div>
      </div>

      <dl v-if="team" class="meta-list">
        <div>
          <dt>Members</dt>
          <dd>{{ team.memberNames }}</dd>
        </div>
        <div>
          <dt>Class</dt>
          <dd>{{ team.contestClassName }}</dd>
        </div>
        <div>
          <dt>Start</dt>
          <dd>{{ formatDate(team.startDT) }}</dd>
        </div>
        <div>
          <dt>Finish</dt>
          <dd>{{ formatDate(team.finishDT) }}</dd>
        </div>
      </dl>
    </section>

    <EventMap
      :checkpoints="checkPoints"
      :markings="team?.markings"
      subtitle="Filter checkpoints and track points to focus on starts, finishes, no-score points, or the travelled route only."
    />

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Marking history</p>
          <h2>Checkpoint timeline</h2>
        </div>
      </div>

      <div v-if="team?.markings?.length" class="stack">
        <article v-for="marking in team.markings" :key="marking.id" class="list-card">
          <div>
            <strong>{{ marking.checkPointCPCode ?? marking.checkPointCPID }}</strong>
            <p class="muted">{{ checkpointTypeLabel(marking.checkPointType) }} · {{ formatDate(marking.dt) }}</p>
          </div>
          <div class="inline-actions">
            <span class="pill">{{ marking.score }} pts</span>
            <span class="pill pill-muted">{{ formatCoordinate(marking.lat) }}, {{ formatCoordinate(marking.lon) }}</span>
          </div>
        </article>
      </div>
      <p v-else class="empty-state">No markings are available for this team yet.</p>
    </section>
  </div>
</template>
