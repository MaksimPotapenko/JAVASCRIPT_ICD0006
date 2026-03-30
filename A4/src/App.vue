<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const route = useRoute();

const isAuthRoute = computed(() => route.name === "login" || route.name === "register");

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
