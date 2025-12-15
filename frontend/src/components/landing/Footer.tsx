'use client';

import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

export function Footer() {
  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold text-white">SecureScan.vn</span>
            </Link>
            <p className="text-sm leading-6 text-gray-300">
              Bảo mật website cho SME Việt Nam. Báo cáo tiếng Việt, giá rẻ, dễ sử dụng.
            </p>
            <div className="flex space-x-6">
              <p className="text-sm text-gray-300">
                📧 support@securescan.vn<br />
                📞 1900-xxx-xxx<br />
                💬 Zalo: @securescan
              </p>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Sản phẩm</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="#features" className="text-sm leading-6 text-gray-300 hover:text-white">Tính năng</Link></li>
                  <li><Link href="#pricing" className="text-sm leading-6 text-gray-300 hover:text-white">Bảng giá</Link></li>
                  <li><Link href="/api-docs" className="text-sm leading-6 text-gray-300 hover:text-white">API</Link></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Hỗ trợ</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/help" className="text-sm leading-6 text-gray-300 hover:text-white">Trung tâm trợ giúp</Link></li>
                  <li><Link href="/contact" className="text-sm leading-6 text-gray-300 hover:text-white">Liên hệ</Link></li>
                  <li><Link href="/status" className="text-sm leading-6 text-gray-300 hover:text-white">Trạng thái hệ thống</Link></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Công ty</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/about" className="text-sm leading-6 text-gray-300 hover:text-white">Về chúng tôi</Link></li>
                  <li><Link href="/blog" className="text-sm leading-6 text-gray-300 hover:text-white">Blog</Link></li>
                  <li><Link href="/careers" className="text-sm leading-6 text-gray-300 hover:text-white">Tuyển dụng</Link></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Pháp lý</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/privacy" className="text-sm leading-6 text-gray-300 hover:text-white">Chính sách bảo mật</Link></li>
                  <li><Link href="/terms" className="text-sm leading-6 text-gray-300 hover:text-white">Điều khoản sử dụng</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-400">
            &copy; 2025 SecureScan.vn. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}