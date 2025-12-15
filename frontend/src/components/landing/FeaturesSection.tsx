'use client';

import { 
  ShieldExclamationIcon, 
  BugAntIcon, 
  LockClosedIcon, 
  ShieldCheckIcon,
  KeyIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export function FeaturesSection() {
  const vulnerabilities = [
    {
      icon: BugAntIcon,
      title: 'SQL Injection',
      description: 'Lỗ hổng cho phép kẻ tấn công truy cập database',
      emoji: '🔓',
    },
    {
      icon: ShieldExclamationIcon,
      title: 'XSS Cross-Site Scripting',
      description: 'Chèn mã độc vào website để đánh cắp thông tin',
      emoji: '🚫',
    },
    {
      icon: LockClosedIcon,
      title: 'SSL/TLS Certificate',
      description: 'Kiểm tra chứng chỉ bảo mật và cấu hình HTTPS',
      emoji: '🔐',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Security Headers',
      description: 'Các header bảo mật quan trọng cho website',
      emoji: '🛡️',
    },
    {
      icon: KeyIcon,
      title: 'Auth Bypass',
      description: 'Lỗ hổng bỏ qua xác thực người dùng',
      emoji: '🔑',
    },
    {
      icon: FolderIcon,
      title: 'Directory Traversal',
      description: 'Truy cập trái phép vào file hệ thống',
      emoji: '📁',
    },
    {
      icon: MagnifyingGlassIcon,
      title: 'CVE Known Vulns',
      description: 'Lỗ hổng đã biết trong phần mềm cũ',
      emoji: '🔍',
    },
    {
      icon: CogIcon,
      title: 'Config Errors',
      description: 'Cấu hình sai có thể gây rủi ro bảo mật',
      emoji: '⚙️',
    },
  ];

  return (
    <div id="features" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center mb-6">
            <MagnifyingGlassIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Chúng tôi quét những gì?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Quét toàn diện theo chuẩn OWASP Top 10:2025 và hơn 40 loại lỗ hổng khác
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {vulnerabilities.map((vuln, index) => (
              <div
                key={index}
                className="group relative bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{vuln.emoji}</div>
                  <vuln.icon className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {vuln.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {vuln.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              + 40+ loại lỗ hổng khác theo chuẩn OWASP Top 10:2025
            </h3>
            <p className="text-gray-600 mb-6">
              Bao gồm tất cả các lỗ hổng trong danh sách OWASP Top 10 mới nhất, 
              cùng với các kiểm tra bảo mật chuyên sâu khác
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'A01: Broken Access Control',
                'A02: Security Misconfiguration', 
                'A03: Software Supply Chain',
                'A04: Cryptographic Failures',
                'A05: Injection',
                'A06: Insecure Design',
                'A07: Authentication Failures',
                'A08: Software & Data Integrity',
                'A09: Logging & Alerting Failures',
                'A10: Exceptional Conditions'
              ].map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scan process */}
        <div className="mx-auto mt-20 max-w-5xl">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Quy trình quét chuyên nghiệp
          </h3>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Discovery
              </h4>
              <p className="text-gray-600 text-sm">
                Tự động phát hiện tất cả trang web, form, và endpoint có thể truy cập
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldExclamationIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Vulnerability Scan
              </h4>
              <p className="text-gray-600 text-sm">
                Quét sâu với OWASP ZAP và Nuclei engine để phát hiện lỗ hổng
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-accent-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Analysis & Report
              </h4>
              <p className="text-gray-600 text-sm">
                Phân tích kết quả và tạo báo cáo tiếng Việt với hướng dẫn khắc phục
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}