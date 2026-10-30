import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicUserByUsername } from '../lib/users';
import { parseSellerHandle, sellerPath } from '../lib/profile-identity';
import SellerStorefront from '../ui/seller-storefront';

export const dynamic = 'force-dynamic';
const resolve = cache(async (handle: string) => {
  const parsed = parseSellerHandle(handle);
  if (!parsed) notFound();
  const user = await getPublicUserByUsername(parsed.username);
  if (!user?.username) notFound();
  if (parsed.handle !== `@${user.username}`) redirect(sellerPath(user));
  return user;
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const user = await resolve((await params).handle);
  const firstName = (user.name || '').split(' ')[0];
  const title = `${user.boutique_name || `Prendas de ${firstName}`} | circular.moda`;
  const description =
    user.bio || `Mirá las prendas de ${firstName} en circular.moda.`;
  const url = `https://circular.moda${sellerPath(user)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}
export default async function SellerPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  return <SellerStorefront user={await resolve((await params).handle)} />;
}
