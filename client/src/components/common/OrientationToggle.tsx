import { useState, useEffect } from 'react';

type OrientationType = 'portrait' | 'landscape';

// Extend ScreenOrientation interface for lock method
interface ExtendedScreenOrientation extends ScreenOrientation {
  lock: (orientation: string) => Promise<void>;
}

export function OrientationToggle() {
  const [currentOrientation, setCurrentOrientation] = useState<OrientationType>('portrait');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Screen Orientation API is supported
    setIsSupported('orientation' in screen && 'lock' in screen.orientation);

    // Update current orientation
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setCurrentOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  const toggleOrientation = async () => {
    if (!isSupported) {
      alert('Thiết bị không hỗ trợ chuyển đổi hướng màn hình tự động. Vui lòng xoay thiết bị thủ công.');
      return;
    }

    try {
      const newOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';

      if (newOrientation === 'landscape') {
        await (screen.orientation as ExtendedScreenOrientation).lock('landscape');
      } else {
        await (screen.orientation as ExtendedScreenOrientation).lock('portrait');
      }

      setCurrentOrientation(newOrientation);
    } catch (error) {
      // Orientation lock failed - might not be in fullscreen or not supported
      console.log('Orientation lock failed:', error);

      // Try to request fullscreen first, then lock
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          const newOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
          await (screen.orientation as ExtendedScreenOrientation).lock(newOrientation);
          setCurrentOrientation(newOrientation);
        } else {
          alert('Vui lòng xoay thiết bị thủ công để chuyển đổi hướng màn hình.');
        }
      } catch {
        alert('Vui lòng xoay thiết bị thủ công để chuyển đổi hướng màn hình.');
      }
    }
  };

  return (
    <button
      onClick={toggleOrientation}
      className="p-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
      title={currentOrientation === 'portrait' ? 'Chuyển sang ngang' : 'Chuyển sang dọc'}
    >
      {currentOrientation === 'portrait' ? (
        // Landscape icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="2" />
          <line x1="7" y1="9" x2="17" y2="9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        // Portrait icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="3" width="12" height="18" rx="2" strokeWidth="2" />
          <line x1="9" y1="6" x2="15" y2="6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
