'use client';

import { useEffect, useId, useState } from 'react';
import {
  normalizeInstagram,
  normalizeUsername,
  suggestUsername,
  usernameError,
} from '../../lib/profile-identity';

type Props = {
  username: string;
  instagram: string;
  setUsername: (value: string) => void;
  setInstagram: (value: string) => void;
};
export default function ProfileIdentityFields({
  username,
  instagram,
  setUsername,
  setInstagram,
}: Props) {
  const id = useId();
  const candidate = normalizeUsername(username);
  const invalid = candidate ? usernameError(candidate) : null;
  const [result, setResult] = useState<{
    username: string;
    available?: boolean;
    error?: string;
  } | null>(null);
  const suggestion = suggestUsername(instagram);
  const instagramInvalid = normalizeInstagram(instagram) === null;
  useEffect(() => {
    if (!candidate || invalid) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/me/username?username=${encodeURIComponent(candidate)}`,
          { signal: controller.signal, cache: 'no-store' }
        );
        const data = await response.json();
        if (!controller.signal.aborted)
          setResult({
            username: candidate,
            available: data.available,
            error:
              data.error ||
              (!response.ok
                ? 'No pudimos comprobar la disponibilidad.'
                : undefined),
          });
      } catch {
        if (!controller.signal.aborted)
          setResult({
            username: candidate,
            error:
              'No pudimos comprobar la disponibilidad. Podés volver a intentarlo al guardar.',
          });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [candidate, invalid]);
  const current = result?.username === candidate ? result : null;
  const status =
    invalid ||
    (candidate
      ? current?.error ||
        (current?.available === true
          ? 'Disponible para vos.'
          : current?.available === false
            ? 'Este nombre ya está reservado. Elegí otro.'
            : 'Comprobando disponibilidad…')
      : 'Si lo dejás vacío, conservamos tu dirección o creamos una automáticamente.');
  return (
    <>
      <div>
        <label
          htmlFor={`${id}-username`}
          className="mb-2 block text-sm font-medium"
        >
          Nombre de usuario
        </label>
        <input
          id={`${id}-username`}
          type="text"
          value={username}
          onChange={(e) => setUsername(normalizeUsername(e.target.value))}
          maxLength={30}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]"
          className="w-full rounded-md border border-gray-300 px-4 py-2"
          placeholder="maria-vintage"
          aria-describedby={`${id}-address ${id}-availability`}
          aria-invalid={Boolean(invalid || current?.available === false)}
        />
        <p id={`${id}-address`} className="mt-1 text-xs text-gray-500">
          {candidate
            ? `circular.moda/@${candidate}`
            : 'Tu dirección pública en Circular.moda'}
        </p>
        <p
          id={`${id}-availability`}
          role="status"
          aria-live="polite"
          className="mt-1 text-xs text-gray-600"
        >
          {status}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Los enlaces anteriores seguirán funcionando si cambiás tu nombre.
        </p>
      </div>
      <div>
        <label
          htmlFor={`${id}-instagram`}
          className="mb-2 block text-sm font-medium"
        >
          Instagram (opcional)
        </label>
        <input
          id={`${id}-instagram`}
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          maxLength={200}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-md border border-gray-300 px-4 py-2"
          placeholder="@maria.vintage"
          aria-describedby={`${id}-instagram-help`}
          aria-invalid={instagramInvalid}
        />
        <p id={`${id}-instagram-help`} className="mt-1 text-xs text-gray-500">
          {instagramInvalid
            ? 'Ingresá un usuario o enlace de perfil de Instagram válido.'
            : 'Se mostrará un enlace público en tu vitrina. No conecta ni verifica tu cuenta.'}
        </p>
        {suggestion && suggestion !== candidate && (
          <button
            type="button"
            className="mt-2 text-sm text-primary-800 underline"
            onClick={() => setUsername(suggestion)}
          >
            Probar @{suggestion} como nombre de usuario
          </button>
        )}
      </div>
    </>
  );
}
