/**
 * Copy text to clipboard. Silent fail if unavailable.
 * Returns true on success, false on failure.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    // Prefer modern Clipboard API
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback to execCommand (older browsers)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    return success;
  } catch {
    // Silent fail — don't show error to user
    return false;
  }
}
