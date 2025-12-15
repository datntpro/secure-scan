'use client';

import { useState, useEffect } from 'react';
import { 
  ServerIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ZAPNode {
  id: string;
  url: string;
  is_healthy: boolean;
  active_scans: number;
  total_scans: number;
  response_time: number;
  weight: number;
  load_score: number;
}

interface ZAPClusterStatus {
  strategy: string;
  total_nodes: number;
  healthy_nodes: number;
  unhealthy_nodes: number;
  total_active_scans: number;
  total_scans_processed: number;
  nodes: ZAPNode[];
  pool_manager?: {
    total_instances: number;
    queue_size: number;
    status_breakdown: Record<string, number>;
    instances: Array<{
      id: string;
      port: number;
      status: string;
      current_scan: string | null;
      uptime: number;
    }>;
  };
}

export default function ZAPClusterPage() {
  const [clusterStatus, setClusterStatus] = useState<ZAPClusterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNode, setNewNode] = useState({
    host: '',
    port: 8080,
    api_key: 'securescan-zap-key',
    weight: 1
  });

  useEffect(() => {
    fetchClusterStatus();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchClusterStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchClusterStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/admin/zap/cluster-status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClusterStatus(data.data);
        setError(null);
      } else {
        throw new Error('Failed to fetch cluster status');
      }
    } catch (err) {
      console.error('Error fetching cluster status:', err);
      setError('Không thể tải trạng thái cluster');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/admin/zap/add-node', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNode),
      });

      if (response.ok) {
        setShowAddNode(false);
        setNewNode({ host: '', port: 8080, api_key: 'securescan-zap-key', weight: 1 });
        fetchClusterStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Không thể thêm node');
      }
    } catch (err) {
      console.error('Error adding node:', err);
      setError('Lỗi khi thêm node');
    }
  };

  const handleRemoveNode = async (nodeId: string) => {
    if (!confirm('Bạn có chắc muốn xóa node này?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/admin/zap/remove-node/${nodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchClusterStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Không thể xóa node');
      }
    } catch (err) {
      console.error('Error removing node:', err);
      setError('Lỗi khi xóa node');
    }
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? CheckCircleIcon : ExclamationTriangleIcon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ZAP Cluster Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý cluster OWASP ZAP instances
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchClusterStatus}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          
          {clusterStatus && clusterStatus.total_nodes > 0 && (
            <button
              onClick={() => setShowAddNode(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Thêm Node
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Overview */}
      {clusterStatus && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Nodes</dt>
                    <dd className="text-lg font-medium text-gray-900">{clusterStatus.total_nodes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Healthy Nodes</dt>
                    <dd className="text-lg font-medium text-gray-900">{clusterStatus.healthy_nodes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Scans</dt>
                    <dd className="text-lg font-medium text-gray-900">{clusterStatus.total_active_scans}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Processed</dt>
                    <dd className="text-lg font-medium text-gray-900">{clusterStatus.total_scans_processed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pool Manager Status */}
      {clusterStatus?.pool_manager && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pool Manager Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Instance Status</h4>
                <div className="space-y-2">
                  {Object.entries(clusterStatus.pool_manager.status_breakdown).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-sm text-gray-500 capitalize">{status}:</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm text-gray-500">Queue Size:</span>
                    <span className="text-sm font-medium text-gray-900">{clusterStatus.pool_manager.queue_size}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Pool Instances</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clusterStatus.pool_manager.instances.map((instance) => (
                    <div key={instance.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{instance.id}</div>
                        <div className="text-xs text-gray-500">Port: {instance.port}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium capitalize ${
                          instance.status === 'idle' ? 'text-green-600' :
                          instance.status === 'busy' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {instance.status}
                        </div>
                        {instance.current_scan && (
                          <div className="text-xs text-gray-500">Scan: {instance.current_scan.slice(0, 8)}...</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nodes List */}
      {clusterStatus && clusterStatus.nodes.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">ZAP Nodes</h3>
            <p className="text-sm text-gray-500">Load balancing strategy: {clusterStatus.strategy}</p>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Node
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Scans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clusterStatus.nodes.map((node) => {
                  const StatusIcon = getStatusIcon(node.is_healthy);
                  return (
                    <tr key={node.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{node.id}</div>
                          <div className="text-sm text-gray-500">{node.url}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${getStatusColor(node.is_healthy)}`} />
                          <span className={`text-sm font-medium ${getStatusColor(node.is_healthy)}`}>
                            {node.is_healthy ? 'Healthy' : 'Unhealthy'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {node.active_scans} / {node.total_scans}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {node.response_time.toFixed(2)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {node.load_score.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveNode(node.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNode && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm ZAP Node</h3>
              
              <form onSubmit={handleAddNode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Host</label>
                  <input
                    type="text"
                    value={newNode.host}
                    onChange={(e) => setNewNode({ ...newNode, host: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="localhost hoặc IP address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Port</label>
                  <input
                    type="number"
                    value={newNode.port}
                    onChange={(e) => setNewNode({ ...newNode, port: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">API Key</label>
                  <input
                    type="text"
                    value={newNode.api_key}
                    onChange={(e) => setNewNode({ ...newNode, api_key: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newNode.weight}
                    onChange={(e) => setNewNode({ ...newNode, weight: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddNode(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Thêm Node
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* No Cluster Message */}
      {clusterStatus && clusterStatus.total_nodes === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có ZAP nodes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bắt đầu bằng cách thêm ZAP node đầu tiên
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddNode(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Thêm ZAP Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}