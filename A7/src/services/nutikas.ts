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

/** Registers a brand-new Nutikas user and returns the initial JWT session payload. */
export function registerUser(payload: RegisterInfo): Promise<JwtResponse> {
  return apiRequest("/identity/Account/Register", {
    method: "POST",
    body: payload,
  });
}

/** Logs an existing user in and returns fresh access + refresh tokens. */
export function loginUser(payload: LoginInfo): Promise<JwtResponse> {
  return apiRequest("/identity/Account/Login", {
    method: "POST",
    body: payload,
  });
}

/** Invalidates the current refresh token on the backend when the user signs out. */
export function logoutUser(refreshToken: string): Promise<void> {
  return apiRequest("/identity/Account/Logout", {
    method: "POST",
    body: { refreshToken },
  });
}

/** Loads the public contest catalogue shown on the home page. */
export function fetchContests(): Promise<ContestListItem[]> {
  return apiRequest("/Contests");
}

/** Loads one contest with its public metadata and available contest classes. */
export function fetchContest(contestId: string): Promise<ContestDetails> {
  return apiRequest(`/Contests/${contestId}`);
}

/** Loads the published leaderboard for a contest. */
export function fetchContestResults(contestId: string): Promise<ContestResults> {
  return apiRequest(`/Contests/${contestId}/results`);
}

/** Loads one team's public result detail, including its marking history. */
export function fetchTeamResult(contestId: string, teamId: string): Promise<TeamResultDetail> {
  return apiRequest(`/Contests/${contestId}/teams/${teamId}`);
}

/** Registers the authenticated user into a contest with team/class information. */
export function registerTeam(contestId: string, payload: TeamRegistrationRequest): Promise<UserTeamListItem> {
  return apiRequest(`/Contests/${contestId}/teams`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Loads the current user's teams for one contest. */
export function fetchUserTeams(contestId: string): Promise<UserTeamListItem[]> {
  return apiRequest(`/Contests/${contestId}/userteams`, { auth: true });
}

/** Loads live activation state for a registered user team. */
export function fetchUserTeamActivation(userTeamId: string): Promise<UserTeamActivation> {
  return apiRequest(`/UserTeams/${userTeamId}`, { auth: true });
}

/** Submits a participant QR marking with checkpoint code and optional coordinates/timestamp. */
export function createParticipantMarking(payload: MarkingRequest): Promise<MarkingResponse> {
  return apiRequest("/Markings", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Loads organiser-visible organisations that can own contests. */
export function fetchOrganisations(): Promise<OrganisationItem[]> {
  return apiRequest("/organiser/Organisations", { auth: true });
}

/** Loads the organiser's contest list for the admin workspace. */
export function fetchOrganiserContests(): Promise<OrganiserContestDetails[]> {
  return apiRequest("/organiser/Contests", { auth: true });
}

/** Creates a new organiser contest. */
export function createOrganiserContest(payload: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
  return apiRequest("/organiser/Contests", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Updates the selected organiser contest. */
export function updateOrganiserContest(contestId: string, payload: OrganiserContestUpsertRequest): Promise<OrganiserContestDetails> {
  return apiRequest(`/organiser/Contests/${contestId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

/** Deletes an organiser contest. */
export function deleteOrganiserContest(contestId: string): Promise<void> {
  return apiRequest(`/organiser/Contests/${contestId}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Loads all classes configured for a contest. */
export function fetchOrganiserContestClasses(contestId: string): Promise<OrganiserContestClassDetails[]> {
  return apiRequest(`/organiser/contests/${contestId}/contest-classes`, { auth: true });
}

/** Creates a new contest class inside one contest. */
export function createOrganiserContestClass(contestId: string, payload: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
  return apiRequest(`/organiser/contests/${contestId}/contest-classes`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Updates one existing contest class. */
export function updateOrganiserContestClass(id: string, payload: OrganiserContestClassUpsertRequest): Promise<OrganiserContestClassDetails> {
  return apiRequest(`/organiser/contest-classes/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

/** Deletes one contest class. */
export function deleteOrganiserContestClass(id: string): Promise<void> {
  return apiRequest(`/organiser/contest-classes/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Loads all checkpoints configured by the organiser for a contest. */
export function fetchOrganiserCheckPoints(contestId: string): Promise<OrganiserCheckPointDetails[]> {
  return apiRequest(`/organiser/contests/${contestId}/check-points`, { auth: true });
}

/** Creates a checkpoint with CPID/code/type/score and optional coordinates. */
export function createOrganiserCheckPoint(contestId: string, payload: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
  return apiRequest(`/organiser/contests/${contestId}/check-points`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Updates an existing organiser checkpoint. */
export function updateOrganiserCheckPoint(id: string, payload: OrganiserCheckPointUpsertRequest): Promise<OrganiserCheckPointDetails> {
  return apiRequest(`/organiser/check-points/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

/** Deletes an organiser checkpoint. */
export function deleteOrganiserCheckPoint(id: string): Promise<void> {
  return apiRequest(`/organiser/check-points/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Loads all organiser-side teams for the selected contest. */
export function fetchOrganiserTeams(contestId: string): Promise<OrganiserTeamDetails[]> {
  return apiRequest(`/organiser/contests/${contestId}/teams`, { auth: true });
}

/** Creates a team directly from the organiser workspace. */
export function createOrganiserTeam(contestId: string, payload: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
  return apiRequest(`/organiser/contests/${contestId}/teams`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Updates an organiser-managed team. */
export function updateOrganiserTeam(teamId: string, payload: OrganiserTeamUpsertRequest): Promise<OrganiserTeamDetails> {
  return apiRequest(`/organiser/Teams/${teamId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

/** Deletes an organiser-managed team. */
export function deleteOrganiserTeam(teamId: string): Promise<void> {
  return apiRequest(`/organiser/Teams/${teamId}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Loads the user members currently attached to one organiser-selected team. */
export function fetchOrganiserUserTeams(teamId: string): Promise<OrganiserUserTeamItem[]> {
  return apiRequest(`/organiser/teams/${teamId}/user-teams`, { auth: true });
}

/** Adds a user to a team by email from the organiser workspace. */
export function addOrganiserUserTeam(teamId: string, payload: OrganiserAddUserTeamRequest): Promise<OrganiserUserTeamItem> {
  return apiRequest(`/organiser/teams/${teamId}/user-teams`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Removes one team-member relation from a team. */
export function deleteOrganiserUserTeam(userTeamId: string): Promise<void> {
  return apiRequest(`/organiser/user-teams/${userTeamId}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Loads paginated organiser markings, optionally filtered by team. */
export function fetchOrganiserMarkings(contestId: string, page = 1, pageSize = 50, teamId?: string): Promise<OrganiserMarkingListItem[]> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (teamId) {
    // teamId narrows the results when the organiser wants to inspect one team only.
    params.set("teamId", teamId);
  }

  return apiRequest(`/organiser/contests/${contestId}/markings?${params.toString()}`, { auth: true });
}

/** Loads one organiser marking detail row for editing. */
export function fetchOrganiserMarking(markingId: string): Promise<OrganiserMarkingDetails> {
  return apiRequest(`/organiser/Markings/${markingId}`, { auth: true });
}

/** Creates a marking on behalf of a selected team from the organiser UI. */
export function createOrganiserMarking(teamId: string, payload: OrganiserMarkingCreateRequest): Promise<OrganiserMarkingDetails> {
  return apiRequest(`/organiser/teams/${teamId}/markings`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

/** Updates an existing organiser-created or organiser-edited marking. */
export function updateOrganiserMarking(markingId: string, payload: OrganiserMarkingUpdateRequest): Promise<OrganiserMarkingDetails> {
  return apiRequest(`/organiser/Markings/${markingId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

/** Deletes one organiser marking row. */
export function deleteOrganiserMarking(markingId: string): Promise<void> {
  return apiRequest(`/organiser/Markings/${markingId}`, {
    method: "DELETE",
    auth: true,
  });
}
