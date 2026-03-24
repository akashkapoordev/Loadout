import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '../lib/api'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 10, // stats don't change often
  })
}
