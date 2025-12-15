'use client';

import { LightBulbIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

export function SolutionSection() {
  const steps = [
    {
      number: '1️⃣',
      title: 'Nhập URL',
      description: 'website',
      detail: 'Chỉ cần nhập địa chỉ website của bạn',
    },
    {
      number: '2️⃣',
      title: 'Quét tự động',
      description: '15-30 phút',
      detail: 'Hệ thống tự động quét theo chuẩn OWASP',
    },
    {
      number: '3️⃣',
      title: 'Nhận báo cáo',
      description: 'tiếng Việt',
      detail: 'Báo cáo dễ hiểu với hướng dẫn khắc phục',
    },
  ];

  const benefits = [
    'Không cần kiến thức kỹ thuật',
    'Báo cáo dễ hiểu, hướng dẫn fix cụ thể',
    'Giá rẻ, phù hợp SME Việt Nam',
    'Hỗ trợ tiếng Việt 24/7',
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center mb-6">
            <LightBulbIcon className="h-12 w-12 text-accent-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            SecureScan.vn giải quyết như thế nào?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Quy trình đơn giản 3 bước, không cần kiến thức kỹ thuật
          </p>
        </div>

        {/* Process steps */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Step circle */}
                    <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10">
                      {step.number}
                    </div>
                    
                    {/* Step content */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-gray-100 hover:border-primary-200 transition-colors">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-primary-600 font-semibold mb-3">
                        {step.description}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-6 md:hidden">
                      <ArrowRightIcon className="h-6 w-6 text-gray-400 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <CheckIcon className="h-6 w-6 text-secondary-600 mr-4 flex-shrink-0" />
                <span className="text-gray-900 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="mx-auto mt-20 max-w-6xl">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            So sánh với các giải pháp khác
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Tiêu chí
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Tools nước ngoài
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-600 bg-primary-50">
                    SecureScan.vn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Giá cả</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">$300-500/tháng</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 bg-primary-50">199k-1.2tr VND/tháng</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Ngôn ngữ</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Tiếng Anh</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 bg-primary-50">100% Tiếng Việt</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Độ phức tạp</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Cần chuyên gia</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 bg-primary-50">Dễ sử dụng</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Hỗ trợ</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Email (EN)</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 bg-primary-50">Zalo, Phone (VN)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Target</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Enterprise</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 bg-primary-50">SME Việt Nam</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}