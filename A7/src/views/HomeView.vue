<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { useNutikasStore } from "@/stores/nutikas";
import { formatDate } from "@/utils/format";

const authStore = useAuthStore();
const nutikasStore = useNutikasStore();

onMounted(() => {
  // The homepage only needs the public contest catalogue, so load it immediately on entry.
  void nutikasStore.loadContests();
});
</script>

<template>
  <section class="content-grid">
    <article class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Events</p>
          <h2>Contest catalogue</h2>
        </div>
        <p class="muted">Public list from `GET /Contests`, with direct links into registration and result views.</p>
      </div>

      <p v-if="nutikasStore.error" class="error-text">{{ nutikasStore.error }}</p>
      <div class="card-grid">
        <article v-for="contest in nutikasStore.sortedContests" :key="contest.id" class="event-card">
          <div class="event-card__top">
            <div>
              <h3>{{ contest.name }}</h3>
              <p class="muted">Open {{ formatDate(contest.openFrom) }} → {{ formatDate(contest.openTo) }}</p>
            </div>
            <span class="pill" :class="contest.isOpenForParticipation ? 'pill-open' : 'pill-muted'">
              {{ contest.isOpenForParticipation ? "Open" : "Closed" }}
            </span>
          </div>

          <dl class="meta-list">
            <div>
              <dt>Visible from</dt>
              <dd>{{ formatDate(contest.visibleFrom) }}</dd>
            </div>
            <div>
              <dt>Results</dt>
              <dd>{{ contest.hasResults ? "Published" : "Pending" }}</dd>
            </div>
          </dl>

          <div class="inline-actions">
            <RouterLink class="button" :to="{ name: 'event', params: { contestId: contest.id } }">Open event</RouterLink>
            <RouterLink class="button ghost" :to="{ name: 'results', params: { contestId: contest.id } }">Results</RouterLink>
          </div>
        </article>
      </div>
    </article>

    <article class="panel side-panel">
      <p class="eyebrow">Workspace</p>
      <h2>What this client covers</h2>
      <ul class="feature-list">
        <li>Register and sign in against Nutikas identity with JWT + refresh token persistence.</li>
        <li>Create a team for a contest class and submit QR-based markings with location data.</li>
        <li>Inspect team detail, leaderboards, and a lightweight map/track visualisation.</li>
        <li v-if="authStore.isOrganiser">Organiser tools are unlocked for your current account.</li>
      </ul>

      <div class="status-card">
        <strong>{{ authStore.isAuthenticated ? "Authenticated" : "Guest mode" }}</strong>
        <p class="muted">
          {{ authStore.isAuthenticated ? `Signed in as ${authStore.email}` : "You can browse events now and sign in when you are ready to register a team." }}
        </p>
      </div>

      <RouterLink v-if="authStore.isOrganiser" class="button" :to="{ name: 'organiser' }">Open organiser workspace</RouterLink>
      <RouterLink v-else-if="!authStore.isAuthenticated" class="button" :to="{ name: 'login' }">Sign in</RouterLink>
    </article>
  </section>
</template>
