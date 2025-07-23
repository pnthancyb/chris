import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: (failureCount, error: any) => {
      // Don't retry if it's an auth error
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const logout = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest('POST', '/api/auth/logout');
      } catch (error) {
        // Even if logout fails, we should clear local state
        console.warn('Logout request failed, but continuing with local cleanup');
      }
    },
    onSuccess: () => {
      // Force a hard refresh to clear all state
      window.location.href = '/';
    },
    onError: () => {
      // Even on error, redirect to clear state
      window.location.href = '/';
    },
  });

  return {
    user: user || null,
    isLoading,
    error,
    logout: logout.mutate,
    isLoggedIn: !!user && !error,
  };
}