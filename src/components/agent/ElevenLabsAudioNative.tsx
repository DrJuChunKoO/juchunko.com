import { useEffect, useState } from 'react';

export type ElevenLabsProps = {
  publicUserId: string;
  textColorRgba?: string;
  backgroundColorRgba?: string;
  size?: 'small' | 'large';
  children?: React.ReactNode;
};

export const ElevenLabsAudioNative = ({
  publicUserId,
  size,
  textColorRgba,
  backgroundColorRgba,
  children,
}: ElevenLabsProps) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initial check
    setIsDark(document.documentElement.classList.contains('dark'));

    // Observe class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');

    script.src = 'https://elevenlabs.io/player/audioNativeHelper.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [isDark]); // Re-run when theme changes to re-initialize player with new colors

  const defaultTextColor = isDark ? 'rgba(255, 255, 255, 1.0)' : 'rgba(0, 0, 0, 1.0)';
  const defaultBackgroundColor = isDark ? 'rgba(17, 17, 17, 1)' : 'rgba(255, 255, 255, 1.0)';

  return (
    <div
      key={isDark ? 'dark' : 'light'}
      id="elevenlabs-audionative-widget"
      data-height={size === 'small' ? '90' : '120'}
      data-width="100%"
      data-frameborder="no"
      data-scrolling="no"
      data-publicuserid={publicUserId}
      data-playerurl="https://elevenlabs.io/player/index.html"
      data-small={size === 'small' ? 'True' : 'False'}
      data-textcolor={textColorRgba ?? defaultTextColor}
      data-backgroundcolor={backgroundColorRgba ?? defaultBackgroundColor}
    >
      {children ? children : 'Elevenlabs AudioNative Player'}
    </div>
  );
};

export default ElevenLabsAudioNative;
