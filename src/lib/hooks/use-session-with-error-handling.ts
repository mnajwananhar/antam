'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook that wraps useSession with better error handling
 * Prevents ERR_ABORTED errors when user is idle for long periods
 */
export function useSessionWithErrorHandling() {
  const { data: session, status, update } = useSession();
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [lastError, setLastError] = useState<string | null>(null);
  const router = useRouter();

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      setIsOnline(true);
      setLastError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle session errors gracefully
  useEffect(() => {
    if (status === 'loading') return;
    
    // If session is null and we're not loading, but we're online
    // This might indicate a session error
    if (!session && status === 'unauthenticated' && isOnline && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on auth pages
      if (!currentPath.startsWith('/auth/') && currentPath !== '/') {
        console.warn('Session lost, redirecting to login');
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(currentPath));
      }
    }
  }, [session, status, isOnline, router]);

  // Custom update function with error handling
  const updateSession = async () => {
    if (!isOnline) {
      setLastError('Cannot update session while offline');
      return;
    }

    try {
      await update();
      setLastError(null);
    } catch (error) {
      console.error('Session update failed:', error);
      setLastError('Failed to update session');
      
      // If update fails, the session might be invalid
      // Let the useEffect above handle the redirect
    }
  };

  return {
    session,
    status,
    update: updateSession,
    isOnline,
    lastError,
    isLoading: status === 'loading',
    isAuthenticated: !!session && status === 'authenticated'
  };
}

/**
 * Hook for components that need to handle session errors
 * without automatic redirects
 */
export function useSessionStatus() {
  const { data: session, status } = useSession();
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('online');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor for session errors
  useEffect(() => {
    if (status === 'loading') return;
    
    // Check for potential session errors
    const checkSessionHealth = async () => {
      if (!session && connectionStatus === 'online' && typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            setConnectionStatus('error');
          }
        } catch (error) {
          console.warn('Session health check failed:', error);
          setConnectionStatus('error');
        }
      }
    };

    const timeoutId = setTimeout(checkSessionHealth, 1000);
    return () => clearTimeout(timeoutId);
  }, [session, status, connectionStatus]);

  return {
    session,
    status,
    connectionStatus,
    isHealthy: connectionStatus === 'online' && (!!session || status === 'loading'),
    hasError: connectionStatus === 'error'
  };
}