'use client';

import { useState, useEffect } from 'react';
import { 
  UsersIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SystemStats {
  users: {
    total: number;
    active_30_days: number;
    subscription_breakdown: Record<string, number>;
  };
  domains: {
    total: number;
    verified: number;
    pending: number;
  };
  scans: {
    total: number;
    running: number;
    completed: number;
    last_24_hours: number;
  };
  system: {
    zap_pool_enabled: boolean;
    max_concurrent_scans: number;
    environment: string;
  };
}

interface ZAPClusterStatus {
  mode: string;
  pool_enabled: boolean;
  total_nodes?: number;
  healthy_nodes?: number;
  unhealthy_nodes?: number;
  total_active_scans?: number;
  nodes?: Array<{
    id: string;
    url: string;
    is_healthy: boolean;
    active_scans: number;
    response_time: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [zapStatus, setZapStatus] = useState<ZAPClusterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch system stats
      const statsResponse = await fetch('/api/v1/admin/system/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch ZAP cluster status
      const zapResponse = await fetch('/api/v1/admin/zap/cluster-status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (zapResponse.ok) {
        const zapData = await zapResponse.json();
        setZapStatus(zapData.data);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && (
                <dd className="text-sm text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Quản trị</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tổng quan hệ thống SecureScan.vn
        </p>
      </div>

      {/* System Stats */}
      {stats && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Thống kê hệ thống</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Tổng người dùng"
              value={stats.users.total}
              subtitle={`${stats.users.active_30_days} hoạt động (30 ngày)`}
              icon={UsersIcon}
              color="blue"
            />
            <StatCard
              title="Tổng domains"
              value={stats.domains.total}
              subtitle={`${stats.domains.verified} đã xác minh`}
              icon={GlobeAltIcon}
              color="green"
            />
            <StatCard
              title="Tổng scans"
              value={stats.scans.total}
              subtitle={`${stats.scans.last_24_hours} trong 24h`}
              icon={MagnifyingGlassIcon}
              color="purple"
            />
            <StatCard
              title="Scans đang chạy"
              value={stats.scans.running}
              subtitle={`${stats.scans.completed} hoàn thành`}
              icon={ClockIcon}
              color="orange"
            />
          </div>
        </div>
      )}

      {/* ZAP Cluster Status */}
      {zapStatus && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Trạng thái ZAP Cluster</h2>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Cluster Overview */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Tổng quan Cluster</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Chế độ:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {zapStatus.mode === 'cluster' ? 'Cluster Mode' : 'Single Instance'}
                    </span>
                  </div>
                  
                  {zapStatus.pool_enabled && zapStatus.total_nodes !== undefined && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tổng nodes:</span>
                        <span className="text-sm font-medium text-gray-900">{zapStatus.total_nodes}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Nodes khỏe mạnh:</span>
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium text-green-600">{zapStatus.healthy_nodes}</span>
                        </div>
                      </div>
                      
                      {zapStatus.unhealthy_nodes! > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Nodes có vấn đề:</span>
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm font-medium text-red-600">{zapStatus.unhealthy_nodes}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Scans đang chạy:</span>
                        <span className="text-sm font-medium text-gray-900">{zapStatus.total_active_scans}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Node Details */}
              {zapStatus.nodes && zapStatus.nodes.length > 0 && (
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Chi tiết Nodes</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {zapStatus.nodes.map((node) => (
                      <div key={node.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            node.is_healthy ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{node.id}</div>
                            <div className="text-xs text-gray-500">{node.url}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {node.active_scans} scans
                          </div>
                          <div className="text-xs text-gray-500">
                            {node.response_time.toFixed(2)}s
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Breakdown */}
      {stats && Object.keys(stats.users.subscription_breakdown).length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Phân bố Subscription</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Object.entries(stats.users.subscription_breakdown).map(([plan, count]) => (
                <div key={plan} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500 capitalize">{plan}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      {stats && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin hệ thống</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-gray-500">Environment</div>
                <div className="text-lg font-medium text-gray-900 capitalize">
                  {stats.system.environment}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">ZAP Pool</div>
                <div className="flex items-center">
                  {stats.system.zap_pool_enabled ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-lg font-medium text-green-600">Enabled</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-lg font-medium text-orange-600">Disabled</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Max Concurrent Scans</div>
                <div className="text-lg font-medium text-gray-900">
                  {stats.system.max_concurrent_scans}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}