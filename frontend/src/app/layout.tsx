import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecureScan.vn - Quét bảo mật website tự động',
  description: 'Dịch vụ quét bảo mật website chuyên nghiệp cho doanh nghiệp Việt Nam. Phát hiện lỗ hổng bảo mật, báo cáo tiếng Việt dễ hiểu.',
  keywords: 'quét bảo mật, vulnerability scanner, website security, bảo mật website, OWASP, penetration testing',
  authors: [{ name: 'SecureScan.vn Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'SecureScan.vn - Quét bảo mật website tự động',
    description: 'Dịch vụ quét bảo mật website chuyên nghiệp cho doanh nghiệp Việt Nam',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}