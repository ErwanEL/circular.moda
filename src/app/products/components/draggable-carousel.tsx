'use client';

import { useRef } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Horizontal scroll container that can be dragged with the mouse on desktop
 * ("swipe" with the cursor). Touch/pen keep native scrolling.
 *
 * Uses window listeners during the drag rather than setPointerCapture — capture
 * retargets the trailing `click` to this container, which would stop card links
 * from opening. A drag past a small threshold suppresses the click afterwards
 * so cards don't navigate when you finish a swipe over one.
 */
export default function DraggableCarousel({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch scrolls natively
    const el = ref.current;
    if (!el) return;

    const startX = e.clientX;
    const startScroll = el.scrollLeft;
    moved.current = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      if (!moved.current && Math.abs(dx) > 6) {
        moved.current = true;
        el.style.scrollSnapType = 'none'; // smooth while dragging
      }
      if (moved.current) {
        el.scrollLeft = startScroll - dx;
        ev.preventDefault();
      }
    };

    const onUp = () => {
      el.style.scrollSnapType = ''; // snaps to nearest card on release
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // Swallow the click that fires right after a drag so cards don't open.
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <div
      ref={ref}
      className={`cursor-grab select-none active:cursor-grabbing ${className}`}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
