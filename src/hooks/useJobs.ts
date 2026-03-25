import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { fetchJobs, fetchJob, fetchJobStudioCounts } from '../lib/api'
import type { JobFilters } from '../lib/types'

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => fetchJobs(filters),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => fetchJob(id),
    enabled: !!id,
  })
}

export function useJobStudioCounts() {
  return useQuery({
    queryKey: ['job-studio-counts'],
    queryFn: fetchJobStudioCounts,
  })
}

export function useJobsInfinite(filters: Omit<JobFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['jobs-infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchJobs({ ...filters, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = (last.page - 1) * last.limit + last.data.length
      return loaded < last.total ? last.page + 1 : undefined
    },
  })
}
