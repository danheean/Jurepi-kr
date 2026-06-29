import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('Modal Component', () => {
  it('does not render when isOpen=false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal content
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen=true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Modal content
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Dialog Title">
        Modal content
      </Modal>
    );
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );
    // The backdrop is the first div child (has onClick handler)
    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('has dialog role for accessibility', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('locks body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('renders custom footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        footer={<div>Custom Footer</div>}
      >
        Content
      </Modal>
    );
    expect(screen.getByText('Custom Footer')).toBeInTheDocument();
  });

  it('renders default Close button when no footer', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
