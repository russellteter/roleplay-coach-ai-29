import { useState, useEffect, useCallback } from 'react';

interface ConnectionQuality {
  status: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency: number;
  lastCheck: Date;
}

interface UseConnectionMonitorReturn {
  connectionQuality: ConnectionQuality;
  isOnline: boolean;
  testConnection: () => Promise<void>;
}

export const useConnectionMonitor = (): UseConnectionMonitorReturn => {
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    status: 'disconnected',
    latency: 0,
    lastCheck: new Date()
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Test connection to edge function health endpoint
  const testConnection = useCallback(async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${import.meta.env.SUPABASE_FUNCTIONS_URL}/realtime-voice/health`, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        let status: ConnectionQuality['status'];
        if (latency < 100) status = 'excellent';
        else if (latency < 300) status = 'good';
        else status = 'poor';
        
        setConnectionQuality({
          status,
          latency,
          lastCheck: new Date()
        });
      } else {
        setConnectionQuality({
          status: 'disconnected',
          latency: 0,
          lastCheck: new Date()
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionQuality({
        status: 'disconnected',
        latency: 0,
        lastCheck: new Date()
      });
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      testConnection();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality(prev => ({ ...prev, status: 'disconnected' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testConnection();

    // Periodic connection quality checks (every 30 seconds)
    const interval = setInterval(testConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [testConnection]);

  return {
    connectionQuality,
    isOnline,
    testConnection
  };
};