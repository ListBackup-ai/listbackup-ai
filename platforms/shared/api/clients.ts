import { BaseAPI } from './base'

export interface Client {
  clientId: string
  email: string
  name: string
  company?: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  createdBy: string
  lastLoginAt?: string
  settings?: {
    theme?: 'light' | 'dark' | 'system'
    language?: string
    timezone?: string
    notifications?: {
      email?: boolean
      reports?: boolean
    }
  }
}

export interface ClientAccount {
  clientId: string
  accountId: string
  permissions: string[]
  grantedAt: string
  grantedBy: string
  expiresAt?: string
  account?: {
    name: string
    accountPath: string
    type: string
  }
}

export interface ClientTeam {
  clientId: string
  teamId: string
  permissions: string[]
  grantedAt: string
  grantedBy: string
  team?: {
    name: string
    description?: string
  }
}

export interface ClientInvitation {
  inviteCode: string
  email: string
  name?: string
  company?: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  accountAccess?: Array<{
    accountId: string
    permissions: string[]
  }>
  teamAccess?: Array<{
    teamId: string
    permissions: string[]
  }>
}

export interface ClientPermission {
  clientId: string
  resource: string
  actions: string[]
  grantedAt: string
  grantedBy: string
  expiresAt?: string
}

export interface CreateClientRequest {
  email: string
  name: string
  company?: string
  sendInvitation?: boolean
  accountAccess?: Array<{
    accountId: string
    permissions: string[]
  }>
  teamAccess?: Array<{
    teamId: string
    permissions: string[]
  }>
}

export interface UpdateClientRequest {
  name?: string
  company?: string
  status?: 'active' | 'inactive' | 'suspended'
  settings?: Client['settings']
}

export interface ClientGrantAccountAccessRequest {
  accountId: string
  permissions: string[]
  expiresAt?: string
}

export interface GrantTeamAccessRequest {
  teamId: string
  permissions: string[]
}

export interface ClientUpdateAccountPermissionsRequest {
  permissions: string[]
  expiresAt?: string
}

export interface SetPermissionsRequest {
  permissions: Array<{
    resource: string
    actions: string[]
    expiresAt?: string
  }>
}

export interface ClientLoginRequest {
  email: string
  password: string
}

export interface ClientsListResponse {
  clients: Client[]
}

export interface ClientAccountsListResponse {
  accounts: ClientAccount[]
}

export interface ClientTeamsListResponse {
  teams: ClientTeam[]
}

export interface ClientInvitationsListResponse {
  invitations: ClientInvitation[]
}

export interface ClientPermissionsResponse {
  permissions: ClientPermission[]
}

// Client Portal Types
export interface ClientPortalProfile {
  clientId: string
  email: string
  name: string
  company?: string
  lastLoginAt?: string
  settings?: Client['settings']
  accessibleAccounts: number
  accessibleTeams: number
}

export interface ClientPortalReport {
  reportId: string
  accountId: string
  accountName: string
  type: 'backup-summary' | 'activity' | 'usage' | 'custom'
  generatedAt: string
  period: {
    start: string
    end: string
  }
  data: any
}

export interface ClientPortalExport {
  exportId: string
  accountId: string
  sourceId: string
  sourceName: string
  exportedAt: string
  size: string
  downloadUrl?: string
  expiresAt?: string
  status: 'available' | 'preparing' | 'expired'
}

class ClientsAPI extends BaseAPI {
  // Client CRUD
  async create(data: CreateClientRequest): Promise<Client> {
    return this.post<Client>('/clients', data)
  }

  async getClient(clientId: string): Promise<Client> {
    return this.get(`/clients/${clientId}`)
  }

  async list(params?: { accountId?: string; teamId?: string; status?: string }): Promise<ClientsListResponse> {
    return this.get('/clients', params)
  }

  async update(clientId: string, data: UpdateClientRequest): Promise<Client> {
    return this.put(`/clients/${clientId}`, data)
  }

  async deleteClient(clientId: string): Promise<void> {
    return this.delete(`/clients/${clientId}`)
  }

  // Client authentication
  async login(data: ClientLoginRequest): Promise<{ token: string; client: Client }> {
    return this.post('/clients/auth/login', data)
  }

  async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    return this.post('/clients/auth/refresh', { refreshToken })
  }

  // Account access
  async grantAccountAccess(clientId: string, data: ClientGrantAccountAccessRequest): Promise<ClientAccount> {
    return this.post(`/clients/${clientId}/accounts`, data)
  }

  async revokeAccountAccess(clientId: string, accountId: string): Promise<void> {
    return this.delete(`/clients/${clientId}/accounts/${accountId}`)
  }

  async updateAccountPermissions(clientId: string, accountId: string, data: ClientUpdateAccountPermissionsRequest): Promise<ClientAccount> {
    return this.put(`/clients/${clientId}/accounts/${accountId}/permissions`, data)
  }

  async listAccounts(clientId: string): Promise<ClientAccountsListResponse> {
    return this.get(`/clients/${clientId}/accounts`)
  }

  // Team access
  async grantTeamAccess(clientId: string, data: GrantTeamAccessRequest): Promise<ClientTeam> {
    return this.post(`/clients/${clientId}/teams`, data)
  }

  async revokeTeamAccess(clientId: string, teamId: string): Promise<void> {
    return this.delete(`/clients/${clientId}/teams/${teamId}`)
  }

  async listTeams(clientId: string): Promise<ClientTeamsListResponse> {
    return this.get(`/clients/${clientId}/teams`)
  }

  // Permissions
  async setPermissions(clientId: string, data: SetPermissionsRequest): Promise<ClientPermissionsResponse> {
    return this.put(`/clients/${clientId}/permissions`, data)
  }

  async getPermissions(clientId: string): Promise<ClientPermissionsResponse> {
    return this.get(`/clients/${clientId}/permissions`)
  }

  // Invitations
  async invite(data: CreateClientRequest): Promise<ClientInvitation> {
    return this.post('/clients/invitations', data)
  }

  async acceptInvitation(inviteCode: string, password: string): Promise<{ token: string; client: Client }> {
    return this.post(`/clients/invitations/${inviteCode}/accept`, { password })
  }

  async cancelInvitation(inviteCode: string): Promise<void> {
    return this.delete(`/clients/invitations/${inviteCode}`)
  }

  async listInvitations(): Promise<ClientInvitationsListResponse> {
    return this.get('/clients/invitations')
  }

  // Client Portal endpoints
  async getPortalProfile(): Promise<ClientPortalProfile> {
    return this.get('/client-portal/profile')
  }

  async getPortalAccounts(): Promise<ClientAccountsListResponse> {
    return this.get('/client-portal/accounts')
  }

  async getPortalReports(params?: { accountId?: string; startDate?: string; endDate?: string }): Promise<{ reports: ClientPortalReport[] }> {
    return this.get('/client-portal/reports', params)
  }

  async getPortalExports(params?: { accountId?: string; sourceId?: string }): Promise<{ exports: ClientPortalExport[] }> {
    return this.get('/client-portal/exports', params)
  }
}

export const clientsAPI = new ClientsAPI()