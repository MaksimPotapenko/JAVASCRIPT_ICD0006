<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";

import { getApiBaseUrl } from "@/services/api";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const apiBaseUrl = getApiBaseUrl();

// Show a friendly shell label whether the user is anonymous or authenticated.
const accountLabel = computed(() => authStore.email ?? "Guest");

/** Logs the user out through the store, then brings the shell back to the public home page. */
async function signOut(): Promise<void> {
  await authStore.logout();
  await router.push({ name: "home" });
}
</script>

<template>
  <div class="shell">
    <header class="app-header">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <span class="brand-mark">N</span>
        <span>
          <strong>Northstar Routes</strong>
          <small>Nutikas assignment client</small>
        </span>
      </RouterLink>

      <nav class="main-nav">
        <RouterLink :to="{ name: 'home' }">Events</RouterLink>
        <RouterLink v-if="authStore.isOrganiser" :to="{ name: 'organiser' }">Organiser</RouterLink>
        <a href="https://mpotap.proxy.itcollege.ee/">Back to main page</a>
        <RouterLink v-if="!authStore.isAuthenticated" :to="{ name: 'login' }">Login</RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated" :to="{ name: 'register' }">Register</RouterLink>
        <button v-if="authStore.isAuthenticated" class="nav-button" type="button" @click="signOut">Logout</button>
      </nav>
    </header>

    <main class="app-main">
      <section class="hero">
        <div>
          <p class="eyebrow">Assignment 7</p>
          <h1>Vue full client app for Nutikas user and organiser flows.</h1>
          <p class="hero-copy">
            Register runners, submit start and checkpoint scans with coordinates, inspect results, and manage organiser-side contests from the same Vue workspace.
          </p>
        </div>
        <dl class="hero-meta">
          <div>
            <dt>Signed in as</dt>
            <dd>{{ accountLabel }}</dd>
          </div>
          <div>
            <dt>API target</dt>
            <dd>{{ apiBaseUrl }}</dd>
          </div>
        </dl>
      </section>

      <RouterView />
    </main>
  </div>
</template>
