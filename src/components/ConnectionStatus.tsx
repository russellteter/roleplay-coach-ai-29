import React from 'react';
import { Wifi, WifiOff, Signal, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { connectionQuality, isOnline } = useConnectionMonitor();

  if (!isOnline) {
    return (
      <Badge variant="destructive" className={`${className} flex items-center gap-1`}>
        <WifiOff className="w-3 h-3" />
        Offline
      </Badge>
    );
  }

  const getStatusConfig = () => {
    switch (connectionQuality.status) {
      case 'excellent':
        return {
          icon: <Signal className="w-3 h-3" />,
          text: `Excellent (${connectionQuality.latency}ms)`,
          variant: 'default' as const,
          className: 'bg-green-500/20 text-green-700 border-green-500/30'
        };
      case 'good':
        return {
          icon: <Signal className="w-3 h-3" />,
          text: `Good (${connectionQuality.latency}ms)`,
          variant: 'secondary' as const,
          className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
        };
      case 'poor':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          text: `Slow (${connectionQuality.latency}ms)`,
          variant: 'outline' as const,
          className: 'bg-orange-500/20 text-orange-700 border-orange-500/30'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Disconnected',
          variant: 'destructive' as const,
          className: ''
        };
      default:
        return {
          icon: <Wifi className="w-3 h-3" />,
          text: 'Checking...',
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant} 
      className={`${className} ${config.className} flex items-center gap-1`}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
};