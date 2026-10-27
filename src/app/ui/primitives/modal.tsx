'use client';

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { CloseIcon } from './feedback';

const ModalContext = createContext<{
  titleId: string;
  onClose: () => void;
} | null>(null);

/** Native dialog provides inert background, focus containment and focus restoration. */
export function Modal({
  show,
  onClose,
  size = '2xl',
  dismissible = false,
  children,
}: {
  show: boolean;
  onClose: () => void;
  size?: 'md' | '2xl' | '3xl';
  dismissible?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pointerStartedOutside = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!show || !dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    dialog.showModal();
    if (scrollbarWidth > 0) {
      const padding =
        Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${padding + scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [show]);

  if (!show) return null;
  return (
    <ModalContext.Provider value={{ titleId, onClose }}>
      <dialog
        ref={ref}
        className={clsx('ui-modal', `ui-modal--${size}`)}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          if (dismissible) onClose();
        }}
        onPointerDown={(event) => {
          pointerStartedOutside.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (
            dismissible &&
            pointerStartedOutside.current &&
            event.target === event.currentTarget
          )
            onClose();
        }}
      >
        <div className="ui-modal__content">{children}</div>
      </dialog>
    </ModalContext.Provider>
  );
}

export function ModalHeader({ children }: { children: ReactNode }) {
  const context = useContext(ModalContext);
  if (!context) throw new Error('ModalHeader must be inside Modal');
  return (
    <div className="ui-modal__header">
      <h3 id={context.titleId} className="ui-modal__title">
        {children}
      </h3>
      <button
        type="button"
        className="ui-modal__close"
        aria-label="Cerrar ventana"
        onClick={context.onClose}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export function ModalBody({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={clsx('ui-modal__body', className)} />;
}

export function ModalFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={clsx('ui-modal__footer', className)} />;
}
