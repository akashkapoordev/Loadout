import { useQuery } from '@tanstack/react-query'
import { fetchStudios, fetchStudio, fetchStudioJobs } from '../lib/api'

export function useStudios() {
  return useQuery({
    queryKey: ['studios'],
    queryFn: fetchStudios,
  })
}

export function useStudio(id: string) {
  return useQuery({
    queryKey: ['studios', id],
    queryFn: () => fetchStudio(id),
    enabled: !!id,
  })
}

export function useStudioJobs(id: string) {
  return useQuery({
    queryKey: ['studios', id, 'jobs'],
    queryFn: () => fetchStudioJobs(id),
    enabled: !!id,
  })
}
