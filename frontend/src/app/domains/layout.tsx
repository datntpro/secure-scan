import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý Domains - SecureScan.vn',
  description: 'Quản lý tất cả websites bạn muốn quét bảo mật',
};

export default function DomainsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}