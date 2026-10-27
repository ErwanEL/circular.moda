'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import { getInstallPlatform, type InstallPlatform } from '../lib/pwa-install';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type PwaAnalyticsEvent = {
  event: string;
  pwa_platform?: InstallPlatform;
  pwa_prompt_available?: boolean;
  pwa_prompt_outcome?: 'accepted' | 'dismissed';
};

type WindowWithDataLayer = Window & {
  dataLayer?: PwaAnalyticsEvent[];
};

type PwaInstallContextValue = {
  installed: boolean;
  promptAvailable: boolean;
  ready: boolean;
  install: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);
const STANDALONE_TRACKED_KEY = 'circular-pwa-standalone-tracked';

function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function trackPwaEvent(payload: PwaAnalyticsEvent): void {
  const analyticsWindow = window as WindowWithDataLayer;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.dataLayer.push(payload);
}

function trackFirstStandaloneOpen(platform: InstallPlatform): void {
  try {
    if (localStorage.getItem(STANDALONE_TRACKED_KEY) === '1') return;
    localStorage.setItem(STANDALONE_TRACKED_KEY, '1');
    trackPwaEvent({
      event: 'pwa_standalone_first_open',
      pwa_platform: platform,
    });
  } catch {
    trackPwaEvent({ event: 'pwa_standalone_open', pwa_platform: platform });
  }
}

function InstallIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
    </svg>
  );
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('other');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const alreadyInstalled = isStandalone();
    const detectedPlatform = getInstallPlatform(
      navigator.userAgent,
      navigator.platform,
      navigator.maxTouchPoints
    );

    const initializationFrame = window.requestAnimationFrame(() => {
      setInstalled(alreadyInstalled);
      setPlatform(detectedPlatform);
      setReady(true);

      if (alreadyInstalled) trackFirstStandaloneOpen(detectedPlatform);
    });

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      trackPwaEvent({ event: 'pwa_installed', pwa_platform: detectedPlatform });
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.cancelAnimationFrame(initializationFrame);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (installed) return;

    trackPwaEvent({
      event: 'pwa_install_cta_click',
      pwa_platform: platform,
      pwa_prompt_available: deferredPrompt !== null,
    });

    if (!deferredPrompt) {
      trackPwaEvent({
        event: 'pwa_install_tutorial_open',
        pwa_platform: platform,
      });
      if (window.location.pathname !== '/instalar') {
        window.location.assign('/instalar');
      }
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    trackPwaEvent({
      event: 'pwa_install_prompt_result',
      pwa_platform: platform,
      pwa_prompt_outcome: choice.outcome,
    });
    setDeferredPrompt(null);

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
  }, [deferredPrompt, installed, platform]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      installed,
      promptAvailable: deferredPrompt !== null,
      ready,
      install,
    }),
    [deferredPrompt, install, installed, ready]
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall(): PwaInstallContextValue {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall must be used inside PwaInstallProvider.');
  }
  return context;
}

export function InstallAppButton({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { install, installed, ready } = usePwaInstall();

  if (!ready || installed) return null;

  return (
    <button type="button" onClick={() => void install()} className={className}>
      <InstallIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      <span>Instalar la app</span>
    </button>
  );
}

export function PwaInstallBanner({
  hiddenOnMobile = false,
}: {
  hiddenOnMobile?: boolean;
}) {
  const { install, installed, ready } = usePwaInstall();

  if (!ready || installed) return null;

  return (
    <aside
      aria-label="Instalar Circular Moda"
      className={`border-primary-300 bg-primary-100 border-t px-4 py-2.5 sm:px-6 ${
        hiddenOnMobile ? 'hidden md:block' : ''
      }`}
    >
      <div className="mx-auto flex max-w-screen-xl items-center gap-3">
        <Image
          src="/pwa/icon-192.png"
          alt=""
          className="hidden h-10 w-10 rounded-xl sm:block"
          width="40"
          height="40"
        />
        <div className="min-w-0 flex-1">
          <p className="text-primary-900 text-sm font-bold sm:text-base">
            Circular Moda ya está disponible como app
          </p>
        </div>
        <button
          type="button"
          onClick={() => void install()}
          className="bg-primary-800 inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#557d3f] focus:ring-4 focus:ring-green-200 focus:outline-none"
        >
          <InstallIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Instalar la app</span>
          <span className="sm:hidden">Instalar</span>
        </button>
      </div>
    </aside>
  );
}
