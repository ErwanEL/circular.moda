'use client';

import { Card } from 'flowbite-react';
import Button from '../../ui/button';

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
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2"
          />
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
