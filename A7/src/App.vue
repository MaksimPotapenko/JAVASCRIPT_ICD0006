<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { useAuthStore } from "@/stores/auth";

/** Holds reactive auth state for the app shell header and logout action. */
const authStore = useAuthStore();
/** Exposes the current route so the shell can adjust itself on auth pages. */
const route = useRoute();

/** Tells the shell whether the current page is one of the guest auth routes. */
const isAuthRoute = computed(() => route.name === "login" || route.name === "register");

/**
 * Delegates logout to the auth store so token cleanup and routing happen in one place.
 */
function handleLogout() {
  authStore.logout();
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand-block">
        <p class="eyebrow">Assignment 7</p>
        <h1>Northstar Workspace</h1>
        <p class="brand-copy">A polished Vue client for your own A6 API, shaped like a small product workspace instead of a coursework clone.</p>
      </div>
      <div v-if="authStore.isAuthenticated" class="topbar-actions">
        <div class="identity-card">
          <span>{{ authStore.fullName }}</span>
          <small>{{ authStore.email }}</small>
        </div>
        <div class="header-pill">Vue 3 + Pinia + A6</div>
        <a class="button ghost nav-link-button" href="https://mpotap.proxy.itcollege.ee/">Main hub</a>
        <button class="button ghost" type="button" @click="handleLogout">Log out</button>
      </div>
      <div v-else class="topbar-actions">
        <div v-if="!isAuthRoute" class="identity-card">
          <span>Guest</span>
          <small>Authentication required</small>
        </div>
        <div class="header-pill">Full client app</div>
        <a class="button ghost nav-link-button" href="https://mpotap.proxy.itcollege.ee/">Main hub</a>
      </div>
    </header>

    <main class="page-wrap">
      <RouterView />
    </main>
  </div>
</template>
