'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ScanProgressProps {
  scanId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

interface ScanStatus {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  started_at?: string;
  estimated_completion?: string;
  spider_progress?: number;
  active_progress?: number;
}

export default function ScanProgress({ scanId, onComplete, onError }: ScanProgressProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>({
    status: 'pending',
    progress: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [scanId]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/api/v1/ws/scan-progress?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      
      // Subscribe to scan updates
      ws.send(JSON.stringify({
        type: 'subscribe_scan',
        scan_id: scanId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'connection_established':
            console.log('WebSocket connected:', message.connection_id);
            break;
            
          case 'scan_status':
          case 'scan_update':
            const data = message.data;
            setScanStatus(prev => ({
              ...prev,
              ...data
            }));
            
            // Check if scan completed
            if (data.status === 'completed' && onComplete) {
              // Fetch full results
              fetchScanResults();
            } else if (data.status === 'failed' && onError) {
              onError('Scan thất bại');
            }
            break;
            
          case 'error':
            setError(message.message);
            if (onError) {
              onError(message.message);
            }
            break;
            
          case 'pong':
            // Keep-alive response
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      
      if (event.code !== 1000) {
        // Reconnect after 5 seconds if not a normal closure
        setTimeout(() => {
          if (scanStatus.status === 'running') {
            connectWebSocket();
          }
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Kết nối WebSocket bị lỗi');
    };

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    // Cleanup interval on close
    ws.addEventListener('close', () => {
      clearInterval(pingInterval);
    });
  };

  const fetchScanResults = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/scans/${scanId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const results = await response.json();
        if (onComplete) {
          onComplete(results.data);
        }
      }
    } catch (err) {
      console.error('Error fetching scan results:', err);
    }
  };

  const getStatusIcon = () => {
    switch (scanStatus.status) {
      case 'pending':
        return <ClockIcon className="h-8 w-8 text-yellow-500" />;
      case 'running':
        return <MagnifyingGlassIcon className="h-8 w-8 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (scanStatus.status) {
      case 'pending':
        return 'Đang chuẩn bị scan...';
      case 'running':
        return 'Đang quét bảo mật...';
      case 'completed':
        return 'Scan hoàn thành!';
      case 'failed':
        return 'Scan thất bại';
      case 'cancelled':
        return 'Scan đã bị hủy';
      default:
        return 'Không xác định';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN');
  };

  const getEstimatedTimeRemaining = () => {
    if (!scanStatus.started_at || scanStatus.progress === 0) return '';
    
    const startTime = new Date(scanStatus.started_at).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    const estimatedTotal = (elapsed / scanStatus.progress) * 100;
    const remaining = estimatedTotal - elapsed;
    
    if (remaining <= 0) return '';
    
    const minutes = Math.ceil(remaining / (1000 * 60));
    return `Còn khoảng ${minutes} phút`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>

        {/* Status Text */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {getStatusText()}
        </h3>

        {/* Connection Status */}
        <div className="flex items-center justify-center mb-4">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Kết nối thành công' : 'Mất kết nối'}
          </span>
        </div>

        {/* Progress Bar */}
        {scanStatus.status === 'running' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Tiến trình</span>
              <span>{scanStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${scanStatus.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Detailed Progress */}
        {scanStatus.status === 'running' && (scanStatus.spider_progress !== undefined || scanStatus.active_progress !== undefined) && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {scanStatus.spider_progress !== undefined && (
              <div>
                <div className="text-gray-600 mb-1">Spider Scan</div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${scanStatus.spider_progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{scanStatus.spider_progress}%</div>
              </div>
            )}
            
            {scanStatus.active_progress !== undefined && (
              <div>
                <div className="text-gray-600 mb-1">Active Scan</div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${scanStatus.active_progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{scanStatus.active_progress}%</div>
              </div>
            )}
          </div>
        )}

        {/* Time Information */}
        {scanStatus.started_at && (
          <div className="text-sm text-gray-600 space-y-1">
            <div>Bắt đầu: {formatTime(scanStatus.started_at)}</div>
            {scanStatus.status === 'running' && (
              <div>{getEstimatedTimeRemaining()}</div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Scan Information */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <div>Scan ID: {scanId}</div>
          <div>Sử dụng OWASP ZAP để quét bảo mật</div>
        </div>
      </div>
    </div>
  );
}