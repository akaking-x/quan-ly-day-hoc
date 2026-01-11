// Service to download all app assets for offline use

export type DownloadStep = {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
};

export type DownloadProgress = {
  steps: DownloadStep[];
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  error?: string;
};

const OFFLINE_READY_KEY = 'offline-app-ready';
const OFFLINE_DOWNLOAD_TIME_KEY = 'offline-download-time';

// All pages that need to be pre-loaded for offline
const PAGES_TO_CACHE = [
  '/',
  '/login',
  '/students',
  '/groups',
  '/attendance',
  '/payments',
  '/notes',
  '/guide',
  '/settings',
  '/users',
  '/student',
];

// Pre-load a page by navigating to it in a hidden iframe
async function preloadPage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout loading ${url}`));
    }, 30000);

    // Use fetch to load the page and trigger JS chunk loading
    fetch(url, { credentials: 'same-origin' })
      .then(response => {
        if (response.ok) {
          clearTimeout(timeout);
          resolve();
        } else {
          clearTimeout(timeout);
          reject(new Error(`Failed to load ${url}`));
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

// Import all page modules to trigger chunk downloads
async function preloadAllModules(): Promise<void> {
  const modules = [
    () => import('../pages/Login'),
    () => import('../pages/Dashboard'),
    () => import('../pages/Students'),
    () => import('../pages/StudentDetail'),
    () => import('../pages/Groups'),
    () => import('../pages/GroupDetail'),
    () => import('../pages/Attendance'),
    () => import('../pages/Payments'),
    () => import('../pages/Notes'),
    () => import('../pages/Guide'),
    () => import('../pages/Settings'),
    () => import('../pages/Users'),
    () => import('../pages/StudentPortal'),
  ];

  await Promise.all(modules.map(m => m().catch(() => {})));
}

// Cache all static assets via service worker
async function cacheStaticAssets(): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Get all script and style URLs from the page
    const scripts = Array.from(document.querySelectorAll('script[src]'))
      .map(s => (s as HTMLScriptElement).src);
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => (l as HTMLLinkElement).href);

    // Send to service worker for caching
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls: [...scripts, ...styles],
    });

    // Wait a bit for caching to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Cache pages via service worker
async function cachePages(): Promise<void> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_ALL_PAGES',
    });

    // Wait for caching
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Main download function with progress callback
export async function downloadForOffline(
  onProgress: (progress: DownloadProgress) => void
): Promise<boolean> {
  const steps: DownloadStep[] = [
    { id: 'modules', label: 'Tải các trang ứng dụng', status: 'pending' },
    { id: 'pages', label: 'Lưu cache trang', status: 'pending' },
    { id: 'assets', label: 'Lưu cache tài nguyên', status: 'pending' },
    { id: 'data', label: 'Tải dữ liệu offline', status: 'pending' },
  ];

  const updateProgress = (stepIndex: number, status: DownloadStep['status'], error?: string) => {
    steps[stepIndex].status = status;
    onProgress({
      steps: [...steps],
      currentStep: stepIndex + 1,
      totalSteps: steps.length,
      isComplete: stepIndex === steps.length - 1 && status === 'done',
      error,
    });
  };

  try {
    // Step 1: Preload all page modules
    updateProgress(0, 'loading');
    await preloadAllModules();
    updateProgress(0, 'done');

    // Step 2: Cache pages via service worker
    updateProgress(1, 'loading');
    await cachePages();
    updateProgress(1, 'done');

    // Step 3: Cache static assets
    updateProgress(2, 'loading');
    await cacheStaticAssets();
    updateProgress(2, 'done');

    // Step 4: Download data (using existing sync service)
    updateProgress(3, 'loading');
    const { downloadAllDataWithProgress } = await import('./syncService');
    const result = await downloadAllDataWithProgress();
    if (!result.success) {
      throw new Error(result.message);
    }
    updateProgress(3, 'done');

    // Mark as offline ready
    localStorage.setItem(OFFLINE_READY_KEY, 'true');
    localStorage.setItem(OFFLINE_DOWNLOAD_TIME_KEY, Date.now().toString());

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
    const currentStep = steps.findIndex(s => s.status === 'loading');
    if (currentStep >= 0) {
      updateProgress(currentStep, 'error', errorMessage);
    }
    return false;
  }
}

// Check if app is ready for offline use
export function isOfflineReady(): boolean {
  return localStorage.getItem(OFFLINE_READY_KEY) === 'true';
}

// Get last offline download time
export function getOfflineDownloadTime(): number | null {
  const time = localStorage.getItem(OFFLINE_DOWNLOAD_TIME_KEY);
  return time ? parseInt(time, 10) : null;
}

// Clear offline ready status
export function clearOfflineStatus(): void {
  localStorage.removeItem(OFFLINE_READY_KEY);
  localStorage.removeItem(OFFLINE_DOWNLOAD_TIME_KEY);
}
