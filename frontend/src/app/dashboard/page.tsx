'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GlobeAltIcon, 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Subscription {
  plan: string;
  scans_used_this_month: number;
  scans_limit: number;
}

interface Domain {
  id: string;
  url: string;
  status: 'verified' | 'pending' | 'failed';
  last_scan_at?: string;
  risk_score?: string;
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: 'scan_completed' | 'issue_found' | 'domain_added';
  domain_url: string;
  message: string;
  created_at: string;
  risk_score?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({
    totalDomains: 0,
    totalScans: 0,
    openIssues: 0,
    averageRiskScore: 'B'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Load user profile
      const userResponse = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.data);
      }

      // Load subscription info
      const subscriptionResponse = await fetch('/api/v1/users/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.data);
      }

      // Load domains
      const domainsResponse = await fetch('/api/v1/domains?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        setDomains(domainsData.data);
      }

      // Load recent activity
      const activityResponse = await fetch('/api/v1/activity?limit=3', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.data);
      }

      // Load dashboard stats
      const statsResponse = await fetch('/api/v1/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskScoreColor = (score: string) => {
    switch (score) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-green-500 bg-green-50';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-600">SecureScan.vn</span>
                </div>
              </Link>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <Link href="/dashboard" className="text-gray-900 font-medium">Dashboard</Link>
                <Link href="/domains" className="text-gray-500 hover:text-gray-900">Domains</Link>
                <Link href="/scans" className="text-gray-500 hover:text-gray-900">Scans</Link>
                <Link href="/reports" className="text-gray-500 hover:text-gray-900">Reports</Link>
                <Link href="/settings" className="text-gray-500 hover:text-gray-900">Settings</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Notifications</span>
                🔔
              </button>
              <div className="relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <span className="sr-only">Open user menu</span>
                  <span className="text-gray-700">👤 {user?.full_name || 'User'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              👋 Chào {user?.full_name}!
            </h1>
            
            {subscription && (
              <div className="mt-4 bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      🎯 Gói {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} • 
                      {subscription.scans_used_this_month}/{subscription.scans_limit} lượt scan đã sử dụng tháng này
                    </span>
                  </div>
                  <Link
                    href="/settings/subscription"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                  >
                    NÂNG CẤP GÓI
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GlobeAltIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Domains</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalDomains}</dd>
                      <dd className="text-sm text-gray-500">Active</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Scans</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalScans}</dd>
                      <dd className="text-sm text-gray-500">This month</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Issues</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.openIssues}</dd>
                      <dd className="text-sm text-gray-500">Open</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Risk Score</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.averageRiskScore}</dd>
                      <dd className="text-sm text-gray-500">Good</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  📈 Hoạt động gần đây
                </h3>
                <Link
                  href="/activity"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Xem tất cả
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {activity.type === 'scan_completed' ? '🔍' : 
                               activity.type === 'issue_found' ? '⚠️' : '✅'}
                            </span>
                            <span className="font-medium text-gray-900">{activity.domain_url}</span>
                            <span className="ml-2 text-sm text-gray-500">
                              {formatTimeAgo(activity.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{activity.message}</p>
                          {activity.risk_score && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRiskScoreColor(activity.risk_score)}`}>
                              Risk Score: {activity.risk_score}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/scans/${activity.id}`}
                          className="ml-4 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          XEM CHI TIẾT
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Chưa có hoạt động nào</p>
                )}
              </div>
            </div>
          </div>

          {/* Domains Overview */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  🌐 Domains của bạn
                </h3>
                <Link
                  href="/domains/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  THÊM DOMAIN
                </Link>
              </div>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Scan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {domains.length > 0 ? (
                      domains.map((domain) => (
                        <tr key={domain.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(domain.status)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{domain.url}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              domain.status === 'verified' ? 'bg-green-100 text-green-800' :
                              domain.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {domain.status === 'verified' ? 'Verified' :
                               domain.status === 'pending' ? 'Pending' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {domain.last_scan_at ? formatTimeAgo(domain.last_scan_at) : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {domain.risk_score ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskScoreColor(domain.risk_score)}`}>
                                {domain.risk_score}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {domain.status === 'verified' ? (
                              <Link
                                href={`/scans/new?domain=${domain.id}`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                SCAN
                              </Link>
                            ) : (
                              <Link
                                href={`/domains/${domain.id}/verify`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                VERIFY
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Chưa có domain nào. 
                          <Link href="/domains/add" className="text-primary-600 hover:text-primary-500 ml-1">
                            Thêm domain đầu tiên
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                ⚡ Hành động nhanh
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/scans/new"
                  className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 ring-4 ring-white">
                      <MagnifyingGlassIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Scan Website
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Quét bảo mật website ngay
                    </p>
                  </div>
                </Link>

                <Link
                  href="/domains/add"
                  className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 ring-4 ring-white">
                      <GlobeAltIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Add Domain
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Thêm website mới
                    </p>
                  </div>
                </Link>

                <Link
                  href="/reports"
                  className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 ring-4 ring-white">
                      <ChartBarIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      View Reports
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Xem báo cáo chi tiết
                    </p>
                  </div>
                </Link>

                <Link
                  href="/settings/schedule"
                  className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 ring-4 ring-white">
                      <ClockIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" />
                      Schedule Scans
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Lên lịch quét tự động
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}