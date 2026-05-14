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
  const contests = ref<ContestListItem[]>([]);
  const contestDetails = ref<Record<string, ContestDetails>>({});
  const contestResults = ref<Record<string, ContestResults>>({});
  const teamResults = ref<Record<string, TeamResultDetail>>({});
  const userTeams = ref<Record<string, UserTeamListItem[]>>({});
  const activations = ref<Record<string, UserTeamActivation>>({});
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

  const sortedContests = computed(() =>
    [...contests.value].sort((left, right) => left.openFrom.localeCompare(right.openFrom)),
  );

  async function loadContests(): Promise<void> {
    contests.value = await run(fetchContests, []);
  }

  async function loadContest(contestId: string): Promise<void> {
    contestDetails.value[contestId] = await run(() => fetchContest(contestId));
  }

  async function loadContestResults(contestId: string): Promise<void> {
    contestResults.value[contestId] = await run(() => fetchContestResults(contestId));
  }

  async function loadTeamResult(contestId: string, teamId: string): Promise<void> {
    teamResults.value[teamId] = await run(() => fetchTeamResult(contestId, teamId));
  }

  async function registerContestTeam(contestId: string, payload: TeamRegistrationRequest): Promise<UserTeamListItem> {
    const team = await run(() => registerTeam(contestId, payload));
    userTeams.value[contestId] = [...(userTeams.value[contestId] ?? []), team];
    return team;
  }

  async function loadUserTeamsForContest(contestId: string): Promise<void> {
    userTeams.value[contestId] = await run(() => fetchUserTeams(contestId), []);
  }

  async function loadUserTeamActivationState(userTeamId: string): Promise<void> {
    activations.value[userTeamId] = await run(() => fetchUserTeamActivation(userTeamId));
  }

  async function submitParticipantMarking(payload: MarkingRequest): Promise<UserTeamActivation | null> {
    const response = await run(() => createParticipantMarking(payload));

    if (response.result) {
      activations.value[payload.userTeamId] = response.result;
    }

    return response.result;
  }

  async function loadOrganiserHome(): Promise<void> {
    organiserOrganisations.value = await run(fetchOrganisations, []);
    organiserContests.value = await run(fetchOrganiserContests, []);
  }

  async function createContest(payload: OrganiserContestUpsertRequest): Promise<void> {
    const contest = await run(() => createOrganiserContest(payload));
    organiserContests.value = [...organiserContests.value, contest];
  }

  async function saveContest(contestId: string, payload: OrganiserContestUpsertRequest): Promise<void> {
    const contest = await run(() => updateOrganiserContest(contestId, payload));
    organiserContests.value = organiserContests.value.map((item) => (item.id === contestId ? contest : item));
  }

  async function removeContest(contestId: string): Promise<void> {
    await run(() => deleteOrganiserContest(contestId), undefined);
    organiserContests.value = organiserContests.value.filter((item) => item.id !== contestId);
  }

  async function loadOrganiserContestBundle(contestId: string): Promise<void> {
    organiserClasses.value[contestId] = await run(() => fetchOrganiserContestClasses(contestId), []);
    organiserCheckPoints.value[contestId] = await run(() => fetchOrganiserCheckPoints(contestId), []);
    organiserTeams.value[contestId] = await run(() => fetchOrganiserTeams(contestId), []);
    organiserMarkings.value[contestId] = await run(() => fetchOrganiserMarkings(contestId), []);
  }

  async function loadPublicCheckpointHints(contestId: string): Promise<void> {
    const results = contestResults.value[contestId] ?? await run(() => fetchContestResults(contestId));
    contestResults.value[contestId] = results;

    const details = await run(
      () => Promise.all((results.teams ?? []).map((team) => fetchTeamResult(contestId, team.id))),
      [],
    );

    publicCheckPoints.value[contestId] = deduplicateCheckpoints(
      details.flatMap((team) => team.markings ?? []).map((marking) => ({
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

  async function createContestClass(contestId: string, payload: OrganiserContestClassUpsertRequest): Promise<void> {
    const created = await run(() => createOrganiserContestClass(contestId, payload));
    organiserClasses.value[contestId] = [...(organiserClasses.value[contestId] ?? []), created];
  }

  async function saveContestClass(contestId: string, classId: string, payload: OrganiserContestClassUpsertRequest): Promise<void> {
    const updated = await run(() => updateOrganiserContestClass(classId, payload));
    organiserClasses.value[contestId] = replaceById(organiserClasses.value[contestId], classId, updated);
  }

  async function removeContestClass(contestId: string, classId: string): Promise<void> {
    await run(() => deleteOrganiserContestClass(classId), undefined);
    organiserClasses.value[contestId] = (organiserClasses.value[contestId] ?? []).filter((item) => item.id !== classId);
  }

  async function createCheckPoint(contestId: string, payload: OrganiserCheckPointUpsertRequest): Promise<void> {
    const created = await run(() => createOrganiserCheckPoint(contestId, payload));
    organiserCheckPoints.value[contestId] = [...(organiserCheckPoints.value[contestId] ?? []), created];
  }

  async function saveCheckPoint(contestId: string, pointId: string, payload: OrganiserCheckPointUpsertRequest): Promise<void> {
    const updated = await run(() => updateOrganiserCheckPoint(pointId, payload));
    organiserCheckPoints.value[contestId] = replaceById(organiserCheckPoints.value[contestId], pointId, updated);
  }

  async function removeCheckPoint(contestId: string, pointId: string): Promise<void> {
    await run(() => deleteOrganiserCheckPoint(pointId), undefined);
    organiserCheckPoints.value[contestId] = (organiserCheckPoints.value[contestId] ?? []).filter((item) => item.id !== pointId);
  }

  async function createTeam(contestId: string, payload: OrganiserTeamUpsertRequest): Promise<void> {
    const created = await run(() => createOrganiserTeam(contestId, payload));
    organiserTeams.value[contestId] = [...(organiserTeams.value[contestId] ?? []), created];
  }

  async function saveTeam(contestId: string, teamId: string, payload: OrganiserTeamUpsertRequest): Promise<void> {
    const updated = await run(() => updateOrganiserTeam(teamId, payload));
    organiserTeams.value[contestId] = replaceById(organiserTeams.value[contestId], teamId, updated);
  }

  async function removeTeam(contestId: string, teamId: string): Promise<void> {
    await run(() => deleteOrganiserTeam(teamId), undefined);
    organiserTeams.value[contestId] = (organiserTeams.value[contestId] ?? []).filter((item) => item.id !== teamId);
  }

  async function loadOrganiserTeamMembers(teamId: string): Promise<void> {
    organiserUserTeams.value[teamId] = await run(() => fetchOrganiserUserTeams(teamId), []);
  }

  async function addTeamMember(teamId: string, payload: OrganiserAddUserTeamRequest): Promise<void> {
    const created = await run(() => addOrganiserUserTeam(teamId, payload));
    organiserUserTeams.value[teamId] = [...(organiserUserTeams.value[teamId] ?? []), created];
  }

  async function removeTeamMember(teamId: string, userTeamId: string): Promise<void> {
    await run(() => deleteOrganiserUserTeam(userTeamId), undefined);
    organiserUserTeams.value[teamId] = (organiserUserTeams.value[teamId] ?? []).filter((item) => item.id !== userTeamId);
  }

  async function loadMarkings(contestId: string, page = 1, pageSize = 50, teamId?: string): Promise<void> {
    organiserMarkings.value[contestId] = await run(() => fetchOrganiserMarkings(contestId, page, pageSize, teamId), []);
  }

  async function loadMarking(markingId: string): Promise<void> {
    organiserMarkingDetails.value[markingId] = await run(() => fetchOrganiserMarking(markingId));
  }

  async function createTeamMarking(contestId: string, teamId: string, payload: OrganiserMarkingCreateRequest): Promise<void> {
    await run(() => createOrganiserMarking(teamId, payload));
    await loadMarkings(contestId);
  }

  async function saveMarking(contestId: string, markingId: string, payload: OrganiserMarkingUpdateRequest): Promise<void> {
    const updated = await run(() => updateOrganiserMarking(markingId, payload));
    organiserMarkingDetails.value[markingId] = updated;
    organiserMarkings.value[contestId] = replaceById(organiserMarkings.value[contestId], markingId, updated);
  }

  async function removeMarking(contestId: string, markingId: string): Promise<void> {
    await run(() => deleteOrganiserMarking(markingId), undefined);
    organiserMarkings.value[contestId] = (organiserMarkings.value[contestId] ?? []).filter((item) => item.id !== markingId);
  }

  async function run<T>(handler: () => Promise<T>, fallback?: T): Promise<T> {
    loading.value = true;
    error.value = null;

    try {
      return await handler();
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unexpected request failure";
      if (fallback !== undefined) {
        return fallback;
      }
      throw reason;
    } finally {
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

function replaceById<T extends { id: string }>(items: T[] | undefined, id: string, nextValue: T): T[] {
  return (items ?? []).map((item) => (item.id === id ? nextValue : item));
}

function deduplicateCheckpoints(points: MapCheckpointPoint[]): MapCheckpointPoint[] {
  const known = new Map<string, MapCheckpointPoint>();

  for (const point of points) {
    const current = known.get(point.id);

    if (!current) {
      known.set(point.id, point);
      continue;
    }

    if ((!current.lat || !current.lon) && point.lat && point.lon) {
      known.set(point.id, point);
    }
  }

  return [...known.values()];
}
