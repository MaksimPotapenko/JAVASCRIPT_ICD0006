<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

import EventMap from "@/components/EventMap.vue";
import QrBadge from "@/components/QrBadge.vue";
import { useNutikasStore } from "@/stores/nutikas";
import { checkpointTypeLabel, formatCoordinate, formatDate, formatDateInput, markingTypeLabel } from "@/utils/format";

const nutikasStore = useNutikasStore();

// Selection refs decide which contest/team/marking the organiser workspace is currently editing.
const selectedContestId = ref("");
const selectedTeamId = ref("");
const editingContestId = ref<string | null>(null);
const editingClassId = ref<string | null>(null);
const editingPointId = ref<string | null>(null);
const editingTeamId = ref<string | null>(null);
const editingMarkingId = ref<string | null>(null);
const memberEmail = ref("");

// Contest form mirrors organiser contest create/update payload fields.
const contestForm = reactive({
  name: "",
  visibleFrom: "",
  openFrom: "",
  openTo: "",
  bonusTimeStart: "",
  bonusTimeEnd: "",
  bonusPerMarking: 0,
  organisationId: "",
});

// Contest class form configures class ordering, duration, and penalties.
const classForm = reactive({
  name: "",
  orderNr: 1,
  duration: 60,
  maxDuration: 0,
  overDurationUnit: 1,
  overDurationPenalty: 0,
});

// Checkpoint form covers CPID/code, type, score, and optional map coordinates.
const pointForm = reactive({
  cpid: "",
  cpCode: "",
  checkPointType: 1,
  score: 0,
  lat: "",
  lon: "",
});

// Team form is used for organiser-created teams and manual score edits.
const teamForm = reactive({
  name: "",
  memberNames: "",
  contestClassId: "",
  startDT: "",
  finishDT: "",
  score: 0,
  bonus: 0,
  penalty: 0,
  finalScore: 0,
});

// createMarkingForm is used when the organiser submits a marking on behalf of a team.
const createMarkingForm = reactive({
  checkPointId: "",
  dt: "",
  lat: "",
  lon: "",
});

// updateMarkingForm is populated from one fetched marking detail row for editing.
const updateMarkingForm = reactive({
  dt: "",
  lat: "",
  lon: "",
  markingType: 0,
  score: 0,
  checkPointId: "",
  userTeamId: "",
});

// These computed wrappers keep the template readable while still sourcing data from the central store.
const organisations = computed(() => nutikasStore.organiserOrganisations);
const contests = computed(() => nutikasStore.organiserContests);
const contestClasses = computed(() => nutikasStore.organiserClasses[selectedContestId.value] ?? []);
const checkPoints = computed(() => nutikasStore.organiserCheckPoints[selectedContestId.value] ?? []);
const teams = computed(() => nutikasStore.organiserTeams[selectedContestId.value] ?? []);
const teamMembers = computed(() => (selectedTeamId.value ? nutikasStore.organiserUserTeams[selectedTeamId.value] ?? [] : []));
const markings = computed(() => nutikasStore.organiserMarkings[selectedContestId.value] ?? []);
const markingDetails = computed(() => (editingMarkingId.value ? nutikasStore.organiserMarkingDetails[editingMarkingId.value] : null));

onMounted(async () => {
  // Boot the organiser workspace with organisations and contest list first.
  await nutikasStore.loadOrganiserHome();

  const firstContest = nutikasStore.organiserContests[0];
  if (firstContest) {
    // Preselect the first contest so the rest of the dashboard can populate automatically.
    selectedContestId.value = firstContest.id;
  }
});

watch(selectedContestId, async (contestId) => {
  if (!contestId) {
    return;
  }

  // Changing the selected contest reloads all admin subresources tied to that contest.
  await nutikasStore.loadOrganiserContestBundle(contestId);
  // Reset team selection because the previous team belonged to a different contest context.
  selectedTeamId.value = "";
});

watch(selectedTeamId, async (teamId) => {
  if (teamId) {
    // Team selection drives the member-management panel.
    await nutikasStore.loadOrganiserTeamMembers(teamId);
  }
});

watch(editingMarkingId, async (markingId) => {
  if (!markingId) {
    return;
  }

  // Editing a marking fetches the latest server copy, then maps it into the local form fields.
  await nutikasStore.loadMarking(markingId);
  const detail = nutikasStore.organiserMarkingDetails[markingId];
  if (detail) {
    // Copy the fetched backend values into the editable form fields one by one.
    updateMarkingForm.dt = formatDateInput(detail.dt);
    updateMarkingForm.lat = detail.lat ?? "";
    updateMarkingForm.lon = detail.lon ?? "";
    updateMarkingForm.markingType = detail.markingType;
    updateMarkingForm.score = detail.score;
    updateMarkingForm.checkPointId = detail.checkPointId;
    updateMarkingForm.userTeamId = detail.userTeamId;
  }
});

/** Creates or updates the selected contest depending on whether edit mode is active. */
async function submitContest(): Promise<void> {
  const payload = {
    name: contestForm.name,
    visibleFrom: toIso(contestForm.visibleFrom),
    openFrom: toIso(contestForm.openFrom),
    openTo: toIso(contestForm.openTo),
    bonusTimeStart: toNullableIso(contestForm.bonusTimeStart),
    bonusTimeEnd: toNullableIso(contestForm.bonusTimeEnd),
    bonusPerMarking: Number(contestForm.bonusPerMarking),
    organisationId: contestForm.organisationId,
  };

  if (editingContestId.value) {
    await nutikasStore.saveContest(editingContestId.value, payload);
  } else {
    await nutikasStore.createContest(payload);
  }

  // Reset back to create mode after a successful save.
  resetContestForm();
}

/** Creates or updates a contest class for the currently selected contest. */
async function submitClass(): Promise<void> {
  if (!selectedContestId.value) {
    return;
  }

  const payload = {
    name: classForm.name,
    orderNr: Number(classForm.orderNr),
    duration: Number(classForm.duration),
    maxDuration: classForm.maxDuration ? Number(classForm.maxDuration) : null,
    overDurationUnit: Number(classForm.overDurationUnit),
    overDurationPenalty: Number(classForm.overDurationPenalty),
  };

  if (editingClassId.value) {
    await nutikasStore.saveContestClass(selectedContestId.value, editingClassId.value, payload);
  } else {
    await nutikasStore.createContestClass(selectedContestId.value, payload);
  }

  // Clearing the form makes it obvious that the save finished and avoids accidental duplicate edits.
  resetClassForm();
}

/** Creates or updates a checkpoint, including optional lat/lon used by the map views. */
async function submitPoint(): Promise<void> {
  if (!selectedContestId.value) {
    return;
  }

  const payload = {
    cpid: pointForm.cpid,
    cpCode: pointForm.cpCode,
    checkPointType: Number(pointForm.checkPointType),
    score: Number(pointForm.score),
    lat: pointForm.lat || null,
    lon: pointForm.lon || null,
  };

  if (editingPointId.value) {
    await nutikasStore.saveCheckPoint(selectedContestId.value, editingPointId.value, payload);
  } else {
    await nutikasStore.createCheckPoint(selectedContestId.value, payload);
  }

  resetPointForm();
}

/** Creates or updates a team inside the current organiser-selected contest. */
async function submitTeam(): Promise<void> {
  if (!selectedContestId.value) {
    return;
  }

  const payload = {
    name: teamForm.name,
    memberNames: teamForm.memberNames,
    contestClassId: teamForm.contestClassId,
    startDT: toNullableIso(teamForm.startDT),
    finishDT: toNullableIso(teamForm.finishDT),
    score: Number(teamForm.score),
    bonus: Number(teamForm.bonus),
    penalty: Number(teamForm.penalty),
    finalScore: Number(teamForm.finalScore),
  };

  if (editingTeamId.value) {
    await nutikasStore.saveTeam(selectedContestId.value, editingTeamId.value, payload);
  } else {
    await nutikasStore.createTeam(selectedContestId.value, payload);
  }

  resetTeamForm();
}

/** Creates a manual organiser marking for the currently selected team. */
async function submitCreateMarking(): Promise<void> {
  if (!selectedContestId.value || !selectedTeamId.value) {
    return;
  }

  // Organiser marking creation uses checkpoint GUIDs, not participant QR text payloads.
  await nutikasStore.createTeamMarking(selectedContestId.value, selectedTeamId.value, {
    checkPointId: createMarkingForm.checkPointId,
    dt: toIso(createMarkingForm.dt),
    lat: createMarkingForm.lat || null,
    lon: createMarkingForm.lon || null,
  });

  createMarkingForm.checkPointId = "";
  createMarkingForm.dt = "";
  createMarkingForm.lat = "";
  createMarkingForm.lon = "";
}

/** Saves edits to an existing marking row. */
async function submitUpdateMarking(): Promise<void> {
  if (!selectedContestId.value || !editingMarkingId.value) {
    return;
  }

  await nutikasStore.saveMarking(selectedContestId.value, editingMarkingId.value, {
    dt: toIso(updateMarkingForm.dt),
    lat: updateMarkingForm.lat || null,
    lon: updateMarkingForm.lon || null,
    markingType: Number(updateMarkingForm.markingType),
    score: Number(updateMarkingForm.score),
    checkPointId: updateMarkingForm.checkPointId,
    userTeamId: updateMarkingForm.userTeamId,
  });
}

/** Adds a user to the selected team by email. */
async function submitTeamMember(): Promise<void> {
  if (!selectedTeamId.value || !memberEmail.value) {
    return;
  }

  await nutikasStore.addTeamMember(selectedTeamId.value, { email: memberEmail.value });
  memberEmail.value = "";
}

/** Copies the selected contest into the contest form so the organiser can edit it. */
function editContest(): void {
  const contest = contests.value.find((item) => item.id === selectedContestId.value);
  if (!contest) {
    return;
  }

  editingContestId.value = contest.id;
  // Pre-fill the organiser form with the currently selected contest values.
  contestForm.name = contest.name ?? "";
  contestForm.visibleFrom = formatDateInput(contest.visibleFrom);
  contestForm.openFrom = formatDateInput(contest.openFrom);
  contestForm.openTo = formatDateInput(contest.openTo);
  contestForm.bonusTimeStart = formatDateInput(contest.bonusTimeStart);
  contestForm.bonusTimeEnd = formatDateInput(contest.bonusTimeEnd);
  contestForm.bonusPerMarking = contest.bonusPerMarking;
  contestForm.organisationId = contest.organisationId;
}

/** Copies one contest class into the class form. */
function editClass(classId: string): void {
  const item = contestClasses.value.find((entry) => entry.id === classId);
  if (!item) {
    return;
  }

  editingClassId.value = classId;
  // Copy values from the chosen class row into the shared editing form.
  classForm.name = item.name ?? "";
  classForm.orderNr = item.orderNr;
  classForm.duration = item.duration;
  classForm.maxDuration = item.maxDuration ?? 0;
  classForm.overDurationUnit = item.overDurationUnit;
  classForm.overDurationPenalty = item.overDurationPenalty;
}

/** Copies one checkpoint into the checkpoint form for editing. */
function editPoint(pointId: string): void {
  const item = checkPoints.value.find((entry) => entry.id === pointId);
  if (!item) {
    return;
  }

  editingPointId.value = pointId;
  // This makes the checkpoint form double as both "create" and "edit" UI.
  pointForm.cpid = item.cpid ?? "";
  pointForm.cpCode = item.cpCode ?? "";
  pointForm.checkPointType = item.checkPointType;
  pointForm.score = item.score;
  pointForm.lat = item.lat ?? "";
  pointForm.lon = item.lon ?? "";
}

/** Copies one team into the organiser team form and selects it for related member management. */
function editTeam(teamId: string): void {
  const item = teams.value.find((entry) => entry.id === teamId);
  if (!item) {
    return;
  }

  editingTeamId.value = teamId;
  // Selecting the edited team also opens the member-management context for that same team.
  teamForm.name = item.name ?? "";
  teamForm.memberNames = item.memberNames ?? "";
  teamForm.contestClassId = item.contestClassId;
  teamForm.startDT = formatDateInput(item.startDT);
  teamForm.finishDT = formatDateInput(item.finishDT);
  teamForm.score = item.score;
  teamForm.bonus = item.bonus;
  teamForm.penalty = item.penalty;
  teamForm.finalScore = item.finalScore;
  selectedTeamId.value = teamId;
}

/** Resets the contest form back to create mode defaults. */
function resetContestForm(): void {
  editingContestId.value = null;
  contestForm.name = "";
  contestForm.visibleFrom = "";
  contestForm.openFrom = "";
  contestForm.openTo = "";
  contestForm.bonusTimeStart = "";
  contestForm.bonusTimeEnd = "";
  contestForm.bonusPerMarking = 0;
  // Default to the first organisation when available so new contest creation needs fewer clicks.
  contestForm.organisationId = organisations.value[0]?.id ?? "";
}

/** Resets the class form back to its default state. */
function resetClassForm(): void {
  editingClassId.value = null;
  classForm.name = "";
  classForm.orderNr = 1;
  classForm.duration = 60;
  classForm.maxDuration = 0;
  classForm.overDurationUnit = 1;
  classForm.overDurationPenalty = 0;
}

/** Resets the checkpoint form back to a blank checkpoint template. */
function resetPointForm(): void {
  editingPointId.value = null;
  pointForm.cpid = "";
  pointForm.cpCode = "";
  pointForm.checkPointType = 1;
  pointForm.score = 0;
  pointForm.lat = "";
  pointForm.lon = "";
}

/** Resets the team form back to its default values. */
function resetTeamForm(): void {
  editingTeamId.value = null;
  teamForm.name = "";
  teamForm.memberNames = "";
  teamForm.contestClassId = "";
  teamForm.startDT = "";
  teamForm.finishDT = "";
  teamForm.score = 0;
  teamForm.bonus = 0;
  teamForm.penalty = 0;
  teamForm.finalScore = 0;
}

/** Opens the browser print dialog for the checkpoint QR section. */
function printPage(): void {
  // Used for checkpoint QR print sheets from the organiser workspace.
  window.print();
}

/** Converts a datetime-local value into the ISO string expected by the backend. */
function toIso(value: string): string {
  // Browser datetime-local inputs produce local time text, so convert it into backend-friendly ISO.
  return new Date(value).toISOString();
}

/** Converts an optional datetime-local field into either ISO text or null. */
function toNullableIso(value: string): string | null {
  return value ? toIso(value) : null;
}
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Organiser Flow</p>
          <h2>Contest control room</h2>
        </div>
        <p class="muted">Everything here targets the organiser endpoints on Nutikas and is intended for accounts with the `organiser` role.</p>
      </div>

      <p v-if="nutikasStore.error" class="error-text">{{ nutikasStore.error }}</p>

      <div class="field-row">
        <div class="field-group">
          <label for="contest-selector">Selected contest</label>
          <select id="contest-selector" v-model="selectedContestId">
            <option disabled value="">Choose contest</option>
            <option v-for="contest in contests" :key="contest.id" :value="contest.id">
              {{ contest.name }} · {{ contest.organisationName }}
            </option>
          </select>
        </div>
        <button class="button ghost" type="button" @click="editContest">Edit selected contest</button>
        <button v-if="selectedContestId" class="button danger" type="button" @click="nutikasStore.removeContest(selectedContestId)">Delete contest</button>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Contest CRUD</p>
            <h2>{{ editingContestId ? "Update contest" : "Create contest" }}</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitContest">
          <div class="field-group">
            <label for="contest-name">Name</label>
            <input id="contest-name" v-model="contestForm.name" required type="text" />
          </div>
          <div class="field-group">
            <label for="organisation">Organisation</label>
            <select id="organisation" v-model="contestForm.organisationId" required>
              <option disabled value="">Choose organisation</option>
              <option v-for="organisation in organisations" :key="organisation.id" :value="organisation.id">
                {{ organisation.organisationName }}
              </option>
            </select>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="visible-from">Visible from</label>
              <input id="visible-from" v-model="contestForm.visibleFrom" required type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="open-from">Open from</label>
              <input id="open-from" v-model="contestForm.openFrom" required type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="open-to">Open to</label>
              <input id="open-to" v-model="contestForm.openTo" required type="datetime-local" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="bonus-start">Bonus start</label>
              <input id="bonus-start" v-model="contestForm.bonusTimeStart" type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="bonus-end">Bonus end</label>
              <input id="bonus-end" v-model="contestForm.bonusTimeEnd" type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="bonus-per">Bonus per marking</label>
              <input id="bonus-per" v-model.number="contestForm.bonusPerMarking" type="number" />
            </div>
          </div>
          <div class="inline-actions">
            <button class="button" type="submit">{{ editingContestId ? "Save contest" : "Create contest" }}</button>
            <button class="button ghost" type="button" @click="resetContestForm">Reset</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Contest classes</p>
            <h2>{{ editingClassId ? "Update class" : "Add class" }}</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitClass">
          <div class="field-group">
            <label for="class-name">Name</label>
            <input id="class-name" v-model="classForm.name" required type="text" />
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="order">Order</label>
              <input id="order" v-model.number="classForm.orderNr" type="number" />
            </div>
            <div class="field-group">
              <label for="duration">Duration</label>
              <input id="duration" v-model.number="classForm.duration" type="number" />
            </div>
            <div class="field-group">
              <label for="max-duration">Max duration</label>
              <input id="max-duration" v-model.number="classForm.maxDuration" type="number" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="over-unit">Over duration unit</label>
              <input id="over-unit" v-model.number="classForm.overDurationUnit" type="number" />
            </div>
            <div class="field-group">
              <label for="over-penalty">Penalty</label>
              <input id="over-penalty" v-model.number="classForm.overDurationPenalty" type="number" />
            </div>
          </div>
          <div class="inline-actions">
            <button class="button" :disabled="!selectedContestId" type="submit">{{ editingClassId ? "Save class" : "Add class" }}</button>
            <button class="button ghost" type="button" @click="resetClassForm">Reset</button>
          </div>
        </form>

        <div class="stack compact-top">
          <article v-for="item in contestClasses" :key="item.id" class="list-card">
            <div>
              <strong>{{ item.name }}</strong>
              <p class="muted">Order {{ item.orderNr }} · {{ item.duration }} min</p>
            </div>
            <div class="inline-actions">
              <button class="button ghost" type="button" @click="editClass(item.id)">Edit</button>
              <button class="button danger" type="button" @click="nutikasStore.removeContestClass(selectedContestId, item.id)">Delete</button>
            </div>
          </article>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Checkpoints</p>
            <h2>{{ editingPointId ? "Update checkpoint" : "Create checkpoint" }}</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitPoint">
          <div class="field-row">
            <div class="field-group">
              <label for="cpid">CPID</label>
              <input id="cpid" v-model="pointForm.cpid" required type="text" />
            </div>
            <div class="field-group">
              <label for="cpcode">Code</label>
              <input id="cpcode" v-model="pointForm.cpCode" required type="text" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="checkpoint-type">Type</label>
              <select id="checkpoint-type" v-model.number="pointForm.checkPointType">
                <option :value="1">Regular</option>
                <option :value="2">Start</option>
                <option :value="3">Finish</option>
                <option :value="4">Bonus</option>
              </select>
            </div>
            <div class="field-group">
              <label for="checkpoint-score">Score</label>
              <input id="checkpoint-score" v-model.number="pointForm.score" type="number" />
            </div>
            <div class="field-group">
              <label for="checkpoint-lat">Latitude</label>
              <input id="checkpoint-lat" v-model="pointForm.lat" type="text" />
            </div>
            <div class="field-group">
              <label for="checkpoint-lon">Longitude</label>
              <input id="checkpoint-lon" v-model="pointForm.lon" type="text" />
            </div>
          </div>
          <div class="inline-actions">
            <button class="button" :disabled="!selectedContestId" type="submit">{{ editingPointId ? "Save checkpoint" : "Add checkpoint" }}</button>
            <button class="button ghost" type="button" @click="resetPointForm">Reset</button>
          </div>
        </form>

        <div class="stack compact-top">
          <article v-for="point in checkPoints" :key="point.id" class="list-card">
            <div>
              <strong>{{ point.cpCode }}</strong>
              <p class="muted">{{ checkpointTypeLabel(point.checkPointType) }} · {{ point.score }} pts · {{ formatCoordinate(point.lat) }}, {{ formatCoordinate(point.lon) }}</p>
            </div>
            <div class="inline-actions">
              <button class="button ghost" type="button" @click="editPoint(point.id)">Edit</button>
              <button class="button danger" type="button" @click="nutikasStore.removeCheckPoint(selectedContestId, point.id)">Delete</button>
            </div>
          </article>
        </div>
      </article>

      <article class="panel print-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Print view</p>
            <h2>Checkpoint QR sheets</h2>
          </div>
          <button class="button ghost" type="button" @click="printPage">Print</button>
        </div>

        <div class="qr-grid">
          <QrBadge
            v-for="point in checkPoints"
            :key="point.id"
            :label="point.cpCode ?? point.cpid ?? 'Checkpoint'"
            :value="point.cpid ?? ''"
          />
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Teams</p>
            <h2>{{ editingTeamId ? "Update team" : "Create team" }}</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitTeam">
          <div class="field-row">
            <div class="field-group">
              <label for="team-name-org">Team name</label>
              <input id="team-name-org" v-model="teamForm.name" required type="text" />
            </div>
            <div class="field-group">
              <label for="team-class-org">Class</label>
              <select id="team-class-org" v-model="teamForm.contestClassId" required>
                <option disabled value="">Choose class</option>
                <option v-for="item in contestClasses" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="field-group">
            <label for="member-names-org">Member names</label>
            <textarea id="member-names-org" v-model="teamForm.memberNames" required rows="3" />
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="start-org">Start</label>
              <input id="start-org" v-model="teamForm.startDT" type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="finish-org">Finish</label>
              <input id="finish-org" v-model="teamForm.finishDT" type="datetime-local" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="score-org">Score</label>
              <input id="score-org" v-model.number="teamForm.score" type="number" />
            </div>
            <div class="field-group">
              <label for="bonus-org">Bonus</label>
              <input id="bonus-org" v-model.number="teamForm.bonus" type="number" />
            </div>
            <div class="field-group">
              <label for="penalty-org">Penalty</label>
              <input id="penalty-org" v-model.number="teamForm.penalty" type="number" />
            </div>
            <div class="field-group">
              <label for="final-org">Final score</label>
              <input id="final-org" v-model.number="teamForm.finalScore" type="number" />
            </div>
          </div>
          <div class="inline-actions">
            <button class="button" :disabled="!selectedContestId" type="submit">{{ editingTeamId ? "Save team" : "Create team" }}</button>
            <button class="button ghost" type="button" @click="resetTeamForm">Reset</button>
          </div>
        </form>

        <div class="stack compact-top">
          <article v-for="team in teams" :key="team.id" class="list-card">
            <div>
              <strong>{{ team.name }}</strong>
              <p class="muted">{{ team.memberNames }}</p>
            </div>
            <div class="inline-actions">
              <span class="pill">{{ team.finalScore }} pts</span>
              <button class="button ghost" type="button" @click="editTeam(team.id)">Edit</button>
              <button class="button ghost" type="button" @click="selectedTeamId = team.id">Members</button>
              <button class="button danger" type="button" @click="nutikasStore.removeTeam(selectedContestId, team.id)">Delete</button>
            </div>
          </article>
        </div>
      </article>

      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Team members</p>
            <h2>{{ selectedTeamId ? "Manage linked users" : "Select a team" }}</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitTeamMember">
          <div class="field-row">
            <div class="field-group">
              <label for="member-email">Add user by email</label>
              <input id="member-email" v-model="memberEmail" :disabled="!selectedTeamId" type="email" />
            </div>
            <button class="button" :disabled="!selectedTeamId" type="submit">Add member</button>
          </div>
        </form>

        <div v-if="teamMembers.length" class="stack compact-top">
          <article v-for="member in teamMembers" :key="member.id" class="list-card">
            <div>
              <strong>{{ member.email }}</strong>
              <p class="muted">{{ member.userId }}</p>
            </div>
            <button class="button danger" type="button" @click="nutikasStore.removeTeamMember(selectedTeamId, member.id)">Remove</button>
          </article>
        </div>
        <p v-else class="empty-state">Choose a team to manage membership bindings.</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Organiser markings</p>
            <h2>Create manual marking</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitCreateMarking">
          <div class="field-row">
            <div class="field-group">
              <label for="target-team">Target team</label>
              <select id="target-team" v-model="selectedTeamId">
                <option disabled value="">Choose team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label for="target-checkpoint">Checkpoint</label>
              <select id="target-checkpoint" v-model="createMarkingForm.checkPointId">
                <option disabled value="">Choose checkpoint</option>
                <option v-for="point in checkPoints" :key="point.id" :value="point.id">
                  {{ point.cpCode }} · {{ checkpointTypeLabel(point.checkPointType) }}
                </option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="marking-dt-org">Timestamp</label>
              <input id="marking-dt-org" v-model="createMarkingForm.dt" required type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="marking-lat-org">Latitude</label>
              <input id="marking-lat-org" v-model="createMarkingForm.lat" type="text" />
            </div>
            <div class="field-group">
              <label for="marking-lon-org">Longitude</label>
              <input id="marking-lon-org" v-model="createMarkingForm.lon" type="text" />
            </div>
          </div>
          <button class="button" :disabled="!selectedContestId || !selectedTeamId" type="submit">Create marking</button>
        </form>

        <div class="stack compact-top">
          <article v-for="marking in markings" :key="marking.id" class="list-card">
            <div>
              <strong>{{ marking.teamName }} · {{ marking.checkPointCPCode }}</strong>
              <p class="muted">{{ markingTypeLabel(marking.markingType) }} · {{ formatDate(marking.dt) }}</p>
            </div>
            <div class="inline-actions">
              <span class="pill">{{ marking.score }} pts</span>
              <button class="button ghost" type="button" @click="editingMarkingId = marking.id">Edit</button>
              <button class="button danger" type="button" @click="nutikasStore.removeMarking(selectedContestId, marking.id)">Delete</button>
            </div>
          </article>
        </div>
      </article>

      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Edit marking</p>
            <h2>{{ markingDetails?.checkPointCPCode ?? "Pick a marking" }}</h2>
          </div>
        </div>

        <form class="stack" @submit.prevent="submitUpdateMarking">
          <div class="field-row">
            <div class="field-group">
              <label for="edit-dt">Timestamp</label>
              <input id="edit-dt" v-model="updateMarkingForm.dt" :disabled="!editingMarkingId" type="datetime-local" />
            </div>
            <div class="field-group">
              <label for="edit-type">Type</label>
              <select id="edit-type" v-model.number="updateMarkingForm.markingType" :disabled="!editingMarkingId">
                <option :value="0">Manual</option>
                <option :value="1">Start</option>
                <option :value="2">Finish</option>
              </select>
            </div>
            <div class="field-group">
              <label for="edit-score">Score</label>
              <input id="edit-score" v-model.number="updateMarkingForm.score" :disabled="!editingMarkingId" type="number" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="edit-checkpoint">Checkpoint</label>
              <select id="edit-checkpoint" v-model="updateMarkingForm.checkPointId" :disabled="!editingMarkingId">
                <option v-for="point in checkPoints" :key="point.id" :value="point.id">
                  {{ point.cpCode }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label for="edit-user-team">User team id</label>
              <input id="edit-user-team" v-model="updateMarkingForm.userTeamId" :disabled="!editingMarkingId" type="text" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="edit-lat">Latitude</label>
              <input id="edit-lat" v-model="updateMarkingForm.lat" :disabled="!editingMarkingId" type="text" />
            </div>
            <div class="field-group">
              <label for="edit-lon">Longitude</label>
              <input id="edit-lon" v-model="updateMarkingForm.lon" :disabled="!editingMarkingId" type="text" />
            </div>
          </div>
          <button class="button" :disabled="!editingMarkingId" type="submit">Save marking</button>
        </form>
      </article>
    </section>

    <EventMap
      :checkpoints="checkPoints.map((item) => ({ ...item, source: 'organiser' as const }))"
      :markings="markings"
      title="Organiser overview map"
      subtitle="Configured checkpoints and submitted markings can be filtered by type or hidden independently."
    />
  </div>
</template>
