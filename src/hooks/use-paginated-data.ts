import { useState, useEffect, useCallback, useMemo } from "react";

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string | number | boolean>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UsePaginatedDataOptions {
  endpoint: string;
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  defaultFilters?: Record<string, string | number | boolean>;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UsePaginatedDataReturn<T> {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  filters: Record<string, string | number | boolean>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setFilters: (filters: Record<string, string | number | boolean>) => void;
  updateFilter: (key: string, value: string | number | boolean) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

export function usePaginatedData<T>({
  endpoint,
  defaultLimit = 10,
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
  defaultFilters = {},
  enableAutoRefresh = false,
  refreshInterval = 30000,
}: UsePaginatedDataOptions): UsePaginatedDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Search and sort state
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  // Filter state
  const [filters, setFilters] = useState<Record<string, string | number | boolean>>(defaultFilters);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when search or filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearch, filters, sortBy, sortOrder, page]);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    
    if (sortBy) {
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value.toString());
      }
    });
    
    return params.toString();
  }, [page, limit, debouncedSearch, sortBy, sortOrder, filters]);

  // Fetch data function
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const url = `${endpoint}?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: PaginatedResponse<T> = await response.json();

      setData(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
      setHasNextPage(result.hasNextPage || false);
      setHasPrevPage(result.hasPrevPage || false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching data";
      setError(errorMessage);
      console.error("Error fetching paginated data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [endpoint, queryParams]);

  // Initial load and when query params change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, fetchData]);

  // Search setter with immediate state update
  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
  }, []);

  // Filter management functions
  const updateFilter = useCallback((key: string, value: string | number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  // Navigation functions
  const goToFirstPage = useCallback(() => setPage(1), []);
  const goToLastPage = useCallback(() => setPage(totalPages), [totalPages]);
  const goToNextPage = useCallback(() => {
    if (hasNextPage) setPage(prev => prev + 1);
  }, [hasNextPage]);
  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) setPage(prev => prev - 1);
  }, [hasPrevPage]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
    search,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setLimit,
    setSearch,
    setSortBy,
    setSortOrder,
    setFilters,
    updateFilter,
    removeFilter,
    clearFilters,
    refresh,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
  };
}
