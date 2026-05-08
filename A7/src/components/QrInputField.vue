<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const scanMessage = ref("Upload a QR screenshot or type the token manually.");
const scanBusy = ref(false);

async function handleFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!window.BarcodeDetector) {
    scanMessage.value = "BarcodeDetector is not available in this browser. Please paste the QR text manually.";
    return;
  }

  scanBusy.value = true;

  try {
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const bitmap = await createImageBitmap(file);
    const [result] = await detector.detect(bitmap);

    if (result?.rawValue) {
      emit("update:modelValue", result.rawValue);
      scanMessage.value = "QR content detected and copied into the field.";
    } else {
      scanMessage.value = "No QR code was detected in that image.";
    }
  } catch {
    scanMessage.value = "The selected file could not be scanned. You can still type or paste the code.";
  } finally {
    scanBusy.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="field-group">
    <label for="qr-input">QR code or CPID</label>
    <input
      id="qr-input"
      :value="props.modelValue"
      type="text"
      placeholder="START-CPID-123 or full QR content"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <div class="inline-actions">
      <label class="button ghost upload-button">
        {{ scanBusy ? "Scanning..." : "Scan from image" }}
        <input accept="image/*" capture="environment" type="file" @change="handleFile" />
      </label>
      <p class="helper">{{ scanMessage }}</p>
    </div>
  </div>
</template>
