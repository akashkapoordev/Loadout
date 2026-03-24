import { useQuery } from '@tanstack/react-query'
import { fetchActivity } from '../lib/api'

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: fetchActivity,
    refetchInterval: 30_000, // poll every 30s for "live" feel
  })
}
