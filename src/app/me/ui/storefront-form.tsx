'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  CABA_NEIGHBORHOODS,
  STOREFRONT_CITY,
  type StorefrontSettings,
} from '@/app/lib/storefront';
import Button from '@/app/ui/button';

interface Props {
  initial: Partial<StorefrontSettings>;
  products: { id: number; name: string; images: string[] }[];
}

export default function StorefrontForm({ initial, products }: Props) {
  const [name, setName] = useState(initial.boutique_name || '');
  const [bio, setBio] = useState(initial.bio || '');
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood || '');
  const [avatar, setAvatar] = useState(initial.avatar_url || null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [pins, setPins] = useState<number[]>(initial.pinned_product_ids || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const visiblePins = pins.filter((id) => products.some((p) => p.id === id));
  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const form = new FormData();
    form.set('boutique_name', name);
    form.set('bio', bio);
    form.set('neighborhood', neighborhood);
    form.set('pinned_product_ids', JSON.stringify(visiblePins));
    form.set('remove_avatar', String(remove));
    if (photo) form.set('photo', photo);
    try {
      const response = await fetch('/api/me/storefront', {
        method: 'PUT',
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'No pudimos guardar la vitrina.');
      setAvatar(data.storefront.avatar_url);
      setPhoto(null);
      setRemove(false);
      setName(data.storefront.boutique_name);
      setBio(data.storefront.bio);
      setNeighborhood(data.storefront.neighborhood);
      setPins(data.storefront.pinned_product_ids);
      if (fileInput.current) fileInput.current.value = '';
      setMessage('Tu vitrina está actualizada. Ya podés visitarla.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }
  const image = preview || (!remove ? avatar : null);
  return (
    <section
      className="boutique-editor"
      aria-labelledby="boutique-editor-title"
    >
      <p className="boutique-eyebrow">Tu espacio, tu estilo</p>
      <h2 id="boutique-editor-title">Mi boutique</h2>
      <p>Presentá tu dressing y elegí las piezas que querés mostrar primero.</p>
      <form onSubmit={save}>
        <fieldset disabled={saving} className="boutique-fields">
          <legend className="sr-only">Personalizar mi boutique</legend>
          <div className="boutique-photo-edit">
            <div className="boutique-avatar">
              {image ? (
                <Image
                  src={image}
                  alt="Vista previa de tu foto"
                  width={96}
                  height={96}
                  unoptimized
                />
              ) : (
                <span aria-hidden="true">
                  {(name || 'Tu').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="boutique-photo">Foto de tu boutique</label>
              <input
                ref={fileInput}
                id="boutique-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="boutique-photo-help"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 3 * 1024 * 1024) {
                    setMessage('La foto debe pesar hasta 3 MB.');
                    e.target.value = '';
                    return;
                  }
                  setPhoto(file);
                  setRemove(false);
                  setMessage('');
                }}
              />
              <p id="boutique-photo-help">
                JPG, PNG o WebP · hasta 3 MB. Se recorta al centro.
              </p>
              {image && (
                <button
                  className="boutique-text-button"
                  type="button"
                  onClick={() => {
                    setRemove(true);
                    setPhoto(null);
                    if (fileInput.current) fileInput.current.value = '';
                  }}
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>
          <label htmlFor="boutique-name">
            Nombre de tu dressing <span>(opcional)</span>
          </label>
          <input
            id="boutique-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Por ejemplo: El dressing de Ana"
          />
          <label htmlFor="boutique-bio">
            Tu presentación <span>(opcional)</span>
          </label>
          <textarea
            id="boutique-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Contá tu estilo y qué prendas se pueden encontrar acá."
            aria-describedby="boutique-bio-count"
          />
          <p id="boutique-bio-count">{bio.length}/300 caracteres</p>
          <label htmlFor="boutique-city">Ciudad</label>
          <input
            id="boutique-city"
            value={STOREFRONT_CITY}
            readOnly
            aria-describedby="boutique-city-help"
          />
          <p id="boutique-city-help">
            Por ahora, Circular está disponible solo en CABA.
          </p>
          <label htmlFor="boutique-neighborhood">
            Barrio <span>(opcional)</span>
          </label>
          <select
            id="boutique-neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          >
            <option value="">Elegí tu barrio</option>
            {CABA_NEIGHBORHOODS.map((barrio) => (
              <option key={barrio} value={barrio}>
                {barrio}
              </option>
            ))}
          </select>
          <fieldset className="boutique-picks">
            <legend>Tu selección · {visiblePins.length}/3 prendas</legend>
            <p>
              Se muestran en el orden en que las elegís. Para cambiarlo, quitá y
              volvé a seleccionar.
            </p>
            {products.length === 0 ? (
              <p>Publicá tu primera prenda para destacarla acá.</p>
            ) : (
              <div className="boutique-picker">
                {products.map((product) => {
                  const position = visiblePins.indexOf(product.id);
                  return (
                    <label key={product.id} className="boutique-pick">
                      <input
                        type="checkbox"
                        checked={position >= 0}
                        disabled={position < 0 && visiblePins.length >= 3}
                        onChange={(e) =>
                          setPins(
                            e.target.checked
                              ? [...visiblePins, product.id]
                              : visiblePins.filter((id) => id !== product.id)
                          )
                        }
                      />
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={44}
                          height={55}
                        />
                      )}
                      <span>{product.name}</span>
                      {position >= 0 && (
                        <strong aria-label={`Posición ${position + 1}`}>
                          {position + 1}
                        </strong>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
          <Button
            type="submit"
            variant="primary"
            solid
            disabled={saving}
            text={saving ? 'Guardando…' : 'Guardar mi boutique'}
          />
        </fieldset>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
