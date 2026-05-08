export interface AuthSession {
  jwt: string;
  refreshToken: string;
}

export interface JwtResponse {
  jwt: string | null;
  refreshToken: string | null;
}

export interface LoginInfo {
  email: string;
  password: string;
}

export interface RegisterInfo extends LoginInfo {
  firstname: string;
  lastname: string;
}

export interface ContestClassListItem {
  id: string;
  name: string | null;
  orderNr: number;
  duration: number;
  maxDuration: number | null;
}

export interface ContestListItem {
  id: string;
  name: string | null;
  visibleFrom: string;
  openFrom: string;
  openTo: string;
  isOpenForParticipation: boolean;
  hasResults: boolean;
}

export interface ContestDetails {
  id: string;
  name: string | null;
  openFrom: string;
  openTo: string;
  contestClasses: ContestClassListItem[] | null;
}

export interface TeamRegistrationRequest {
  teamName: string;
  teamMembers: string;
  contestClassId: string;
}

export interface UserTeamListItem {
  id: string;
  teamId: string;
  teamName: string | null;
  memberNames: string | null;
  contestClassId: string;
  contestClassName: string | null;
  startDT: string | null;
  finishDT: string | null;
  finalScore: number;
}

export interface MarkingListItem {
  id: string;
  dt: string;
  checkPointId: string;
  checkPointCPID: string | null;
  checkPointCPCode: string | null;
  checkPointType: number;
  score: number;
  lat: string | null;
  lon: string | null;
}

export interface UserTeamActivation {
  userTeamId: string;
  teamName: string | null;
  contestId: string;
  contestName: string | null;
  contestClassName: string | null;
  startDT: string | null;
  finishDT: string | null;
  score: number;
  bonus: number;
  penalty: number;
  finalScore: number;
  markings: MarkingListItem[] | null;
}

export interface MarkingRequest {
  checkPointId: string;
  userTeamId: string;
  lat: string | null;
  lon: string | null;
  dt: string | null;
}

export interface MarkingResponse {
  statusOk: boolean;
  statusCode: number;
  message: string | null;
  result: UserTeamActivation | null;
}

export interface TeamResultListItem {
  id: string;
  name: string | null;
  memberNames: string | null;
  contestClassId: string;
  contestClassName: string | null;
  contestClassOrderNr: number;
  startDT: string | null;
  finishDT: string | null;
  score: number;
  bonus: number;
  penalty: number;
  finalScore: number;
}

export interface ContestResults {
  contest: ContestListItem;
  teams: TeamResultListItem[] | null;
}

export interface TeamResultDetail extends TeamResultListItem {
  markings: MarkingListItem[] | null;
}

export interface OrganisationItem {
  id: string;
  organisationName: string | null;
}

export interface OrganiserContestDetails {
  id: string;
  name: string | null;
  visibleFrom: string;
  openFrom: string;
  openTo: string;
  bonusTimeStart: string | null;
  bonusTimeEnd: string | null;
  bonusPerMarking: number;
  organisationId: string;
  organisationName: string | null;
}

export interface OrganiserContestUpsertRequest {
  name: string;
  visibleFrom: string;
  openFrom: string;
  openTo: string;
  bonusTimeStart: string | null;
  bonusTimeEnd: string | null;
  bonusPerMarking: number;
  organisationId: string;
}

export interface OrganiserContestClassDetails {
  id: string;
  contestId: string;
  name: string | null;
  orderNr: number;
  duration: number;
  maxDuration: number | null;
  overDurationUnit: number;
  overDurationPenalty: number;
}

export interface OrganiserContestClassUpsertRequest {
  name: string;
  orderNr: number;
  duration: number;
  maxDuration: number | null;
  overDurationUnit: number;
  overDurationPenalty: number;
}

export interface OrganiserCheckPointDetails {
  id: string;
  contestId: string;
  cpid: string | null;
  cpCode: string | null;
  checkPointType: number;
  score: number;
  lat: string | null;
  lon: string | null;
}

export interface OrganiserCheckPointUpsertRequest {
  cpid: string;
  cpCode: string;
  checkPointType: number;
  score: number;
  lat: string | null;
  lon: string | null;
}

export interface OrganiserTeamMember {
  userTeamId: string;
  userId: string;
  email: string | null;
}

export interface OrganiserTeamDetails {
  id: string;
  name: string | null;
  memberNames: string | null;
  contestId: string;
  contestClassId: string;
  contestClassName: string | null;
  createdDT: string;
  startDT: string | null;
  finishDT: string | null;
  score: number;
  bonus: number;
  penalty: number;
  finalScore: number;
  members: OrganiserTeamMember[] | null;
}

export interface OrganiserTeamUpsertRequest {
  name: string;
  memberNames: string;
  contestClassId: string;
  startDT: string | null;
  finishDT: string | null;
  score: number;
  bonus: number;
  penalty: number;
  finalScore: number;
}

export interface OrganiserUserTeamItem {
  id: string;
  userId: string;
  email: string | null;
  teamId: string;
}

export interface OrganiserAddUserTeamRequest {
  email: string;
}

export interface OrganiserMarkingListItem {
  id: string;
  dt: string;
  markingType: number;
  score: number;
  lat: string | null;
  lon: string | null;
  checkPointId: string;
  checkPointCPID: string | null;
  checkPointCPCode: string | null;
  checkPointType: number;
  userTeamId: string;
  teamId: string;
  teamName: string | null;
}

export interface OrganiserMarkingDetails extends OrganiserMarkingListItem {
  contestId: string;
  contestName: string | null;
}

export interface OrganiserMarkingCreateRequest {
  checkPointId: string;
  dt: string;
  lat: string | null;
  lon: string | null;
}

export interface OrganiserMarkingUpdateRequest {
  dt: string;
  lat: string | null;
  lon: string | null;
  markingType: number;
  score: number;
  checkPointId: string;
  userTeamId: string;
}

export interface ApiErrorShape {
  message?: string | null;
  title?: string | null;
  detail?: string | null;
  errors?: Record<string, string[]>;
}

export const checkpointTypeLabels: Record<number, string> = {
  1: "Regular",
  2: "Start",
  3: "Finish",
  4: "Bonus",
};

export const markingTypeLabels: Record<number, string> = {
  0: "Manual",
  1: "Start",
  2: "Finish",
};
