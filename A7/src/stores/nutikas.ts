import { computed, ref } from "vue";
import { defineStore } from "pinia";

import {
  addOrganiserUserTeam,
  createOrganiserCheckPoint,
  createOrganiserContest,
  createOrganiserContestClass,
  createOrganiserMarking,
  createOrganiserTeam,
  createParticipantMarking,
  deleteOrganiserCheckPoint,
  deleteOrganiserContest,
  deleteOrganiserContestClass,
  deleteOrganiserMarking,
  deleteOrganiserTeam,
  deleteOrganiserUserTeam,
  fetchContest,
  fetchContestResults,
  fetchContests,
  fetchOrganisations,
  fetchOrganiserCheckPoints,
  fetchOrganiserContestClasses,
  fetchOrganiserContests,
  fetchOrganiserMarking,
  fetchOrganiserMarkings,
  fetchOrganiserTeams,
  fetchOrganiserUserTeams,
  fetchTeamResult,
  fetchUserTeamActivation,
  fetchUserTeams,
  registerTeam,
  updateOrganiserCheckPoint,
  updateOrganiserContest,
  updateOrganiserContestClass,
  updateOrganiserMarking,
  updateOrganiserTeam,
} from "@/services/nutikas";
import type {
  ContestDetails,
  ContestResults,
  ContestListItem,
  MapCheckpointPoint,
  MarkingRequest,
  OrganisationItem,
  OrganiserAddUserTeamRequest,
  OrganiserCheckPointDetails,
  OrganiserCheckPointUpsertRequest,
  OrganiserContestClassDetails,
  OrganiserContestClassUpsertRequest,
  OrganiserContestDetails,
  OrganiserContestUpsertRequest,
  OrganiserMarkingCreateRequest,
  OrganiserMarkingDetails,
  OrganiserMarkingListItem,
  OrganiserMarkingUpdateRequest,
  OrganiserTeamDetails,
  OrganiserTeamUpsertRequest,
  OrganiserUserTeamItem,
  TeamRegistrationRequest,
  TeamResultDetail,
  UserTeamActivation,
  UserTeamListItem,
} from "@/types/nutikas";

export const useNutikasStore = defineStore("nutikas", () => {
  // Public contest and user-flow caches.
  const contests = ref<ContestListItem[]>([]);
  const contestDetails = ref<Record<string, ContestDetails>>({});
  const contestResults = ref<Record<string, ContestResults>>({});
  const teamResults = ref<Record<string, TeamResultDetail>>({});
  const userTeams = ref<Record<string, UserTeamListItem[]>>({});
  const activations = ref<Record<string, UserTeamActivation>>({});
  // Organiser workspace caches keyed by contest/team/marking ids where appropriate.
  const organiserOrganisations = ref<OrganisationItem[]>([]);
  const organiserContests = ref<OrganiserContestDetails[]>([]);
  const organiserClasses = ref<Record<string, OrganiserContestClassDetails[]>>({});
  const organiserCheckPoints = ref<Record<string, OrganiserCheckPointDetails[]>>({});
  const publicCheckPoints = ref<Record<string, MapCheckpointPoint[]>>({});
  const organiserTeams = ref<Record<string, OrganiserTeamDetails[]>>({});
  const organiserUserTeams = ref<Record<string, OrganiserUserTeamItem[]>>({});
  const organiserMarkings = ref<Record<string, OrganiserMarkingListItem[]>>({});
  const organiserMarkingDetails = ref<Record<string, OrganiserMarkingDetails>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  // The homepage lists contests from earliest opening date to latest.
  const sortedContests = computed(() =>
    [...contests.value].sort((left, right) => left.openFrom.localeCompare(right.openFrom)),
  );

  /** Loads the public contest catalogue. */
  async function loadContests(): Promise<void> {
    // Empty fallback means the home page can still render a stable empty state on failure.
    contests.value = await run(fetchContests, []);
  }

  /** Loads one contest detail bundle for the event page. */
  async function loadContest(contestId: string): Promise<void> {
    contestDetails.value[contestId] = await run(() => fetchContest(contestId));
  }

  /** Loads the public leaderboard for one contest. */
  async function loadContestResults(contestId: string): Promise<void> {
    contestResults.value[contestId] = await run(() => fetchContestResults(contestId));
  }

  /** Loads one team's public route/marking detail. */
  async function loadTeamResult(contestId: string, teamId: string): Promise<void> {
    teamResults.value[teamId] = await run(() => fetchTeamResult(contestId, teamId));
  }

  /** Registers a new team and appends it to the local team cache for the contest. */
  async function registerContestTeam(contestId: string, payload: TeamRegistrationRequest): Promise<UserTeamListItem> {
    const team = await run(() => registerTeam(contestId, payload));
    // Append instead of full reload so the new team appears instantly after a successful register.
    userTeams.value[contestId] = [...(userTeams.value[contestId] ?? []), team];
    return team;
  }

  /** Loads all teams owned by the current authenticated user inside a contest. */
  async function loadUserTeamsForContest(contestId: string): Promise<void> {
    userTeams.value[contestId] = await run(() => fetchUserTeams(contestId), []);
  }

  /** Loads live activation state for one user team after registration or marking. */
  async function loadUserTeamActivationState(userTeamId: string): Promise<void> {
    activations.value[userTeamId] = await run(() => fetchUserTeamActivation(userTeamId));
  }

  /** Submits a participant marking and updates cached activation state if the backend returns it. */
  async function submitParticipantMarking(payload: MarkingRequest): Promise<UserTeamActivation | null> {
    const response = await run(() => createParticipantMarking(payload));

    if (!response.statusOk) {
      const message = response.message ?? `Marking was rejected with status code ${response.statusCode}.`;
      error.value = message;
      throw new Error(message);
    }

    if (response.result) {
      // This lets the event page reflect fresh score/start/finish state immediately after scanning.
      activations.value[payload.userTeamId] = response.result;
    }

    // Some API responses may accept the marking without returning a full activation payload.
    return response.result;
  }

  /** Loads the organiser landing data used to bootstrap the admin workspace. */
  async function loadOrganiserHome(): Promise<void> {
    organiserOrganisations.value = await run(fetchOrganisations, []);
    organiserContests.value = await run(fetchOrganiserContests, []);
  }

  /** Creates a contest and appends it to the organiser contest list. */
  async function createContest(payload: OrganiserContestUpsertRequest): Promise<void> {
    const contest = await run(() => createOrganiserContest(payload));
    // New organiser contests are appended to the already loaded list without forcing a reload.
    organiserContests.value = [...organiserContests.value, contest];
  }

  /** Saves contest edits and replaces the cached row in place. */
  async function saveContest(contestId: string, payload: OrganiserContestUpsertRequest): Promise<void> {
    const contest = await run(() => updateOrganiserContest(contestId, payload));
    // Replace only the changed row so selection state and scroll position remain stable in the UI.
    organiserContests.value = organiserContests.value.map((item) => (item.id === contestId ? contest : item));
  }

  /** Removes a contest from both the backend and the local contest list. */
  async function removeContest(contestId: string): Promise<void> {
    await run(() => deleteOrganiserContest(contestId), undefined);
    organiserContests.value = organiserContests.value.filter((item) => item.id !== contestId);
  }

  /** Loads all organiser sub-resources needed to manage one selected contest. */
  async function loadOrganiserContestBundle(contestId: string): Promise<void> {
    // These requests are intentionally separated because each resource powers a different panel.
    organiserClasses.value[contestId] = await run(() => fetchOrganiserContestClasses(contestId), []);
    organiserCheckPoints.value[contestId] = await run(() => fetchOrganiserCheckPoints(contestId), []);
    organiserTeams.value[contestId] = await run(() => fetchOrganiserTeams(contestId), []);
    organiserMarkings.value[contestId] = await run(() => fetchOrganiserMarkings(contestId), []);
  }

  /** Builds a best-effort public checkpoint set by mining published marking coordinates from results. */
  async function loadPublicCheckpointHints(contestId: string): Promise<void> {
    const results = contestResults.value[contestId] ?? await run(() => fetchContestResults(contestId));
    // Cache the result list so later views do not need to fetch the same leaderboard again.
    contestResults.value[contestId] = results;

    // Public results do not always expose organiser checkpoints directly, so infer them from team markings.
    const details = await run(
      () => Promise.all((results.teams ?? []).map((team) => fetchTeamResult(contestId, team.id))),
      [],
    );

    publicCheckPoints.value[contestId] = deduplicateCheckpoints(
      details.flatMap((team) => team.markings ?? []).map((marking) => ({
        // Public result details reveal enough metadata to synthesize a map-friendly checkpoint list.
        id: marking.checkPointId,
        contestId,
        cpid: marking.checkPointCPID,
        cpCode: marking.checkPointCPCode,
        checkPointType: marking.checkPointType,
        score: marking.score,
        lat: marking.lat,
        lon: marking.lon,
        source: "public-marking" as const,
      })),
    );
  }

  /** Creates a contest class inside the selected contest. */
  async function createContestClass(contestId: string, payload: OrganiserContestClassUpsertRequest): Promise<void> {
    const created = await run(() => createOrganiserContestClass(contestId, payload));
    // Keep the selected contest's class list warm after each mutation.
    organiserClasses.value[contestId] = [...(organiserClasses.value[contestId] ?? []), created];
  }

  /** Saves an existing contest class and updates the local cache entry. */
  async function saveContestClass(contestId: string, classId: string, payload: OrganiserContestClassUpsertRequest): Promise<void> {
    const updated = await run(() => updateOrganiserContestClass(classId, payload));
    organiserClasses.value[contestId] = replaceById(organiserClasses.value[contestId], classId, updated);
  }

  /** Deletes a contest class from the selected contest cache. */
  async function removeContestClass(contestId: string, classId: string): Promise<void> {
    await run(() => deleteOrganiserContestClass(classId), undefined);
    organiserClasses.value[contestId] = (organiserClasses.value[contestId] ?? []).filter((item) => item.id !== classId);
  }

  /** Creates a checkpoint for the selected contest. */
  async function createCheckPoint(contestId: string, payload: OrganiserCheckPointUpsertRequest): Promise<void> {
    const created = await run(() => createOrganiserCheckPoint(contestId, payload));
    // Newly created checkpoints immediately become available for QR printing and map plotting.
    organiserCheckPoints.value[contestId] = [...(organiserCheckPoints.value[contestId] ?? []), created];
  }

  /** Saves edits to one checkpoint and replaces it in the current cache. */
  async function saveCheckPoint(contestId: string, pointId: string, payload: OrganiserCheckPointUpsertRequest): Promise<void> {
    const updated = await run(() => updateOrganiserCheckPoint(pointId, payload));
    organiserCheckPoints.value[contestId] = replaceById(organiserCheckPoints.value[contestId], pointId, updated);
  }

  /** Deletes a checkpoint from the selected contest. */
  async function removeCheckPoint(contestId: string, pointId: string): Promise<void> {
    await run(() => deleteOrganiserCheckPoint(pointId), undefined);
    organiserCheckPoints.value[contestId] = (organiserCheckPoints.value[contestId] ?? []).filter((item) => item.id !== pointId);
  }

  /** Creates a team directly from the organiser workspace. */
  async function createTeam(contestId: string, payload: OrganiserTeamUpsertRequest): Promise<void> {
    const created = await run(() => createOrganiserTeam(contestId, payload));
    // The organiser team table updates locally so the user sees the inserted team right away.
    organiserTeams.value[contestId] = [...(organiserTeams.value[contestId] ?? []), created];
  }

  /** Saves organiser-side team edits. */
  async function saveTeam(contestId: string, teamId: string, payload: OrganiserTeamUpsertRequest): Promise<void> {
    const updated = await run(() => updateOrganiserTeam(teamId, payload));
    organiserTeams.value[contestId] = replaceById(organiserTeams.value[contestId], teamId, updated);
  }

  /** Deletes an organiser-managed team. */
  async function removeTeam(contestId: string, teamId: string): Promise<void> {
    await run(() => deleteOrganiserTeam(teamId), undefined);
    organiserTeams.value[contestId] = (organiserTeams.value[contestId] ?? []).filter((item) => item.id !== teamId);
  }

  /** Loads members for the organiser-selected team. */
  async function loadOrganiserTeamMembers(teamId: string): Promise<void> {
    organiserUserTeams.value[teamId] = await run(() => fetchOrganiserUserTeams(teamId), []);
  }

  /** Adds a user to a team and appends it to the local member list. */
  async function addTeamMember(teamId: string, payload: OrganiserAddUserTeamRequest): Promise<void> {
    const created = await run(() => addOrganiserUserTeam(teamId, payload));
    // Append the freshly created user-team relation to avoid another round trip.
    organiserUserTeams.value[teamId] = [...(organiserUserTeams.value[teamId] ?? []), created];
  }

  /** Removes a user-team link from the current team member list. */
  async function removeTeamMember(teamId: string, userTeamId: string): Promise<void> {
    await run(() => deleteOrganiserUserTeam(userTeamId), undefined);
    organiserUserTeams.value[teamId] = (organiserUserTeams.value[teamId] ?? []).filter((item) => item.id !== userTeamId);
  }

  /** Loads organiser markings for the selected contest, optionally filtered by team or pagination. */
  async function loadMarkings(contestId: string, page = 1, pageSize = 50, teamId?: string): Promise<void> {
    organiserMarkings.value[contestId] = await run(() => fetchOrganiserMarkings(contestId, page, pageSize, teamId), []);
  }

  /** Loads one organiser marking into the detail cache for editing. */
  async function loadMarking(markingId: string): Promise<void> {
    organiserMarkingDetails.value[markingId] = await run(() => fetchOrganiserMarking(markingId));
  }

  /** Creates an organiser-side marking and reloads the contest marking list. */
  async function createTeamMarking(contestId: string, teamId: string, payload: OrganiserMarkingCreateRequest): Promise<void> {
    await run(() => createOrganiserMarking(teamId, payload));
    // Reload the list because new markings affect ordering and may include backend-computed fields.
    await loadMarkings(contestId);
  }

  /** Saves an organiser marking and updates both detail and list caches. */
  async function saveMarking(contestId: string, markingId: string, payload: OrganiserMarkingUpdateRequest): Promise<void> {
    const updated = await run(() => updateOrganiserMarking(markingId, payload));
    organiserMarkingDetails.value[markingId] = updated;
    organiserMarkings.value[contestId] = replaceById(organiserMarkings.value[contestId], markingId, updated);
  }

  /** Deletes an organiser marking from the selected contest cache. */
  async function removeMarking(contestId: string, markingId: string): Promise<void> {
    await run(() => deleteOrganiserMarking(markingId), undefined);
    organiserMarkings.value[contestId] = (organiserMarkings.value[contestId] ?? []).filter((item) => item.id !== markingId);
  }

  /** Wraps async calls with shared loading/error handling and optional fallback values. */
  async function run<T>(handler: () => Promise<T>, fallback?: T): Promise<T> {
    loading.value = true;
    // Clear the previous request error before each new backend call.
    error.value = null;

    try {
      return await handler();
    } catch (reason) {
      // Store the readable message so any page can surface the latest failed request.
      error.value = reason instanceof Error ? reason.message : "Unexpected request failure";
      if (fallback !== undefined) {
        // Some list screens can still render with an empty fallback instead of throwing.
        return fallback;
      }
      throw reason;
    } finally {
      // One shared loading flag is enough because this client is coursework-sized.
      loading.value = false;
    }
  }

  return {
    activations,
    contestDetails,
    contestResults,
    contests,
    createCheckPoint,
    createContest,
    createContestClass,
    createTeam,
    createTeamMarking,
    error,
    loadContest,
    loadContestResults,
    loadContests,
    loadMarking,
    loadMarkings,
    loadOrganiserContestBundle,
    loadOrganiserHome,
    loadOrganiserTeamMembers,
    loadPublicCheckpointHints,
    loadTeamResult,
    loadUserTeamActivationState,
    loadUserTeamsForContest,
    loading,
    organiserCheckPoints,
    organiserClasses,
    organiserContests,
    organiserMarkingDetails,
    organiserMarkings,
    organiserOrganisations,
    organiserTeams,
    organiserUserTeams,
    publicCheckPoints,
    registerContestTeam,
    removeCheckPoint,
    removeContest,
    removeContestClass,
    removeMarking,
    removeTeam,
    removeTeamMember,
    saveCheckPoint,
    saveContest,
    saveContestClass,
    saveMarking,
    saveTeam,
    sortedContests,
    submitParticipantMarking,
    teamResults,
    userTeams,
    addTeamMember,
  };
});

/** Replaces one cached item by id while preserving array order. */
function replaceById<T extends { id: string }>(items: T[] | undefined, id: string, nextValue: T): T[] {
  return (items ?? []).map((item) => (item.id === id ? nextValue : item));
}

/** Deduplicates inferred public checkpoints, preferring entries that contain coordinates. */
function deduplicateCheckpoints(points: MapCheckpointPoint[]): MapCheckpointPoint[] {
  const known = new Map<string, MapCheckpointPoint>();

  for (const point of points) {
    const current = known.get(point.id);

    if (!current) {
      // First sighting of a checkpoint wins until a richer version appears later.
      known.set(point.id, point);
      continue;
    }

    if ((!current.lat || !current.lon) && point.lat && point.lon) {
      // Prefer the richer version when later results reveal coordinates for the same checkpoint.
      known.set(point.id, point);
    }
  }

  return [...known.values()];
}
