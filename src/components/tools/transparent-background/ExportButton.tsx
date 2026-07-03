import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Copy, Check } from 'lucide-react';

interface ExportButtonProps {
  resultBlob?: Blob;
  canExport: boolean;
  onDownload: () => Promise<Blob | null>;
  onCopyClipboard: () => Promise<void>;
}

export function ExportButton({
  resultBlob,
  canExport,
  onDownload,
  onCopyClipboard,
}: ExportButtonProps) {
  const t = useTranslations('tools.transparent-background');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownload = async () => {
    try {
      const blob = await onDownload();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transparent-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleCopy = async () => {
    try {
      await onCopyClipboard();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleDownload}
        disabled={!canExport}
        className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
          canExport
            ? 'bg-brand text-on-brand hover:bg-brand-strong'
            : 'cursor-not-allowed bg-surface-muted text-text-muted'
        }`}
        title={!canExport ? t('export.downloadDisabled') : undefined}
      >
        {downloadSuccess ? (
          <>
            <Check className="h-5 w-5" />
            {t('export.downloadSuccess')}
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            {t('export.download')}
          </>
        )}
      </button>

      <button
        onClick={handleCopy}
        disabled={!canExport}
        className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
          canExport
            ? 'border border-hairline bg-surface-muted text-text hover:bg-surface-sunken'
            : 'cursor-not-allowed border border-hairline bg-surface-muted text-text-muted'
        }`}
        title={!canExport ? t('export.downloadDisabled') : undefined}
      >
        {copySuccess ? (
          <>
            <Check className="h-5 w-5" />
            {t('export.copySuccess')}
          </>
        ) : (
          <>
            <Copy className="h-5 w-5" />
            {t('export.copy')}
          </>
        )}
      </button>
    </div>
  );
}
