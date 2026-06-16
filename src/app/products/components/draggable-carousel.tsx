'use client';

import { useRef } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Horizontal scroll container that can be dragged with the mouse on desktop
 * ("swipe" with the cursor). Touch/pen keep native scrolling. A drag past a
 * small threshold suppresses the click afterwards so cards don't navigate.
 */
export default function DraggableCarousel({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return; // touch/pen use native scrolling
    const el = ref.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.style.scrollSnapType = 'none'; // smooth while dragging; snaps on release
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    const el = ref.current;
    if (!el) return;
    el.style.scrollSnapType = '';
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
  }

  // Swallow the click that fires after a drag so cards don't open.
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  return (
    <div
      ref={ref}
      className={`cursor-grab select-none active:cursor-grabbing ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
