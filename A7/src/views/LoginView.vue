<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const error = ref<string | null>(null);

const form = reactive({
  email: "",
  password: "",
});

async function submit(): Promise<void> {
  error.value = null;

  try {
    await authStore.login({ ...form });
    const next = typeof route.query.next === "string" ? route.query.next : "/";
    await router.push(next);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Login failed";
  }
}
</script>

<template>
  <section class="auth-grid">
    <article class="panel auth-panel">
      <p class="eyebrow">Identity</p>
      <h2>Sign in to continue</h2>
      <p class="muted">Use your Nutikas credentials. Organiser routes appear automatically when the JWT contains the `organiser` role.</p>

      <form class="stack" @submit.prevent="submit">
        <div class="field-group">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" autocomplete="email" required type="email" />
        </div>

        <div class="field-group">
          <label for="password">Password</label>
          <input id="password" v-model="form.password" autocomplete="current-password" required type="password" />
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="button" :disabled="authStore.busy" type="submit">
          {{ authStore.busy ? "Signing in..." : "Sign in" }}
        </button>
      </form>
    </article>

    <article class="panel info-panel">
      <p class="eyebrow">What opens after login</p>
      <ul class="feature-list">
        <li>User flow: register team, mark start/finish/checkpoints, and inspect event results.</li>
        <li>Organiser flow: manage contests, classes, checkpoints, teams, QR print sheets, and markings.</li>
        <li>Refresh-token renewal is automatic whenever the backend returns `401`.</li>
      </ul>
    </article>
  </section>
</template>
