'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MagnifyingGlassIcon, 
  ArrowLeftIcon,
  GlobeAltIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ScanProgress from '@/components/scan/ScanProgress';

const newScanSchema = z.object({
  domain_id: z.string().min(1, 'Vui lòng chọn domain'),
  scan_type: z.enum(['quick', 'standard', 'full', 'custom']),
  scan_options: z.object({
    include_passive: z.boolean().optional(),
    include_active: z.boolean().optional(),
    max_depth: z.number().min(1).max(10).optional(),
    exclude_paths: z.string().optional(),
    custom_headers: z.string().optional(),
  }).optional(),
});

type NewScanForm = z.infer<typeof newScanSchema>;

interface Domain {
  id: string;
  url: string;
  description?: string;
  status: string;
}

export default function NewScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NewScanForm>({
    resolver: zodResolver(newScanSchema),
    defaultValues: {
      domain_id: '',
      scan_type: 'standard',
      scan_options: {
        include_passive: true,
        include_active: true,
        max_depth: 3,
        exclude_paths: '',
        custom_headers: '',
      },
    },
  });

  const selectedDomainId = watch('domain_id');
  const scanType = watch('scan_type');

  useEffect(() => {
    loadDomains();
    
    // Pre-select domain if provided in URL
    const domainParam = searchParams.get('domain');
    if (domainParam) {
      setValue('domain_id', domainParam);
    }
  }, [searchParams, setValue]);

  const loadDomains = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/v1/domains?status=verified', {
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
    }
  };

  const onSubmit = async (data: NewScanForm) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/scans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Scan đã được bắt đầu!');
        setCurrentScan(result.data);
      } else {
        toast.error(result.error?.message || 'Không thể bắt đầu scan');
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanComplete = (results: any) => {
    toast.success('Scan hoàn thành!');
    router.push(`/scans/${currentScan.id}/results`);
  };

  const handleScanError = (error: string) => {
    toast.error(`Scan thất bại: ${error}`);
    setCurrentScan(null);
  };

  const getScanTypeDescription = (type: string) => {
    switch (type) {
      case 'quick':
        return 'Quét nhanh các lỗ hổng phổ biến (5-10 phút)';
      case 'standard':
        return 'Quét tiêu chuẩn với độ sâu vừa phải (15-30 phút)';
      case 'full':
        return 'Quét toàn diện tất cả lỗ hổng (30-60 phút)';
      case 'custom':
        return 'Tùy chỉnh các tham số scan theo nhu cầu';
      default:
        return '';
    }
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  // If scan is running, show progress
  if (currentScan) {
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
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Đang quét: {selectedDomain?.url}
              </h1>
              <p className="mt-2 text-gray-600">
                Scan ID: {currentScan.id}
              </p>
            </div>

            <ScanProgress
              scanId={currentScan.id}
              onComplete={handleScanComplete}
              onError={handleScanError}
            />
          </div>
        </main>
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
                <Link href="/domains" className="text-gray-500 hover:text-gray-900">Domains</Link>
                <Link href="/scans" className="text-gray-900 font-medium">Scans</Link>
                <Link href="/reports" className="text-gray-500 hover:text-gray-900">Reports</Link>
                <Link href="/settings" className="text-gray-500 hover:text-gray-900">Settings</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/scans" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Quay lại danh sách scans
                </Link>
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="h-8 w-8 mr-3 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Scan Bảo Mật Mới</h1>
                <p className="mt-2 text-gray-600">
                  Chọn domain và cấu hình scan để bắt đầu quét bảo mật
                </p>
              </div>
            </div>
          </div>

          {/* New Scan Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Domain Selection */}
                <div>
                  <label htmlFor="domain_id" className="block text-sm font-medium text-gray-700">
                    Chọn Domain *
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('domain_id')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">-- Chọn domain để scan --</option>
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.id}>
                          {domain.url} {domain.description && `(${domain.description})`}
                        </option>
                      ))}
                    </select>
                    {errors.domain_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.domain_id.message}</p>
                    )}
                  </div>
                  {domains.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Chưa có domain nào được xác minh. 
                      <Link href="/domains/add" className="text-primary-600 hover:text-primary-500 ml-1">
                        Thêm domain mới
                      </Link>
                    </p>
                  )}
                </div>

                {/* Scan Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Loại Scan *
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'quick', label: 'Quick Scan', icon: '⚡' },
                      { value: 'standard', label: 'Standard Scan', icon: '🔍' },
                      { value: 'full', label: 'Full Scan', icon: '🛡️' },
                      { value: 'custom', label: 'Custom Scan', icon: '⚙️' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-start">
                        <input
                          {...register('scan_type')}
                          type="radio"
                          value={option.value}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{option.icon}</span>
                            <span className="text-sm font-medium text-gray-900">{option.label}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {getScanTypeDescription(option.value)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.scan_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.scan_type.message}</p>
                  )}
                </div>

                {/* Advanced Options */}
                {(scanType === 'custom' || showAdvanced) && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Tùy chọn nâng cao</h3>
                      {scanType !== 'custom' && (
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          {showAdvanced ? 'Ẩn' : 'Hiện'} tùy chọn
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* Scan Methods */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phương thức scan
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              {...register('scan_options.include_passive')}
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Passive Scan</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              {...register('scan_options.include_active')}
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active Scan</span>
                          </label>
                        </div>
                      </div>

                      {/* Max Depth */}
                      <div>
                        <label htmlFor="max_depth" className="block text-sm font-medium text-gray-700">
                          Độ sâu tối đa
                        </label>
                        <div className="mt-1">
                          <select
                            {...register('scan_options.max_depth', { valueAsNumber: true })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(depth => (
                              <option key={depth} value={depth}>{depth} level</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Exclude Paths */}
                      <div className="sm:col-span-2">
                        <label htmlFor="exclude_paths" className="block text-sm font-medium text-gray-700">
                          Loại trừ đường dẫn
                        </label>
                        <div className="mt-1">
                          <textarea
                            {...register('scan_options.exclude_paths')}
                            rows={3}
                            placeholder="/admin/*, /private/*, *.pdf"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Các đường dẫn sẽ không được scan, mỗi đường dẫn một dòng
                        </p>
                      </div>

                      {/* Custom Headers */}
                      <div className="sm:col-span-2">
                        <label htmlFor="custom_headers" className="block text-sm font-medium text-gray-700">
                          Custom Headers
                        </label>
                        <div className="mt-1">
                          <textarea
                            {...register('scan_options.custom_headers')}
                            rows={3}
                            placeholder="Authorization: Bearer token&#10;X-Custom-Header: value"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Headers tùy chỉnh cho requests, format: Header: Value
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show Advanced Toggle */}
                {scanType !== 'custom' && !showAdvanced && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-1" />
                      Tùy chọn nâng cao
                    </button>
                  </div>
                )}

                {/* Selected Domain Info */}
                {selectedDomain && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <GlobeAltIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Domain được chọn
                        </h3>
                        <div className="mt-1 text-sm text-blue-700">
                          <p className="font-medium">{selectedDomain.url}</p>
                          {selectedDomain.description && (
                            <p>{selectedDomain.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/scans"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    HỦY
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedDomainId}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang bắt đầu...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                        BẮT ĐẦU SCAN
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Information */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ℹ️ Thông tin về các loại scan
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">⚡ Quick Scan</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Quét nhanh các lỗ hổng phổ biến nhất như SQL Injection, XSS, CSRF. 
                    Thích hợp cho kiểm tra nhanh.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">🔍 Standard Scan</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Quét tiêu chuẩn với độ sâu vừa phải, bao gồm hầu hết các lỗ hổng OWASP Top 10. 
                    Khuyến nghị cho sử dụng thường xuyên.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">🛡️ Full Scan</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Quét toàn diện tất cả các lỗ hổng có thể, bao gồm cả các test chuyên sâu. 
                    Thích hợp cho audit bảo mật định kỳ.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">⚙️ Custom Scan</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Tùy chỉnh các tham số scan theo nhu cầu cụ thể. 
                    Dành cho người dùng có kinh nghiệm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}