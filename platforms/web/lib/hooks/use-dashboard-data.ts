import { useQuery } from '@tanstack/react-query'
import { api } from '@listbackup/shared/api'

export function useDashboardData() {
  const { data: sources, isLoading: sourcesLoading, error: sourcesError } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources.list,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: activity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: () => api.activity.list({ limit: 10 }),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const { data: account, isLoading: accountLoading, error: accountError } = useQuery({
    queryKey: ['account'],
    queryFn: api.account.get,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const { data: usage, isLoading: usageLoading, error: usageError } = useQuery({
    queryKey: ['account', 'usage'],
    queryFn: () => api.account.getUsage('month'),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  })

  const jobs = jobsData?.jobs || []
  
  // Calculate stats
  const stats = {
    totalSources: sources?.length || 0,
    activeSources: sources?.filter(s => s.status === 'active').length || 0,
    totalJobs: jobs.length || 0,
    activeJobs: jobs.filter(j => j.status === 'active').length || 0,
    recentActivity: activity?.activities || [],
    storageUsed: usage?.storage?.total || 0,
    storageLimit: account?.usage?.storage?.limit || 100 * 1024 * 1024 * 1024, // Default 100GB for new users
    lastBackup: activity?.activities?.find(a => a.type === 'job.completed')?.timestamp,
  }

  const isLoading = sourcesLoading || jobsLoading || activityLoading || accountLoading || usageLoading
  const hasError = sourcesError || jobsError || activityError || accountError || usageError

  return {
    sources,
    jobs,
    activity,
    account,
    usage,
    stats,
    isLoading,
    hasError,
    errors: {
      sources: sourcesError,
      jobs: jobsError,
      activity: activityError,
      account: accountError,
      usage: usageError,
    }
  }
}