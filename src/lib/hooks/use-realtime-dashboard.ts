"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface KtaTtaData {
  rencana: number;
  aktual: number;
  persentase: number;
  bulan: string;
  tahun: number;
}

interface StatusTindakLanjutData {
  open: number;
  close: number;
  total: number;
  persentaseClose: number;
  bulan: string;
  tahun: number;
}

interface DashboardData {
  ktaTta: KtaTtaData;
  statusTindakLanjut: StatusTindakLanjutData;
  timestamp: number;
  error?: string;
}

interface UseRealtimeDashboardOptions {
  departmentCode: string;
  period: string;
  enabled?: boolean;
}

interface UseRealtimeDashboardReturn {
  data: DashboardData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useRealtimeDashboard({
  departmentCode,
  period,
  enabled = true,
}: UseRealtimeDashboardOptions): UseRealtimeDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback((): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback((): void => {
    if (!enabled) return;

    cleanup();
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/dashboard/kta-tta/stream?department=${encodeURIComponent(departmentCode)}&period=${encodeURIComponent(period)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (): void => {
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event: MessageEvent): void => {
        try {
          const parsedData = JSON.parse(event.data) as DashboardData;
          if (parsedData.error) {
            setError(parsedData.error as string);
          } else {
            setData(parsedData);
            setError(null);
          }
        } catch (parseError) {
          console.error("Error parsing SSE data:", parseError);
          setError("Failed to parse data");
        }
      };

      eventSource.onerror = (): void => {
        setIsConnected(false);
        setIsLoading(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          setError(`Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          setError("Connection failed after multiple attempts");
        }
      };
    } catch (connectionError) {
      console.error("Error creating EventSource:", connectionError);
      setError("Failed to establish connection");
      setIsLoading(false);
    }
  }, [departmentCode, period, enabled, cleanup]);

  const reconnect = useCallback((): void => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      cleanup();
      setIsLoading(false);
    }

    return cleanup;
  }, [connect, cleanup, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    reconnect,
  };
}