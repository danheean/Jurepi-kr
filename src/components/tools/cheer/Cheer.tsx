'use client';

import { useEffect, useRef, useState } from 'react';
import { CheerDisplay } from './CheerDisplay';
import { CheerInput } from './CheerInput';
import { CheerPresets } from './CheerPresets';
import { CheerControls } from './CheerControls';
import { useCheer } from './useCheer';

/**
 * Orchestrator component. Owns useCheer() hook. Mounted gate for localStorage-only parts.
 */
export function Cheer() {
  const [mounted, setMounted] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);
  const cheer = useCheer();

  // Hydration-safe mounted gate
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Main Grid: Display + Controls */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Display Panel */}
        <div className="flex flex-col gap-4 min-w-0">
          <CheerDisplay settings={cheer.settings} displayRef={displayRef} />
        </div>

        {/* Control Column */}
        <div className="flex flex-col gap-6 min-w-0">
          <CheerInput
            text={cheer.settings.text}
            onChange={(text) => cheer.updateSettings({ text })}
            onCommit={(text) => cheer.commitMessage(text)}
            recents={cheer.recents}
            onSelectRecent={cheer.loadRecent}
          />

          <CheerPresets onApply={cheer.applyPreset} />

          <CheerControls
            settings={cheer.settings}
            onSettingsChange={cheer.updateSettings}
            isFullscreenSupported={cheer.isFullscreenSupported}
            isWakeLockSupported={cheer.isWakeLockSupported}
            isWakeLocked={cheer.isWakeLocked}
            onEnterFullscreen={() =>
              displayRef.current
                ? cheer.enterFullscreen(displayRef.current)
                : Promise.resolve()
            }
            onExitFullscreen={cheer.exitFullscreen}
            onToggleWakeLock={cheer.toggleWakeLock}
          />
        </div>
      </div>
    </div>
  );
}
