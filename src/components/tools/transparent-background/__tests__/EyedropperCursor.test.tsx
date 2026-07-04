import { render } from '@testing-library/react';
import { EyedropperCursor } from '../EyedropperCursor';

describe('EyedropperCursor', () => {
  const mockCallbacks = {
    onColorSampled: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isActive is false', () => {
    const { container } = render(
      <EyedropperCursor
        isActive={false}
        imageCanvas={undefined}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // Should not have cursor overlay
    const overlay = container.querySelector('[style*="cursor"]');
    expect(overlay).toBeNull();
  });

  it('does not render when isActive is true but no mouse interaction occurs', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 200;
    mockCanvas.height = 150;
    mockCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 150,
      width: 200,
      height: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const { container } = render(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // Should not render anything until mouse moves over canvas
    expect(container.firstChild).toBeNull();
  });

  it('calls onCancel when Escape key is pressed', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 200;
    mockCanvas.height = 150;

    render(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(mockCallbacks.onCancel).toHaveBeenCalled();
  });

  it('handles mouse movement on canvas', () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 200;
    mockCanvas.height = 150;
    mockCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 150,
      width: 200,
      height: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Mock getImageData
    const mockCtx = {
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 0, 0, 255]),
      })),
    };
    mockCanvas.getContext = vi.fn(() => mockCtx as any);

    render(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // Simulate mouse move over canvas
    const event = new MouseEvent('mousemove', {
      clientX: 50,
      clientY: 50,
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Mock getImageData should be called
    expect(mockCtx.getImageData).toHaveBeenCalled();
  });

  it('registers document event listeners when active and canvas is provided', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 200;
    mockCanvas.height = 150;
    mockCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 150,
      width: 200,
      height: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    render(
      <EyedropperCursor
        isActive={true}
        imageCanvas={mockCanvas}
        onColorSampled={mockCallbacks.onColorSampled}
        onCancel={mockCallbacks.onCancel}
      />
    );

    // Should have registered event listeners
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });
});
