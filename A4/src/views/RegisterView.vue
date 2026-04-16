<script setup lang="ts">
import { reactive } from "vue";
import { RouterLink } from "vue-router";

import AuthCard from "@/components/AuthCard.vue";
import { useAuthStore } from "@/stores/auth";

/** Exposes auth actions and state for the registration screen. */
const authStore = useAuthStore();

/** Stores the editable registration form fields before they are submitted to the auth store. */
const form = reactive({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
});

/**
 * Submits the registration form through the auth store and lets the store handle session setup.
 */
async function submit() {
  await authStore.register({ ...form });
}
</script>

<template>
  <AuthCard
    title="Create account"
    intro="Registration returns both a JWT and refresh token immediately, so the app can continue directly into the protected Todo workspace."
  >
    <form class="stack" @submit.prevent="submit">
      <div class="grid two-up">
        <label class="field">
          <span>First name</span>
          <input v-model.trim="form.firstName" type="text" autocomplete="given-name" required />
        </label>

        <label class="field">
          <span>Last name</span>
          <input v-model.trim="form.lastName" type="text" autocomplete="family-name" required />
        </label>
      </div>

      <label class="field">
        <span>Email</span>
        <input v-model.trim="form.email" type="email" autocomplete="email" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="form.password" type="password" autocomplete="new-password" required minlength="6" />
      </label>

      <p v-if="authStore.error" class="message error">{{ authStore.error }}</p>

      <button class="button" type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? "Creating account..." : "Register" }}
      </button>

      <p class="footer-note">
        Already registered?
        <RouterLink to="/login">Sign in</RouterLink>.
      </p>
    </form>
  </AuthCard>
</template>
