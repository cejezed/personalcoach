import { QueryClient } from '@tanstack/react-query';

// Query client voor React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuten
      cacheTime: 10 * 60 * 1000, // 10 minuten
    },
  },
});

// API request helper functie
export const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(`/api${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
};
