import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { WelcomeCharacter } from './WelcomeCharacter';

describe('WelcomeCharacter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the welcome character asset with the mascot alt and greeting', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', '');
    render(<WelcomeCharacter />);

    const img = screen.getByRole('img', { name: 'Jurepi mascot' });
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(
      '/characters/home.webp'
    );
    expect(screen.getByText('Find the tool you need!')).toBeInTheDocument();
  });

  it('is NOT a link when no blog URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', '');
    render(<WelcomeCharacter />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('wraps the character in a blog link when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_URL', 'https://blog.naver.com/dhan0213');
    render(<WelcomeCharacter />);

    const link = screen.getByRole('link', { name: 'Jurepi blog' });
    expect(link).toHaveAttribute('href', 'https://blog.naver.com/dhan0213');
    expect(link).toContainElement(screen.getByRole('img', { name: 'Jurepi mascot' }));
  });
});
