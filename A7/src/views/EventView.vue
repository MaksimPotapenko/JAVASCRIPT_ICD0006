<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";

import QrInputField from "@/components/QrInputField.vue";
import EventMap from "@/components/EventMap.vue";
import { useAuthStore } from "@/stores/auth";
import { useNutikasStore } from "@/stores/nutikas";
import { formatDate } from "@/utils/format";

const props = defineProps<{
  contestId: string;
}>();

const authStore = useAuthStore();
const nutikasStore = useNutikasStore();
// selectedUserTeamId drives both the activation lookup and the target for new participant markings.
const selectedUserTeamId = ref("");
const actionMessage = ref<string | null>(null);

// Team registration payload for POST /Contests/{id}/teams.
const registrationForm = reactive({
  teamName: "",
  teamMembers: "",
  contestClassId: "",
});

// Participant marking payload for POST /Markings.
const markingForm = reactive({
  checkPointId: "",
  lat: "",
  lon: "",
  dt: "",
});

// contest and contestUserTeams are derived caches exposed by the Pinia store.
const contest = computed(() => nutikasStore.contestDetails[props.contestId]);
const contestUserTeams = computed(() => nutikasStore.userTeams[props.contestId] ?? []);
// selectedActivation is the latest live state for the currently inspected team.
const selectedActivation = computed(() =>
  selectedUserTeamId.value ? nutikasStore.activations[selectedUserTeamId.value] : null,
);
// Organisers can see configured checkpoints directly, while regular users get inferred public hints.
const mapCheckPoints = computed(() =>
  authStore.isOrganiser
    ? (nutikasStore.organiserCheckPoints[props.contestId] ?? []).map((item) => ({ ...item, source: "organiser" as const }))
    : nutikasStore.publicCheckPoints[props.contestId] ?? [],
);

onMounted(async () => {
  // Load the public event data first so the page can render even before auth-only calls complete.
  await nutikasStore.loadContest(props.contestId);
  await nutikasStore.loadContestResults(props.contestId);
  await nutikasStore.loadPublicCheckpointHints(props.contestId);

  if (authStore.isAuthenticated) {
    // Authenticated users also see their own registered teams for this event.
    await nutikasStore.loadUserTeamsForContest(props.contestId);
  }
});

/** Registers a team for the current contest and focuses that team for follow-up marking. */
async function registerTeam(): Promise<void> {
  actionMessage.value = null;
  const created = await nutikasStore.registerContestTeam(props.contestId, { ...registrationForm });
  selectedUserTeamId.value = created.id;
  actionMessage.value = `Team ${created.teamName ?? "created"} is registered.`;
  // Clear the form after success so the UI is ready for another registration if needed.
  registrationForm.teamName = "";
  registrationForm.teamMembers = "";
}

/** Loads the live activation state for the selected user team. */
async function openUserTeam(userTeamId: string): Promise<void> {
  selectedUserTeamId.value = userTeamId;
  await nutikasStore.loadUserTeamActivationState(userTeamId);
}

/** Submits one participant QR marking and updates the visible activation summary. */
async function submitMarking(): Promise<void> {
  actionMessage.value = null;

  // If the user did not pick a team manually, fall back to the first registered one.
  const userTeamId = selectedUserTeamId.value || contestUserTeams.value[0]?.id;
  if (!userTeamId) {
    actionMessage.value = "Register or select a team before marking checkpoints.";
    return;
  }

  const activation = await nutikasStore.submitParticipantMarking({
    // checkPointId may contain either plain CPID text or raw content decoded from the QR scanner.
    checkPointId: markingForm.checkPointId,
    userTeamId,
    lat: markingForm.lat || null,
    lon: markingForm.lon || null,
    dt: markingForm.dt ? new Date(markingForm.dt).toISOString() : null,
  });

  selectedUserTeamId.value = userTeamId;
  // Keep the success text human-readable whether the backend returned a full activation state or not.
  actionMessage.value = activation ? `Marking accepted for ${activation.teamName ?? "team"}.` : "Marking submitted.";
}

/** Copies the browser geolocation coordinates into the marking form for easier field submission. */
function useMyLocation(): void {
  navigator.geolocation.getCurrentPosition((position) => {
    // Fixed precision keeps the coordinate fields compact but still map-usable.
    markingForm.lat = position.coords.latitude.toFixed(6);
    markingForm.lon = position.coords.longitude.toFixed(6);
  });
}
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Contest</p>
          <h2>{{ contest?.name ?? "Loading event..." }}</h2>
        </div>
        <div class="inline-actions">
          <RouterLink class="button ghost" :to="{ name: 'results', params: { contestId } }">Open results</RouterLink>
        </div>
      </div>

      <dl v-if="contest" class="meta-list">
        <div>
          <dt>Registration opens</dt>
          <dd>{{ formatDate(contest.openFrom) }}</dd>
        </div>
        <div>
          <dt>Registration closes</dt>
          <dd>{{ formatDate(contest.openTo) }}</dd>
        </div>
      </dl>

      <div v-if="contest?.contestClasses?.length" class="chip-row">
        <span v-for="contestClass in contest.contestClasses" :key="contestClass.id" class="chip">
          {{ contestClass.name }} · {{ contestClass.duration }} min
        </span>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">User Flow</p>
            <h2>Register your team</h2>
          </div>
          <p class="muted">`POST /Contests/{id}/teams` using the contest classes exposed by the backend.</p>
        </div>

        <form v-if="authStore.isAuthenticated" class="stack" @submit.prevent="registerTeam">
          <div class="field-row">
            <div class="field-group">
              <label for="team-name">Team name</label>
              <input id="team-name" v-model="registrationForm.teamName" required type="text" />
            </div>

            <div class="field-group">
              <label for="contest-class">Class</label>
              <select id="contest-class" v-model="registrationForm.contestClassId" required>
                <option disabled value="">Select class</option>
                <option v-for="contestClass in contest?.contestClasses ?? []" :key="contestClass.id" :value="contestClass.id">
                  {{ contestClass.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="field-group">
            <label for="team-members">Team members</label>
            <textarea id="team-members" v-model="registrationForm.teamMembers" placeholder="Alice Example, Bob Example" required rows="3" />
          </div>

          <button class="button" type="submit">Register team</button>
        </form>

        <p v-else class="empty-state">Sign in first to register a team into this event.</p>
      </article>

      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">My teams</p>
            <h2>Activation and live score</h2>
          </div>
          <p class="muted">Pick a registered team to inspect live activation state from `GET /UserTeams/{id}`.</p>
        </div>

        <div v-if="contestUserTeams.length" class="stack">
          <article v-for="team in contestUserTeams" :key="team.id" class="list-card">
            <div>
              <strong>{{ team.teamName }}</strong>
              <p class="muted">{{ team.memberNames }}</p>
            </div>
            <div class="inline-actions">
              <span class="pill pill-muted">{{ team.contestClassName }}</span>
              <button class="button ghost" type="button" @click="openUserTeam(team.id)">Open state</button>
            </div>
          </article>
        </div>
        <p v-else class="empty-state">No registered teams yet for your account in this contest.</p>

        <article v-if="selectedActivation" class="status-card">
          <strong>{{ selectedActivation.teamName }}</strong>
          <p class="muted">{{ selectedActivation.contestClassName }}</p>
          <dl class="meta-list">
            <div>
              <dt>Start</dt>
              <dd>{{ formatDate(selectedActivation.startDT) }}</dd>
            </div>
            <div>
              <dt>Finish</dt>
              <dd>{{ formatDate(selectedActivation.finishDT) }}</dd>
            </div>
            <div>
              <dt>Final score</dt>
              <dd>{{ selectedActivation.finalScore }}</dd>
            </div>
          </dl>
        </article>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">QR marking</p>
            <h2>Start, finish, and checkpoint scan</h2>
          </div>
          <p class="muted">This form posts to `POST /Markings` with QR content, optional timestamp, and optional coordinates.</p>
        </div>

        <form class="stack" @submit.prevent="submitMarking">
          <div class="field-group">
            <label for="user-team-selector">Target team</label>
            <select id="user-team-selector" v-model="selectedUserTeamId">
              <option disabled value="">Choose registered team</option>
              <option v-for="team in contestUserTeams" :key="team.id" :value="team.id">
                {{ team.teamName }} · {{ team.contestClassName }}
              </option>
            </select>
          </div>

          <QrInputField v-model="markingForm.checkPointId" />

          <div class="field-row">
            <div class="field-group">
              <label for="lat">Latitude</label>
              <input id="lat" v-model="markingForm.lat" type="text" />
            </div>
            <div class="field-group">
              <label for="lon">Longitude</label>
              <input id="lon" v-model="markingForm.lon" type="text" />
            </div>
            <div class="field-group">
              <label for="marking-dt">Timestamp</label>
              <input id="marking-dt" v-model="markingForm.dt" type="datetime-local" />
            </div>
          </div>

          <div class="inline-actions">
            <button class="button ghost" type="button" @click="useMyLocation">Use my location</button>
            <button class="button" type="submit">Submit marking</button>
          </div>
        </form>

        <p v-if="actionMessage" class="success-text">{{ actionMessage }}</p>
        <p v-if="nutikasStore.error" class="error-text">{{ nutikasStore.error }}</p>
      </article>

      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Leaderboard preview</p>
            <h2>Top teams</h2>
          </div>
          <p class="muted">Snapshot from the public contest results endpoint.</p>
        </div>

        <div v-if="nutikasStore.contestResults[contestId]?.teams?.length" class="stack">
          <article
            v-for="team in nutikasStore.contestResults[contestId].teams?.slice(0, 5)"
            :key="team.id"
            class="list-card"
          >
            <div>
              <strong>{{ team.name }}</strong>
              <p class="muted">{{ team.memberNames }}</p>
            </div>
            <div class="inline-actions">
              <span class="pill">{{ team.finalScore }} pts</span>
              <RouterLink class="button ghost" :to="{ name: 'team-detail', params: { contestId, teamId: team.id } }">Team detail</RouterLink>
            </div>
          </article>
        </div>
        <p v-else class="empty-state">Results are not available for this contest yet.</p>
      </article>
    </section>

    <EventMap
      :checkpoints="mapCheckPoints"
      :markings="selectedActivation?.markings ?? null"
      title="Event map and active team track"
      subtitle="Public results are used to infer known checkpoints for the event. If you sign in as an organiser, configured checkpoints are shown directly."
    />
  </div>
</template>
