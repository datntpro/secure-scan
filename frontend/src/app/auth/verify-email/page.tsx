'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Không tìm thấy địa chỉ email');
      return;
    }

    setIsResending(true);
    
    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email xác nhận đã được gửi lại!');
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        toast.error(result.error?.message || 'Không thể gửi lại email');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    router.push('/auth/register');
  };

  const openEmailClient = () => {
    // Try to open default email client
    window.location.href = 'mailto:';
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <EnvelopeIcon className="h-16 w-16 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Xác nhận email của bạn
        </h2>
      </div>

      <div className="mt-8">
        <div className="text-center space-y-6">
          <div>
            <p className="text-sm text-gray-600">
              Chúng tôi đã gửi email xác nhận đến:
            </p>
            <p className="mt-2 text-lg font-medium text-gray-900">
              {email || 'your-email@example.com'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3 text-sm text-blue-700">
                <p>
                  Vui lòng kiểm tra hộp thư và click vào link xác nhận để hoàn tất đăng ký.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={openEmailClient}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                MỞ EMAIL
              </button>
              
              <button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </>
                ) : resendCooldown > 0 ? (
                  `Gửi lại (${resendCooldown}s)`
                ) : (
                  'GỬI LẠI'
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-lg">💡</span>
              </div>
              <div className="ml-3 text-sm text-yellow-700">
                <p className="font-medium">Mẹo:</p>
                <p>Kiểm tra cả thư mục Spam/Junk nếu không thấy email trong hộp thư chính.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Chưa nhận được email?{' '}
              <button
                onClick={handleChangeEmail}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Thay đổi địa chỉ email
              </button>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}