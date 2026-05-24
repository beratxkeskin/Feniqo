import { useState, useEffect } from 'react';

type PWAListener = () => void;

class PWAStore {
  private listeners = new Set<PWAListener>();
  private deferredPrompt: any = null;
  private isInstalled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Standalone modda çalışıp çalışmadığını kontrol et
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        this.isInstalled = true;
      }
    }
  }

  subscribe(listener: PWAListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  setDeferredPrompt(prompt: any) {
    this.deferredPrompt = prompt;
    this.notify();
  }

  getDeferredPrompt() {
    return this.deferredPrompt;
  }

  setInstalled(status: boolean) {
    this.isInstalled = status;
    if (status) {
      this.deferredPrompt = null;
    }
    this.notify();
  }

  getIsInstalled() {
    return this.isInstalled;
  }

  getIsInstallable() {
    return !!this.deferredPrompt && !this.isInstalled;
  }
}

export const pwaStore = new PWAStore();

// React bileşenlerinde durumu izlemek ve kurulum tetiklemek için özel Hook
export function usePWA() {
  const [state, setState] = useState({
    isInstallable: pwaStore.getIsInstallable(),
    isInstalled: pwaStore.getIsInstalled(),
  });

  useEffect(() => {
    const handleStoreChange = () => {
      setState({
        isInstallable: pwaStore.getIsInstallable(),
        isInstalled: pwaStore.getIsInstalled(),
      });
    };

    // İlk durum güncellemesini yap
    handleStoreChange();

    return pwaStore.subscribe(handleStoreChange);
  }, []);

  const install = async () => {
    const prompt = pwaStore.getDeferredPrompt();
    if (!prompt) return false;

    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      pwaStore.setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (err) {
      console.error('PWA kurulum tetikleme hatası:', err);
      return false;
    }
  };

  return {
    ...state,
    install,
  };
}
