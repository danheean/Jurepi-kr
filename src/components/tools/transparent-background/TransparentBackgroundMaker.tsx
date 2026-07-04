'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTransparencyRemover } from './useTransparencyRemover';
import { ImageUpload } from './ImageUpload';
import { BackgroundColorPicker } from './BackgroundColorPicker';
import { EyedropperCursor } from './EyedropperCursor';
import { RemovalControls } from './RemovalControls';
import { PreviewCanvas } from './PreviewCanvas';
import { ExportButton } from './ExportButton';

export function TransparentBackgroundMaker() {
  const t = useTranslations('tools.transparent-background');
  const state = useTransparencyRemover();
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Download notification */}
      {state.isDownscaled && state.phase !== 'idle' && (
        <div className="rounded-lg border border-accent-sky-soft bg-accent-sky-soft p-3 text-sm text-text">
          {t('preview.downscaled')}
        </div>
      )}

      {/* Error notification */}
      {state.error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger-ink" role="alert">
          {t(`errors.${state.error}`)}
        </div>
      )}

      {/* Image Upload */}
      <ImageUpload
        onFileSelect={state.uploadImage}
        isLoading={state.phase === 'uploading' || state.phase === 'detecting'}
        fileName={state.sourceFile?.name}
        fileSize={state.sourceFile ? formatFileSize(state.sourceFile.size) : undefined}
      />

      {/* Background Color Picker */}
      {state.phase !== 'idle' && (
        <>
          <BackgroundColorPicker
            bgColor={state.bgColor}
            onColorChange={(color) =>
              state.updateOptions({
                bgColor: color,
              })
            }
            onAutoDetect={state.detectBackground}
            onEyedropperMode={() => setEyedropperActive(true)}
            isLoading={state.phase === 'detecting'}
          />

          {/* Eyedropper Cursor */}
          <EyedropperCursor
            isActive={eyedropperActive}
            imageCanvas={state.sourceImage || undefined}
            onColorSampled={(color) => {
              state.updateOptions({
                bgColor: color,
              });
              setEyedropperActive(false);
            }}
            onCancel={() => setEyedropperActive(false)}
          />

          {/* Removal Controls */}
          <RemovalControls
            tolerance={state.tolerance}
            onToleranceChange={(value) =>
              state.updateOptions({ tolerance: value })
            }
            feather={state.feather}
            onFeatherChange={(value) =>
              state.updateOptions({ feather: value })
            }
            mode={state.mode}
            onModeChange={(mode) =>
              state.updateOptions({ mode })
            }
          />

          {/* Preview Canvas */}
          <PreviewCanvas
            resultCanvas={state.resultCanvas || undefined}
            isProcessing={state.phase === 'detecting' || state.phase === 'removing'}
            sourceWidth={state.sourceWidth}
            sourceHeight={state.sourceHeight}
          />

          {/* Export Button */}
          <ExportButton
            resultBlob={state.resultBlob || undefined}
            canExport={state.phase === 'done'}
            onDownload={state.exportPNG}
            onCopyClipboard={state.copyToClipboard}
          />

          {/* Reset Button */}
          {state.phase === 'done' && (
            <button
              onClick={state.reset}
              className="w-full rounded-lg border border-hairline-strong bg-surface-muted px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-hairline"
            >
              {t('controls.clearAll')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
