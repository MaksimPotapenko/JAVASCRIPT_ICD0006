import { apiRequest } from "@/services/api";
import type {
  ContestDetails,
  ContestResults,
  ContestListItem,
  JwtResponse,
  LoginInfo,
  MarkingRequest,
  MarkingResponse,
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
  RegisterInfo,
  TeamRegistrationRequest,
  TeamResultDetail,
  UserTeamActivation,
  UserTeamListItem,
} from "@/types/nutikas";

export function registerUser(payload: RegisterInfo): Promise<JwtResponse> {
  return apiRequest("/identity/Account/Register", {
    method: "POST",
    body: payload,
  });
}

export function loginUser(payload: LoginInfo): Promise<JwtResponse> {
  return apiRequest("/identity/Account/Login", {
    method: "POST",
    body: payload,
  });
}

export function logoutUser(refreshToken: string): Promise<void> {
  return apiRequest("/identity/Account/Logout", {
    method: "POST",
    body: { refreshToken },
  });
}

export function fetchContests(): Promise<ContestListItem[]> {
  return apiRequest("/Contests");
}

export function fetchContest(contestId: string): Promise<ContestDetails> {
  return apiRequest(`/Contests/${contestId}`);
}

export function fetchContestResults(contestId: string): Promise<ContestResults> {
  return apiRequest(`/Contests/${contestId}/results`);
}

export function fetchTeamResult(contestId: string, teamId: string): Promise<TeamResultDetail> {
  return apiRequest(`/Contests/${contestId}/teams/${teamId}`);
}

export function registerTeam(contestId: string, payload: TeamRegistrationRequest): Promise<UserTeamListItem> {
  return apiRequest(`/Contests/${contestId}/teams`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function fetchUserTeams(contestId: string): Promise<UserTeamListItem[]> {
  return apiRequest(`/Contests/${contestId}/userteams`, { auth: true });
}

export function fetchUserTeamActivation(userTeamId: string): Promise<UserTeamActivation> {
  return apiRequest(`/UserTeams/${userTeamId}`, { auth: true });
}

export function createParticipantMarking(payload: MarkingRequest): Promise<MarkingResponse> {
  return apiRequest("/Markings", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function fetchOrganisations(): Promise<OrganisationItem[]> {
  return apiRequest("/organiser/Organisations", { auth: true });
}

export function fetchOrganiserContests(): Promise<OrganiserContestDetails[]> {
  return apiRequest("/organiser/Contests", { auth: true });
}

export function createOrganiserContest(payload: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
  return apiRequest("/organiser/Contests", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function updateOrganiserContest(contestId: string, payload: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
  return apiRequest(`/organiser/Contests/${contestId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function deleteOrganiserContest(contestId: string): Promise<void> {
  return apiRequest(`/organiser/Contests/${contestId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchOrganiserContestClasses(contestId: string): Promise<OrganiserContestClassDetails[]> {
  return apiRequest(`/organiser/contests/${contestId}/contest-classes`, { auth: true });
}

export function createOrganiserContestClass(contestId: string, payload: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
  return apiRequest(`/organiser/contests/${contestId}/contest-classes`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function updateOrganiserContestClass(id: string, payload: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
  return apiRequest(`/organiser/contest-classes/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function deleteOrganiserContestClass(id: string): Promise<void> {
  return apiRequest(`/organiser/contest-classes/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchOrganiserCheckPoints(contestId: string): Promise<OrganiserCheckPointDetails[]> {
  return apiRequest(`/organiser/contests/${contestId}/check-points`, { auth: true });
}

export function createOrganiserCheckPoint(contestId: string, payload: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
  return apiRequest(`/organiser/contests/${contestId}/check-points`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function updateOrganiserCheckPoint(id: string, payload: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
  return apiRequest(`/organiser/check-points/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function deleteOrganiserCheckPoint(id: string): Promise<void> {
  return apiRequest(`/organiser/check-points/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchOrganiserTeams(contestId: string): Promise<OrganiserTeamDetails[]> {
  return apiRequest(`/organiser/contests/${contestId}/teams`, { auth: true });
}

export function createOrganiserTeam(contestId: string, payload: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
  return apiRequest(`/organiser/contests/${contestId}/teams`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function updateOrganiserTeam(teamId: string, payload: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
  return apiRequest(`/organiser/Teams/${teamId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function deleteOrganiserTeam(teamId: string): Promise<void> {
  return apiRequest(`/organiser/Teams/${teamId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchOrganiserUserTeams(teamId: string): Promise<OrganiserUserTeamItem[]> {
  return apiRequest(`/organiser/teams/${teamId}/user-teams`, { auth: true });
}

export function addOrganiserUserTeam(teamId: string, payload: OrganiserAddUserTeamRequest): Promise<OrganiserUserTeamItem> {
  return apiRequest(`/organiser/teams/${teamId}/user-teams`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function deleteOrganiserUserTeam(userTeamId: string): Promise<void> {
  return apiRequest(`/organiser/user-teams/${userTeamId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function fetchOrganiserMarkings(contestId: string, page = 1, pageSize = 50, teamId?: string): Promise<OrganiserMarkingListItem[]> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (teamId) {
    params.set("teamId", teamId);
  }

  return apiRequest(`/organiser/contests/${contestId}/markings?${params.toString()}`, { auth: true });
}

export function fetchOrganiserMarking(markingId: string): Promise<OrganiserMarkingDetails> {
  return apiRequest(`/organiser/Markings/${markingId}`, { auth: true });
}

export function createOrganiserMarking(teamId: string, payload: OrganiserMarkingCreateRequest): Promise<OrganiserMarkingDetails> {
  return apiRequest(`/organiser/teams/${teamId}/markings`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function updateOrganiserMarking(markingId: string, payload: OrganiserMarkingUpdateRequest): Promise<OrganiserMarkingDetails> {
  return apiRequest(`/organiser/Markings/${markingId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function deleteOrganiserMarking(markingId: string): Promise<void> {
  return apiRequest(`/organiser/Markings/${markingId}`, {
    method: "DELETE",
    auth: true,
  });
}
