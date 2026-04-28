<script setup lang="ts">
defineProps<{
  title: string;
  intro: string;
}>();
</script>

<template>
  <section class="auth-card">
    <p class="eyebrow">A6 Backend</p>
    <h2>{{ title }}</h2>
    <p class="auth-intro">{{ intro }}</p>
    <slot />
  </section>
</template>
