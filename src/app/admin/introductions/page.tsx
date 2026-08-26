import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getRequestHost, isLocalAdminRequest } from '@/app/lib/local-admin-access';
import AdminIntroductionsClient from './introductions-admin-client';

export default async function AdminIntroductionsPage() {
  const requestHeaders = await headers();

  if (!isLocalAdminRequest(getRequestHost(requestHeaders))) {
    notFound();
  }

  return <AdminIntroductionsClient />;
}
