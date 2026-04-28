<script setup lang="ts">
defineProps<{
  title: string;
  intro: string;
}>();
</script>

<template>
  <section class="auth-card">
    <div class="auth-card-badge">A6 backend connected</div>
    <p class="eyebrow">Northstar Access</p>
    <h2>{{ title }}</h2>
    <p class="auth-intro">{{ intro }}</p>
    <slot />
  </section>
</template>
