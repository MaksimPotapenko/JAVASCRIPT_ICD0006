<script setup lang="ts">
import { reactive } from "vue";
import { RouterLink } from "vue-router";

import AuthCard from "@/components/AuthCard.vue";
import { useAuthStore } from "@/stores/auth";

/** Exposes auth actions and state for the login screen. */
const authStore = useAuthStore();

/** Stores the editable login form fields before they are submitted to the auth store. */
const form = reactive({
  email: "",
  password: "",
});

/**
 * Submits the login form through the auth store so navigation and error handling stay centralized.
 */
async function submit() {
  await authStore.login({ ...form });
}
</script>

<template>
  <AuthCard
    title="Sign in"
    intro="Sign in to the Northstar workspace. Sessions are protected with JWTs, backed by refresh-token renewal, and routed through your own A6 backend."
  >
    <form class="stack" @submit.prevent="submit">
      <label class="field">
        <span>Email</span>
        <input v-model.trim="form.email" type="email" autocomplete="email" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="authStore.error" class="message error">{{ authStore.error }}</p>

      <button class="button" type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? "Signing in..." : "Sign in" }}
      </button>

      <p class="footer-note">
        Need an account?
        <RouterLink to="/register">Create one here</RouterLink>.
      </p>
    </form>
  </AuthCard>
</template>
