<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const scanMessage = ref("Upload a QR screenshot, scan with the camera, or type the token manually.");
const scanBusy = ref(false);
const cameraBusy = ref(false);
const cameraActive = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);

let stream: MediaStream | null = null;
let scanIntervalId: number | null = null;

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

async function startCameraScan(): Promise<void> {
  if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
    scanMessage.value = "Live camera scanning is not supported in this browser.";
    return;
  }

  cameraBusy.value = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    if (!videoRef.value) {
      throw new Error("Video element is not ready");
    }

    videoRef.value.srcObject = stream;
    await videoRef.value.play();
    cameraActive.value = true;
    scanMessage.value = "Camera is active. Point it at a checkpoint QR code.";

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    scanIntervalId = window.setInterval(async () => {
      if (!videoRef.value || !cameraActive.value) {
        return;
      }

      try {
        const [result] = await detector.detect(videoRef.value);
        if (result?.rawValue) {
          emit("update:modelValue", result.rawValue);
          scanMessage.value = "QR code detected from live camera feed.";
          stopCameraScan();
        }
      } catch {
        // Ignore transient detection failures while the camera stream is warming up.
      }
    }, 500);
  } catch {
    scanMessage.value = "Camera access failed. You can still upload a screenshot or paste the token.";
    stopCameraScan();
  } finally {
    cameraBusy.value = false;
  }
}

function stopCameraScan(): void {
  if (scanIntervalId !== null) {
    window.clearInterval(scanIntervalId);
    scanIntervalId = null;
  }

  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.srcObject = null;
  }

  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }

  stream = null;
  cameraActive.value = false;
}

onBeforeUnmount(() => {
  stopCameraScan();
});
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
      <button v-if="!cameraActive" class="button ghost" :disabled="cameraBusy" type="button" @click="startCameraScan">
        {{ cameraBusy ? "Starting camera..." : "Scan live" }}
      </button>
      <button v-else class="button ghost" type="button" @click="stopCameraScan">Stop camera</button>
    </div>
    <video v-if="cameraActive" ref="videoRef" class="scanner-preview" autoplay muted playsinline />
    <p class="helper">{{ scanMessage }}</p>
  </div>
</template>
