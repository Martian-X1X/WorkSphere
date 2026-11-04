import api from '@/lib/api'
import type { ApiResponse, SearchResult } from '@/types'

export const searchService = {
  search: (query: string, maxResults = 8) =>
    api.get<ApiResponse<SearchResult>>('/search', {
      params: { q: query, maxResults },
    }),
}
