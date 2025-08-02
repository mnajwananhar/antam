'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isOnline: boolean;
}

export class SessionErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a session-related error
    const isSessionError = 
      error.message.includes('session') ||
      error.message.includes('auth') ||
      error.message.includes('ERR_ABORTED') ||
      error.message.includes('fetch');

    if (isSessionError) {
      return { hasError: true };
    }

    // For non-session errors, don't handle them here
    // Return null to let them bubble up to other error boundaries
    return {};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Session Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  componentDidMount() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      const handleOnline = () => this.setState({ isOnline: true });
      const handleOffline = () => this.setState({ isOnline: false });

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup function will be called in componentWillUnmount
      this.cleanup = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }

  componentWillUnmount() {
    if (this.cleanup) {
      this.cleanup();
    }
  }

  private cleanup?: () => void;

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      
      // Force a page refresh if we've retried multiple times
      if (this.retryCount >= 2 && typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      // Max retries reached, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin?error=session_expired';
      }
    }
  };

  handleGoToLogin = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`;
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { isOnline, error } = this.state;
      const isNetworkError = !isOnline || error?.message.includes('fetch') || error?.message.includes('ERR_ABORTED');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                {isNetworkError ? (
                  isOnline ? <Wifi className="h-6 w-6 text-red-600" /> : <WifiOff className="h-6 w-6 text-red-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <CardTitle className="text-xl font-semibold">
                {isNetworkError ? 'Masalah Koneksi' : 'Masalah Sesi'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {isNetworkError 
                    ? isOnline 
                      ? 'Koneksi ke server terputus. Silakan coba lagi dalam beberapa saat.'
                      : 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.'
                    : 'Sesi Anda telah berakhir atau terjadi kesalahan. Silakan masuk kembali.'
                  }
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {this.retryCount < this.maxRetries ? (
                  <Button 
                    onClick={this.handleRetry} 
                    className="w-full"
                    disabled={!isOnline}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Coba Lagi ({this.maxRetries - this.retryCount} tersisa)
                  </Button>
                ) : (
                  <Button onClick={this.handleGoToLogin} className="w-full">
                    Masuk Kembali
                  </Button>
                )}

                {isNetworkError && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Status: {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Detail Error (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier usage
export function SessionErrorProvider({ children }: { children: ReactNode }) {
  return (
    <SessionErrorBoundary>
      {children}
    </SessionErrorBoundary>
  );
}