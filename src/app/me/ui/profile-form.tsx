'use client';

import { Card } from 'flowbite-react';
import { HiLockClosed } from 'react-icons/hi2';
import Button from '../../ui/button';

const AR_COUNTRY_PREFIX = '+54';
const AR_FLAG = '🇦🇷';

interface ProfileFormProps {
  email: string | null;
  name: string;
  phone: string;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
}

export default function ProfileForm({
  email,
  name,
  phone,
  saving,
  onSubmit,
  setName,
  setPhone,
}: ProfileFormProps) {
  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-xl font-semibold">Mi Perfil</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email || ''}
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">WhatsApp *</label>
          <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <span
              className="inline-flex items-center gap-2 border-r border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
              aria-label="Argentina (fijo)"
              title="Solo Argentina por ahora"
            >
              <span className="text-lg leading-none" role="img" aria-hidden>
                {AR_FLAG}
              </span>
              <span className="font-medium tabular-nums select-none">
                {AR_COUNTRY_PREFIX}
              </span>
              <HiLockClosed
                className="h-4 w-4 shrink-0 text-gray-400"
                aria-hidden
              />
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="block w-full rounded-r-md border-0 py-2 pr-4 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-blue-600 focus:ring-inset"
              placeholder="11 1234-5678"
              inputMode="numeric"
              autoComplete="tel-national"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Necesitamos tu WhatsApp para contactarte
          </p>
        </div>
        <Button
          type="submit"
          disabled={saving}
          variant="primary"
          solid
          className="w-full"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Card>
  );
}
