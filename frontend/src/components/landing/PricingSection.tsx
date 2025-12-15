'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export function PricingSection() {
  const plans = [
    {
      name: 'FREE',
      price: '0đ',
      period: '',
      description: 'Dùng thử miễn phí',
      features: [
        '1 scan/tháng',
        'Báo cáo cơ bản',
        'Email support',
        'Scan cơ bản (15 phút)',
      ],
      cta: 'THỬ NGAY',
      ctaLink: '/auth/register',
      popular: false,
      color: 'gray',
    },
    {
      name: 'STARTER',
      price: '199k',
      period: '/tháng',
      description: 'Cho shop nhỏ, startup',
      features: [
        '5 scans/tháng',
        'PDF reports',
        'Email alerts',
        'Scan tiêu chuẩn (30 phút)',
        'Hỗ trợ Zalo',
      ],
      cta: 'CHỌN GÓI',
      ctaLink: '/auth/register?plan=starter',
      popular: true,
      color: 'primary',
    },
    {
      name: 'PRO',
      price: '499k',
      period: '/tháng',
      description: 'Cho IT team, agency',
      features: [
        'Unlimited scans',
        'API access',
        'Scheduled scans',
        'Scan sâu (60 phút)',
        'Priority support',
        'Comparison reports',
      ],
      cta: 'CHỌN GÓI',
      ctaLink: '/auth/register?plan=pro',
      popular: false,
      color: 'secondary',
    },
    {
      name: 'AGENCY',
      price: '1.2tr',
      period: '/tháng',
      description: 'Cho dev agency',
      features: [
        'Multi-client support',
        'White-label reports',
        'Team management',
        'Custom branding',
        'Dedicated support',
        'SLA guarantee',
      ],
      cta: 'LIÊN HỆ',
      ctaLink: '/contact',
      popular: false,
      color: 'accent',
    },
  ];

  const getColorClasses = (color: string, popular: boolean) => {
    const baseClasses = popular ? 'ring-2 ring-primary-600 scale-105' : 'ring-1 ring-gray-200';
    
    switch (color) {
      case 'primary':
        return {
          card: `${baseClasses} bg-white`,
          badge: 'bg-primary-600 text-white',
          cta: 'bg-primary-600 text-white hover:bg-primary-700',
        };
      case 'secondary':
        return {
          card: `${baseClasses} bg-white`,
          badge: 'bg-secondary-600 text-white',
          cta: 'bg-secondary-600 text-white hover:bg-secondary-700',
        };
      case 'accent':
        return {
          card: `${baseClasses} bg-white`,
          badge: 'bg-accent-600 text-white',
          cta: 'bg-accent-600 text-white hover:bg-accent-700',
        };
      default:
        return {
          card: `${baseClasses} bg-white`,
          badge: 'bg-gray-600 text-white',
          cta: 'bg-gray-600 text-white hover:bg-gray-700',
        };
    }
  };

  return (
    <div id="pricing" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Bảng giá
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Phù hợp với mọi quy mô
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Từ shop nhỏ đến agency lớn, chúng tôi có gói phù hợp với ngân sách của bạn
          </p>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-x-8 xl:gap-x-12">
          {plans.map((plan) => {
            const colorClasses = getColorClasses(plan.color, plan.popular);
            
            return (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 xl:p-10 ${colorClasses.card} relative transition-all duration-200 hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1 text-sm font-medium text-white">
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {plan.name}
                  </h3>
                </div>
                
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {plan.description}
                </p>
                
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    {plan.period}
                  </span>
                </p>
                
                <Link
                  href={plan.ctaLink}
                  className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${colorClasses.cta}`}
                >
                  {plan.cta}
                </Link>
                
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className="h-6 w-5 flex-none text-primary-600"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Target audience */}
        <div className="mx-auto mt-16 max-w-4xl text-center">
          <p className="text-lg text-gray-600">
            🎯 <strong>Phù hợp với:</strong> Shop online, Startup, IT Manager, Dev Agency
          </p>
        </div>

        {/* Money back guarantee */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💰 Cam kết hoàn tiền 100%
            </h3>
            <p className="text-gray-600">
              Không hài lòng trong 30 ngày đầu? Chúng tôi hoàn lại toàn bộ tiền, không hỏi lý do.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Câu hỏi thường gặp
          </h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Có thể thay đổi gói sau không?
              </h4>
              <p className="text-gray-600 text-sm">
                Có, bạn có thể nâng cấp hoặc hạ cấp bất cứ lúc nào. 
                Phí sẽ được tính theo tỷ lệ.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Có hỗ trợ thanh toán VNPay không?
              </h4>
              <p className="text-gray-600 text-sm">
                Hiện tại chúng tôi hỗ trợ thẻ tín dụng/ghi nợ. 
                VNPay sẽ được bổ sung sớm.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Scan có ảnh hưởng đến website không?
              </h4>
              <p className="text-gray-600 text-sm">
                Không, chúng tôi chỉ gửi requests thông thường như user bình thường. 
                Không làm chậm hay crash website.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Dữ liệu có được bảo mật không?
              </h4>
              <p className="text-gray-600 text-sm">
                Tuyệt đối. Chúng tôi tuân thủ PDPD 2023, mã hóa tất cả dữ liệu 
                và không chia sẻ với bên thứ 3.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}