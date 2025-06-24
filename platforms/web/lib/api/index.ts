export * from './client'
export * from './auth'
export * from './sources'
export * from './platforms'
export * from './jobs'
export * from './activity'
export * from './account'
export * from './data'
export * from './tags'

// Re-export all APIs as a single object for convenience
import { authApi } from './auth'
import { sourcesApi } from './sources'
import { platformsApi } from './platforms'
import { jobsApi } from './jobs'
import { activityApi } from './activity'
import { accountApi } from './account'
import { dataApi } from './data'
import * as tagsApi from './tags'

export const api = {
  auth: authApi,
  sources: sourcesApi,
  platforms: platformsApi,
  jobs: jobsApi,
  activity: activityApi,
  account: accountApi,
  data: dataApi,
  tags: tagsApi,
}