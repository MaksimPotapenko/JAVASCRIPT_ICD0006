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

const team = computed(() => nutikasStore.teamResults[props.teamId]);
const checkPoints = computed(() => nutikasStore.organiserCheckPoints[props.contestId] ?? []);

onMounted(async () => {
  await nutikasStore.loadTeamResult(props.contestId, props.teamId);

  if (authStore.isOrganiser) {
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

    <EventMap :checkpoints="checkPoints" :markings="team?.markings" />

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
