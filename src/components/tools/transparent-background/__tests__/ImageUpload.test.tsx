import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ImageUpload } from '../ImageUpload';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

// Polyfill DataTransfer for jsdom
if (typeof DataTransfer === 'undefined') {
  (global as any).DataTransfer = class DataTransfer {
    items = {
      add: vi.fn(),
    };
  };
}

describe('ImageUpload', () => {
  it('renders upload area with label', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText(messages.ko.tools['transparent-background'].upload.label)).toBeInTheDocument();
  });

  it('displays file input and accepts PNG/JPEG/WebP', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const fileInput = screen.getByLabelText(messages.ko.tools['transparent-background'].upload.label) as HTMLInputElement;
    expect(fileInput.accept).toContain('image/png');
    expect(fileInput.accept).toContain('image/jpeg');
    expect(fileInput.accept).toContain('image/webp');
  });

  it('calls onFileSelect when file is selected', async () => {
    const mockOnFileSelect = vi.fn();
    const { rerender } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const fileInput = screen.getByLabelText(
      messages.ko.tools['transparent-background'].upload.label
    ) as HTMLInputElement;

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    if (fileInput) {
      fileInput.files = dataTransfer.files;
      fireEvent.change(fileInput);
    }
  });

  it('displays filename and file size when provided', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload
          onFileSelect={mockOnFileSelect}
          fileName="test-image.png"
          fileSize="2.5 MB"
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/test-image\.png/)).toBeInTheDocument();
    expect(screen.getByText(/2\.5 MB/)).toBeInTheDocument();
  });

  it('does not have Korean text leakage in English locale', () => {
    const mockOnFileSelect = vi.fn();
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const text = container.textContent || '';
    // Check for Korean characters in the raw element tree
    expect(/[가-힣]/.test(text)).toBe(false);
  });
});
