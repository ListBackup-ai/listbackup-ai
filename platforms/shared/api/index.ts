export * from './client'
export * from './auth'
export * from './sources'
export * from './platforms'
export * from './jobs'
export * from './activity'
export * from './account'
export * from './data'
export * from './platform-connections'
export * from './platform-sources'
export * from './teams'
export * from './clients'
export * from './domains'
export * from './branding'
export * from './system'

// Re-export all APIs as a single object for convenience
import { authApi } from './auth'
import { sourcesApi } from './sources'
import { platformsApi } from './platforms'
import { jobsApi } from './jobs'
import { activityApi } from './activity'
import { accountApi } from './account'
import { dataApi } from './data'
import { platformConnectionsApi } from './platform-connections'
import { platformSourcesApi } from './platform-sources'
import { teamsAPI } from './teams'
import { clientsAPI } from './clients'
import { domainsAPI } from './domains'
import { brandingAPI } from './branding'
import { systemApi } from './system'

export const api = {
  auth: authApi,
  sources: sourcesApi,
  platforms: platformsApi,
  jobs: jobsApi,
  activity: activityApi,
  account: accountApi,
  data: dataApi,
  platformConnections: platformConnectionsApi,
  platformSources: platformSourcesApi,
  teams: teamsAPI,
  clients: clientsAPI,
  domains: domainsAPI,
  branding: brandingAPI,
  system: systemApi,
}