'use client';

import { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

export function CTASection() {
  const [url, setUrl] = useState('');

  return (
    <div className="bg-primary-600">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            🚀 Bắt đầu bảo vệ website của bạn ngay hôm nay
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
            Chỉ cần 2 phút để đăng ký và bắt đầu scan đầu tiên
          </p>
          
          <div className="mt-10 max-w-md mx-auto">
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://myshop.vn"
                className="flex-1 rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap"
              >
                QUÉT MIỄN PHÍ NGAY
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-primary-100">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-secondary-400 mr-2" />
              Không cần thẻ tín dụng
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-secondary-400 mr-2" />
              Kết quả trong 15 phút
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-secondary-400 mr-2" />
              Hỗ trợ 24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}