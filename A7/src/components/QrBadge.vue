<script setup lang="ts">
import QRCode from "qrcode";
import { ref, watchEffect } from "vue";

const props = defineProps<{
  value: string;
  label: string;
}>();

const dataUrl = ref("");

watchEffect(async () => {
  dataUrl.value = await QRCode.toDataURL(props.value, {
    margin: 1,
    width: 160,
    color: {
      dark: "#0f2747",
      light: "#ffffff",
    },
  });
});
</script>

<template>
  <figure class="qr-card">
    <img :src="dataUrl" :alt="`QR code for ${label}`" />
    <figcaption>
      <strong>{{ label }}</strong>
      <span>{{ value }}</span>
    </figcaption>
  </figure>
</template>
