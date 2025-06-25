import { BaseAPI } from './base'

export interface Team {
  teamId: string
  name: string
  description?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  memberCount: number
  accountCount: number
  settings?: {
    defaultPermissions?: string[]
    requireApproval?: boolean
    allowSelfJoin?: boolean
  }
}

export interface TeamMember {
  userId: string
  teamId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
  invitedBy?: string
  permissions?: string[]
  user?: {
    email: string
    name: string
    avatarUrl?: string
  }
}

export interface TeamAccount {
  teamId: string
  accountId: string
  permissions: string[]
  grantedAt: string
  grantedBy: string
  account?: {
    name: string
    accountPath: string
    type: string
  }
}

export interface TeamInvitation {
  inviteCode: string
  teamId: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  team?: {
    name: string
    description?: string
  }
}

export interface CreateTeamRequest {
  name: string
  description?: string
  settings?: {
    defaultPermissions?: string[]
    requireApproval?: boolean
    allowSelfJoin?: boolean
  }
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
  settings?: {
    defaultPermissions?: string[]
    requireApproval?: boolean
    allowSelfJoin?: boolean
  }
}

export interface AddTeamMemberRequest {
  userId?: string
  email?: string
  role: 'admin' | 'member' | 'viewer'
  permissions?: string[]
}

export interface UpdateTeamMemberRequest {
  role?: 'admin' | 'member' | 'viewer'
  permissions?: string[]
}

export interface GrantAccountAccessRequest {
  accountId: string
  permissions: string[]
}

export interface UpdateAccountPermissionsRequest {
  permissions: string[]
}

export interface CreateTeamInvitationRequest {
  email: string
  role: 'admin' | 'member' | 'viewer'
  message?: string
}

export interface TeamsListResponse {
  teams: Team[]
}

export interface TeamMembersListResponse {
  members: TeamMember[]
}

export interface TeamAccountsListResponse {
  accounts: TeamAccount[]
}

export interface TeamInvitationsListResponse {
  invitations: TeamInvitation[]
}

class TeamsAPI extends BaseAPI {
  // Team CRUD
  async create(data: CreateTeamRequest): Promise<Team> {
    return this.post('/teams', data)
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.get(`/teams/${teamId}`)
  }

  async list(params?: { userId?: string; accountId?: string }): Promise<TeamsListResponse> {
    return this.get('/teams', params)
  }

  async update(teamId: string, data: UpdateTeamRequest): Promise<Team> {
    return this.put(`/teams/${teamId}`, data)
  }

  async deleteTeam(teamId: string): Promise<void> {
    return this.delete(`/teams/${teamId}`)
  }

  // Team members
  async addMember(teamId: string, data: AddTeamMemberRequest): Promise<TeamMember> {
    return this.post(`/teams/${teamId}/members`, data)
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    return this.delete(`/teams/${teamId}/members/${userId}`)
  }

  async updateMemberRole(teamId: string, userId: string, data: UpdateTeamMemberRequest): Promise<TeamMember> {
    return this.put(`/teams/${teamId}/members/${userId}/role`, data)
  }

  async listMembers(teamId: string): Promise<TeamMembersListResponse> {
    return this.get(`/teams/${teamId}/members`)
  }

  // Team accounts
  async grantAccountAccess(teamId: string, data: GrantAccountAccessRequest): Promise<TeamAccount> {
    return this.post(`/teams/${teamId}/accounts`, data)
  }

  async revokeAccountAccess(teamId: string, accountId: string): Promise<void> {
    return this.delete(`/teams/${teamId}/accounts/${accountId}`)
  }

  async updateAccountPermissions(teamId: string, accountId: string, data: UpdateAccountPermissionsRequest): Promise<TeamAccount> {
    return this.put(`/teams/${teamId}/accounts/${accountId}/permissions`, data)
  }

  async listAccounts(teamId: string): Promise<TeamAccountsListResponse> {
    return this.get(`/teams/${teamId}/accounts`)
  }

  // Team invitations
  async invite(teamId: string, data: CreateTeamInvitationRequest): Promise<TeamInvitation> {
    return this.post(`/teams/${teamId}/invitations`, data)
  }

  async acceptInvitation(inviteCode: string): Promise<Team> {
    return this.post(`/teams/invitations/${inviteCode}/accept`, {})
  }

  async cancelInvitation(teamId: string, inviteCode: string): Promise<void> {
    return this.delete(`/teams/${teamId}/invitations/${inviteCode}`)
  }

  async listInvitations(teamId: string): Promise<TeamInvitationsListResponse> {
    return this.get(`/teams/${teamId}/invitations`)
  }

  // User's team invitations
  async getMyInvitations(): Promise<TeamInvitationsListResponse> {
    return this.get('/teams/invitations/my')
  }
}

export const teamsAPI = new TeamsAPI()