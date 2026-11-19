/**
 * Live Web/PWA App Updater
 * Allows checking the server for new deployments and forcing a full cache-busting reload
 * without having to manually close and reopen the app/tab.
 */

export const APP_BUILD_ID: string =
  typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__ ? __APP_BUILD_ID__ : 'dev';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  serverBuildId: string | null;
}

/**
 * Checks `/version.json` on the server bypassing HTTP/browser caches.
 */
export async function checkServerUpdateAvailable(): Promise<UpdateCheckResult> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      return { hasUpdate: false, serverBuildId: null };
    }
    const data = await res.json();
    const serverBuildId = typeof data?.buildId === 'string' ? data.buildId : null;
    if (!serverBuildId || APP_BUILD_ID === 'dev') {
      return { hasUpdate: false, serverBuildId };
    }
    return {
      hasUpdate: serverBuildId !== APP_BUILD_ID,
      serverBuildId,
    };
  } catch {
    return { hasUpdate: false, serverBuildId: null };
  }
}

/**
 * Unregisters service workers, clears Cache Storage, revalidates index.html,
 * and reloads the current URL with a cache-busting query param while keeping localStorage intact.
 */
export async function forceRefreshAppFromServer(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignore service worker errors
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore cache storage errors
  }

  try {
    await fetch(`/?_reval=${Date.now()}`, { cache: 'reload' });
  } catch {
    // ignore network revalidate errors and proceed to replace
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('_refresh', String(Date.now()));
  window.location.replace(nextUrl.toString());
}
