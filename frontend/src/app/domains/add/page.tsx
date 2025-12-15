'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlobeAltIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const addDomainSchema = z.object({
  url: z
    .string()
    .min(1, 'URL không được để trống')
    .url('URL không hợp lệ')
    .refine((url) => {
      // Ensure URL starts with http:// or https://
      return url.startsWith('http://') || url.startsWith('https://');
    }, 'URL phải bắt đầu với http:// hoặc https://'),
  description: z.string().optional(),
  confirmOwnership: z.boolean().refine((val: boolean) => val === true, 'Bạn phải xác nhận quyền sở hữu website'),
});

type AddDomainForm = z.infer<typeof addDomainSchema>;

export default function AddDomainPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AddDomainForm>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: {
      url: '',
      description: '',
      confirmOwnership: false,
    },
  });

  const url = watch('url');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    
    // Auto-add https:// if no protocol is specified
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'https://' + value;
    }
    
    setValue('url', value);
  };

  const onSubmit = async (data: AddDomainForm) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/v1/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          description: data.description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Domain đã được thêm thành công!');
        router.push(`/domains/${result.data.id}/verify`);
      } else {
        toast.error(result.error?.message || 'Không thể thêm domain');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        isValid: true,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
      };
    } catch {
      return { isValid: false };
    }
  };

  const urlValidation = url ? validateUrl(url) : { isValid: false };

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
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/domains" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Quay lại danh sách domains
                </Link>
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 mr-3 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thêm Domain Mới</h1>
                <p className="mt-2 text-gray-600">
                  Nhập URL website bạn muốn quét bảo mật
                </p>
              </div>
            </div>
          </div>

          {/* Add Domain Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* URL Input */}
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL Website *
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('url')}
                      type="url"
                      placeholder="https://mywebsite.com"
                      onChange={handleUrlChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.url && (
                      <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                    )}
                    
                    {/* URL Preview */}
                    {url && urlValidation.isValid && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="text-blue-400 text-lg">ℹ️</span>
                          </div>
                          <div className="ml-3 text-sm text-blue-700">
                            <p className="font-medium">URL hợp lệ</p>
                            <p>Domain: <span className="font-mono">{urlValidation.hostname}</span></p>
                            <p>Protocol: <span className="font-mono">{urlValidation.protocol}</span></p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Ví dụ: https://myshop.vn hoặc https://company.com.vn
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Mô tả (tùy chọn)
                  </label>
                  <div className="mt-1">
                    <textarea
                      {...register('description')}
                      rows={3}
                      placeholder="Website bán hàng chính, blog công ty, v.v..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Mô tả ngắn gọn để dễ nhận biết domain này
                  </p>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400 text-lg">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Lưu ý quan trọng:
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Bạn chỉ được quét website mà bạn sở hữu</li>
                          <li>Cần xác minh quyền sở hữu trước khi quét</li>
                          <li>Không được quét website của bên thứ 3</li>
                          <li>Vi phạm có thể dẫn đến khóa tài khoản</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ownership Confirmation */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      {...register('confirmOwnership')}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="confirmOwnership" className="font-medium text-gray-700">
                      Tôi xác nhận đây là website của tôi
                    </label>
                    <p className="text-gray-500">
                      Bằng cách check vào ô này, bạn xác nhận rằng bạn có quyền sở hữu hoặc được ủy quyền quét website này.
                    </p>
                    {errors.confirmOwnership && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmOwnership.message}</p>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/domains"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    HỦY
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'THÊM DOMAIN'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ❓ Cần hỗ trợ?
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">📖 Hướng dẫn</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Xem hướng dẫn chi tiết cách thêm và xác minh domain
                  </p>
                  <Link href="/docs/add-domain" className="mt-2 text-sm text-primary-600 hover:text-primary-500">
                    Đọc hướng dẫn →
                  </Link>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">💬 Hỗ trợ</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Liên hệ team hỗ trợ nếu gặp khó khăn
                  </p>
                  <div className="mt-2 space-x-4">
                    <Link href="/support" className="text-sm text-primary-600 hover:text-primary-500">
                      Chat support
                    </Link>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">Hotline: 1900-xxx-xxx</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}