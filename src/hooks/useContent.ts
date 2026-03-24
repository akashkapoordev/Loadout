import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { fetchContent, fetchContentItem, fetchTrending, fetchFeatured } from '../lib/api'
import type { ContentFilters } from '../lib/types'

export function useContent(filters: ContentFilters = {}) {
  return useQuery({
    queryKey: ['content', filters],
    queryFn: () => fetchContent(filters),
  })
}

export function useContentInfinite(filters: Omit<ContentFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['content-infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchContent({ ...filters, page: pageParam, limit: 9 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = (last.page - 1) * last.limit + last.data.length
      return loaded < last.total ? last.page + 1 : undefined
    },
  })
}

export function useContentItem(id: string) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => fetchContentItem(id),
    enabled: !!id,
  })
}

export function useTrending() {
  return useQuery({
    queryKey: ['content', 'trending'],
    queryFn: fetchTrending,
  })
}

export function useFeatured() {
  return useQuery({
    queryKey: ['content', 'featured'],
    queryFn: fetchFeatured,
  })
}
