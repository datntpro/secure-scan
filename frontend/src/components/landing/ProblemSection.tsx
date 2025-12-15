'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function ProblemSection() {
  const stats = [
    {
      number: '8,000+',
      label: 'Cyberattacks',
      description: 'tại VN 2023',
      icon: '🚨',
    },
    {
      number: '$5,000',
      label: 'Mức phạt',
      description: 'PDPD 2023',
      icon: '💰',
    },
    {
      number: '97%',
      label: 'Doanh nghiệp',
      description: 'online VN',
      icon: '📈',
    },
    {
      number: '72%',
      label: 'Không biết',
      description: 'cách bảo vệ',
      icon: '❓',
    },
  ];

  return (
    <div className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-accent-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tại sao website của bạn cần được bảo vệ?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Tình hình an ninh mạng tại Việt Nam đang ngày càng nghiêm trọng, 
            đặc biệt với các doanh nghiệp vừa và nhỏ
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <blockquote className="text-xl font-medium text-gray-900 italic">
            "SME là mục tiêu chính của hacker do thiếu đầu tư bảo mật"
          </blockquote>
          <p className="mt-4 text-sm text-gray-600">
            - Báo cáo An ninh mạng Việt Nam 2023, Cục An toàn thông tin
          </p>
        </div>

        {/* Key risks */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">!</span>
                  </div>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Mất dữ liệu khách hàng
                </h3>
              </div>
              <p className="text-gray-600">
                Thông tin cá nhân, thẻ tín dụng bị đánh cắp. 
                Phạt tới 5% doanh thu theo PDPD 2023.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">₫</span>
                  </div>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Tổn thất tài chính
                </h3>
              </div>
              <p className="text-gray-600">
                Website bị hack, doanh thu giảm, chi phí khắc phục cao. 
                Trung bình 2-5 tỷ VND/vụ việc.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">⚠</span>
                  </div>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Uy tín thương hiệu
                </h3>
              </div>
              <p className="text-gray-600">
                Khách hàng mất niềm tin, đối thủ cạnh tranh lợi dụng. 
                Khôi phục uy tín mất nhiều năm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}