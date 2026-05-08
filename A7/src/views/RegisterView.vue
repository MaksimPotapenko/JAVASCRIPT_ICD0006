<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const error = ref<string | null>(null);

const form = reactive({
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const passwordMismatch = computed(() => form.confirmPassword.length > 0 && form.password !== form.confirmPassword);

async function submit(): Promise<void> {
  error.value = null;

  if (passwordMismatch.value) {
    error.value = "Passwords do not match.";
    return;
  }

  try {
    await authStore.register({
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email,
      password: form.password,
    });
    await router.push({ name: "home" });
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Registration failed";
  }
}
</script>

<template>
  <section class="auth-grid">
    <article class="panel auth-panel">
      <p class="eyebrow">User Flow</p>
      <h2>Create a Nutikas account</h2>
      <p class="muted">Registration goes directly against the Nutikas identity API and signs you in immediately.</p>

      <form class="stack" @submit.prevent="submit">
        <div class="field-row">
          <div class="field-group">
            <label for="firstname">First name</label>
            <input id="firstname" v-model="form.firstname" required type="text" />
          </div>

          <div class="field-group">
            <label for="lastname">Last name</label>
            <input id="lastname" v-model="form.lastname" required type="text" />
          </div>
        </div>

        <div class="field-group">
          <label for="register-email">Email</label>
          <input id="register-email" v-model="form.email" autocomplete="email" required type="email" />
        </div>

        <div class="field-row">
          <div class="field-group">
            <label for="register-password">Password</label>
            <input id="register-password" v-model="form.password" autocomplete="new-password" required type="password" />
          </div>

          <div class="field-group">
            <label for="confirm-password">Confirm password</label>
            <input id="confirm-password" v-model="form.confirmPassword" autocomplete="new-password" required type="password" />
          </div>
        </div>

        <p v-if="passwordMismatch" class="error-text">Passwords must match.</p>
        <p v-else-if="error" class="error-text">{{ error }}</p>

        <button class="button" :disabled="authStore.busy || passwordMismatch" type="submit">
          {{ authStore.busy ? "Creating account..." : "Create account" }}
        </button>
      </form>
    </article>

    <article class="panel info-panel">
      <p class="eyebrow">After registration</p>
      <ul class="feature-list">
        <li>Browse open events and register teams into the correct class.</li>
        <li>Submit QR markings with optional live location data.</li>
        <li>Review event leaderboards and team tracks without leaving the app.</li>
      </ul>
    </article>
  </section>
</template>
