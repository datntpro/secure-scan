import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - SecureScan.vn',
  description: 'Quản lý và theo dõi bảo mật website của bạn',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}