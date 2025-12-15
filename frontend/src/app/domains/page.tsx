'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GlobeAltIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  Cog6ToothIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

interface Domain {
  id: string;
  url: string;
  description?: string;
  status: 'verified' | 'pending' | 'failed';
  last_scan_at?: string;
  risk_score?: string;
  created_at: string;
  verification_method?: string;
  verification_token?: string;
}

export default function DomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    filterAndSortDomains();
  }, [domains, searchQuery, statusFilter, sortBy]);

  const loadDomains = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/v1/domains', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDomains(data.data || []);
      } else {
        toast.error('Không thể tải danh sách domains');
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Có lỗi xảy ra khi tải domains');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortDomains = () => {
    let filtered = domains;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(domain => 
        domain.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(domain => domain.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.url.localeCompare(b.url);
        case 'last_scan':
          if (!a.last_scan_at && !b.last_scan_at) return 0;
          if (!a.last_scan_at) return 1;
          if (!b.last_scan_at) return -1;
          return new Date(b.last_scan_at).getTime() - new Date(a.last_scan_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredDomains(filtered);
  };

  const handleSelectDomain = (domainId: string) => {
    setSelectedDomains(prev => 
      prev.includes(domainId) 
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDomains.length === filteredDomains.length) {
      setSelectedDomains([]);
    } else {
      setSelectedDomains(filteredDomains.map(domain => domain.id));
    }
  };

  const handleBulkScan = async () => {
    if (selectedDomains.length === 0) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/scans/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_ids: selectedDomains
        }),
      });

      if (response.ok) {
        toast.success(`Đã bắt đầu scan ${selectedDomains.length} domains`);
        setSelectedDomains([]);
        router.push('/scans');
      } else {
        toast.error('Không thể bắt đầu scan');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDomains.length === 0) return;
    
    if (!confirm(`Bạn có chắc muốn xóa ${selectedDomains.length} domains?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/domains/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_ids: selectedDomains
        }),
      });

      if (response.ok) {
        toast.success(`Đã xóa ${selectedDomains.length} domains`);
        setSelectedDomains([]);
        loadDomains();
      } else {
        toast.error('Không thể xóa domains');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Bạn có chắc muốn xóa domain này?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/domains/${domainId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Đã xóa domain');
        loadDomains();
      } else {
        toast.error('Không thể xóa domain');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
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
                <span className="text-2xl font-bold text-primary-600">SecureScan.vn</span>
              </Link>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
                <Link href="/domains" className="text-gray-900 font-medium">Domains</Link>
                <Link href="/scans" className="text-gray-500 hover:text-gray-900">Scans</Link>
                <Link href="/reports" className="text-gray-500 hover:text-gray-900">Reports</Link>
                <Link href="/settings" className="text-gray-500 hover:text-gray-900">Settings</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <GlobeAltIcon className="h-8 w-8 mr-3 text-primary-600" />
                  Quản lý Domains
                </h1>
                <p className="mt-2 text-gray-600">
                  Quản lý tất cả websites bạn muốn quét bảo mật
                </p>
              </div>
              <Link
                href="/domains/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                THÊM DOMAIN
              </Link>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {/* Search */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm domain..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="name">Tên A-Z</option>
                    <option value="last_scan">Scan gần nhất</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDomains.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedDomains.length === filteredDomains.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-primary-900">
                    Đã chọn {selectedDomains.length} domains
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleBulkScan}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                  >
                    Scan tất cả
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Xóa đã chọn
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Domains Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDomains.length === filteredDomains.length && filteredDomains.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Scan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDomains.length > 0 ? (
                    filteredDomains.map((domain) => (
                      <tr key={domain.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDomains.includes(domain.id)}
                            onChange={() => handleSelectDomain(domain.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(domain.status)}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{domain.url}</div>
                              {domain.description && (
                                <div className="text-sm text-gray-500">{domain.description}</div>
                              )}
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
                          {formatTimeAgo(domain.created_at)}
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600">
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none rounded-md">
                                <div className="py-1">
                                  {domain.status === 'verified' ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={`/scans/new?domain=${domain.id}`}
                                          className={`${
                                            active ? 'bg-gray-100' : ''
                                          } flex items-center px-4 py-2 text-sm text-gray-700`}
                                        >
                                          <MagnifyingGlassIcon className="h-4 w-4 mr-3" />
                                          Scan ngay
                                        </Link>
                                      )}
                                    </Menu.Item>
                                  ) : (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={`/domains/${domain.id}/verify`}
                                          className={`${
                                            active ? 'bg-gray-100' : ''
                                          } flex items-center px-4 py-2 text-sm text-gray-700`}
                                        >
                                          <CheckCircleIcon className="h-4 w-4 mr-3" />
                                          Verify domain
                                        </Link>
                                      )}
                                    </Menu.Item>
                                  )}
                                  <Menu.Item>
                                    {({ active }) => (
                                      <Link
                                        href={`/domains/${domain.id}/reports`}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } flex items-center px-4 py-2 text-sm text-gray-700`}
                                      >
                                        <EyeIcon className="h-4 w-4 mr-3" />
                                        Xem reports
                                      </Link>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <Link
                                        href={`/domains/${domain.id}/settings`}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } flex items-center px-4 py-2 text-sm text-gray-700`}
                                      >
                                        <Cog6ToothIcon className="h-4 w-4 mr-3" />
                                        Cài đặt
                                      </Link>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDeleteDomain(domain.id)}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } flex items-center w-full px-4 py-2 text-sm text-red-700`}
                                      >
                                        <TrashIcon className="h-4 w-4 mr-3" />
                                        Xóa domain
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có domains</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Bắt đầu bằng cách thêm domain đầu tiên của bạn.
                        </p>
                        <div className="mt-6">
                          <Link
                            href="/domains/add"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Thêm Domain
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredDomains.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{filteredDomains.length}</span> trong tổng số{' '}
                    <span className="font-medium">{domains.length}</span> domains
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Previous
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}