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
      <div>
        <p class="eyebrow">Assignment 4</p>
        <h1>Vue 3 Todo Client</h1>
      </div>
      <div v-if="authStore.isAuthenticated" class="topbar-actions">
        <div class="identity-card">
          <span>{{ authStore.fullName }}</span>
          <small>{{ authStore.email }}</small>
        </div>
        <button class="button ghost" type="button" @click="handleLogout">Log out</button>
      </div>
      <div v-else-if="!isAuthRoute" class="identity-card">
        <span>Guest</span>
        <small>Authentication required</small>
      </div>
    </header>

    <main class="page-wrap">
      <RouterView />
    </main>
  </div>
</template>
