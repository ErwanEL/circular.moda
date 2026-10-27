import { notFound, permanentRedirect } from 'next/navigation';
import { getPublicUserById, parseUserIdParam } from '../../lib/users';
import { sellerPath } from '../../lib/profile-identity';

// Resolve the latest username on every request; no stale permanent redirect targets.
export const dynamic = 'force-dynamic';
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseUserIdParam((await params).id);
  if (id === null) notFound();
  const user = await getPublicUserById(id);
  if (!user?.username) notFound();
  permanentRedirect(sellerPath(user));
}
