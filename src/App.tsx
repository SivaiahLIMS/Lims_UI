import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LIMS_THEME } from './theme/theme';
import { loadTokensFromStorage } from './api/client';
import AppRouter from './router/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  useEffect(() => {
    loadTokensFromStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={LIMS_THEME}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
