<script setup lang="ts">
import { reactive } from "vue";
import { RouterLink } from "vue-router";

import AuthCard from "@/components/AuthCard.vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

async function submit() {
  await authStore.login({ ...form });
}
</script>

<template>
  <AuthCard
    title="Sign in"
    intro="Use your TalTech Todo API account. Access tokens are stored with a refresh token and renewed automatically on 401 responses."
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
