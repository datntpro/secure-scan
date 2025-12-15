'use client';

import { useState } from 'react';
import { ChevronRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

export function HeroSection() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFreeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    // TODO: Implement free scan logic
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to signup with URL pre-filled
      window.location.href = `/auth/register?url=${encodeURIComponent(url)}`;
    }, 1000);
  };

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      {/* Background gradient */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-600 to-secondary-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              Nền tảng bảo mật website đầu tiên cho SME Việt Nam{' '}
              <a href="#features" className="font-semibold text-primary-600">
                <span className="absolute inset-0" aria-hidden="true" />
                Tìm hiểu thêm <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            <span className="flex items-center justify-center mb-4">
              <ShieldCheckIcon className="h-16 w-16 text-primary-600 mr-4" />
            </span>
            Biết website của bạn có{' '}
            <span className="text-primary-600">lỗ hổng gì</span> trong 10 phút
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            <strong>không cần hiểu kỹ thuật</strong>
          </p>

          <p className="mt-4 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Nền tảng quét bảo mật website đầu tiên tại Việt Nam dành riêng cho doanh nghiệp vừa và nhỏ
          </p>

          {/* Free scan form */}
          <div className="mt-10 max-w-md mx-auto">
            <form onSubmit={handleFreeScan} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://myshop.vn"
                  className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    QUÉT MIỄN PHÍ NGAY
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Benefits */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-secondary-600 mr-2" />
              Miễn phí 1 lần quét
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-secondary-600 mr-2" />
              Báo cáo tiếng Việt
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-secondary-600 mr-2" />
              Không cần đăng ký
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-gray-500">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              OWASP Top 10:2025
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              Tuân thủ PDPD 2023
            </div>
            <div className="flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              ISO 27001 Ready
            </div>
          </div>
        </div>
      </div>

      {/* Background gradient bottom */}
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-secondary-600 to-primary-600 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  );
}