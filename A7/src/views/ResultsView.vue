<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import EventMap from "@/components/EventMap.vue";
import { useAuthStore } from "@/stores/auth";
import { useNutikasStore } from "@/stores/nutikas";
import { formatDate } from "@/utils/format";

const props = defineProps<{
  contestId: string;
}>();

const authStore = useAuthStore();
const nutikasStore = useNutikasStore();
const selectedTeamId = ref("");

const results = computed(() => nutikasStore.contestResults[props.contestId]);
const selectedTeam = computed(() => (selectedTeamId.value ? nutikasStore.teamResults[selectedTeamId.value] : null));
const mapCheckPoints = computed(() =>
  authStore.isOrganiser ? nutikasStore.organiserCheckPoints[props.contestId] ?? [] : [],
);

onMounted(async () => {
  await nutikasStore.loadContestResults(props.contestId);

  const firstTeam = nutikasStore.contestResults[props.contestId]?.teams?.[0];
  if (firstTeam) {
    selectedTeamId.value = firstTeam.id;
  }

  if (authStore.isOrganiser) {
    await nutikasStore.loadOrganiserContestBundle(props.contestId);
  }
});

watch(selectedTeamId, async (teamId) => {
  if (teamId) {
    await nutikasStore.loadTeamResult(props.contestId, teamId);
  }
}, { immediate: true });
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Results</p>
          <h2>{{ results?.contest.name ?? "Contest leaderboard" }}</h2>
        </div>
        <RouterLink class="button ghost" :to="{ name: 'event', params: { contestId } }">Back to event</RouterLink>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Leaderboard</p>
            <h2>Published standings</h2>
          </div>
          <p class="muted">Choose a team to inspect its route and marking history.</p>
        </div>

        <div v-if="results?.teams?.length" class="stack">
          <article v-for="team in results.teams" :key="team.id" class="list-card">
            <div>
              <strong>{{ team.name }}</strong>
              <p class="muted">{{ team.memberNames }}</p>
            </div>
            <div class="inline-actions">
              <span class="pill">{{ team.finalScore }} pts</span>
              <button class="button ghost" type="button" @click="selectedTeamId = team.id">Inspect</button>
              <RouterLink class="button ghost" :to="{ name: 'team-detail', params: { contestId, teamId: team.id } }">Open page</RouterLink>
            </div>
          </article>
        </div>
        <p v-else class="empty-state">This event has no public result rows yet.</p>
      </article>

      <article class="panel" v-if="selectedTeam">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Team detail</p>
            <h2>{{ selectedTeam.name }}</h2>
          </div>
          <span class="pill pill-open">{{ selectedTeam.finalScore }} pts</span>
        </div>

        <dl class="meta-list">
          <div>
            <dt>Class</dt>
            <dd>{{ selectedTeam.contestClassName }}</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>{{ formatDate(selectedTeam.startDT) }}</dd>
          </div>
          <div>
            <dt>Finish</dt>
            <dd>{{ formatDate(selectedTeam.finishDT) }}</dd>
          </div>
        </dl>

        <EventMap
          :checkpoints="mapCheckPoints"
          :markings="selectedTeam.markings"
          title="User track from point to point"
        />
      </article>
    </section>
  </div>
</template>
