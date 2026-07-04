import { describe, it, expect, vi } from 'vitest';
import { screen, userEvent, renderWithIntl } from './test-utils';
import { CuratorFilter } from './CuratorFilter';

describe('CuratorFilter', () => {
  it('renders all curator pills including "all"', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <CuratorFilter
        activeCurator="all"
        onCuratorChange={handleChange}
      />,
      { locale: 'ko' }
    );

    expect(screen.getByRole('button', { name: /전체/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /갈곶동 핵주먹/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /철산동 용주먹/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /복현동 꿀주먹/i })).toBeInTheDocument();
  });

  it('marks the active curator as pressed', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <CuratorFilter
        activeCurator="honey"
        onCuratorChange={handleChange}
      />,
      { locale: 'ko' }
    );

    const honeyButton = screen.getByRole('button', { name: /복현동 꿀주먹/i });
    expect(honeyButton).toHaveAttribute('aria-pressed', 'true');

    const nuclearButton = screen.getByRole('button', { name: /갈곶동 핵주먹/i });
    expect(nuclearButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onCuratorChange when a curator pill is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <CuratorFilter
        activeCurator="all"
        onCuratorChange={handleChange}
      />,
      { locale: 'ko' }
    );

    const honeyButton = screen.getByRole('button', { name: /복현동 꿀주먹/i });
    await user.click(honeyButton);

    expect(handleChange).toHaveBeenCalledWith('honey');
  });

  it('filters out dead curators when availableCurators is provided', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <CuratorFilter
        activeCurator="all"
        onCuratorChange={handleChange}
        availableCurators={['nuclear', 'honey']}
      />,
      { locale: 'ko' }
    );

    expect(screen.getByRole('button', { name: /전체/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /갈곶동 핵주먹/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /철산동 용주먹/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /복현동 꿀주먹/i })).toBeInTheDocument();
  });

  it('renders curator avatars for each curator (not "all")', () => {
    const handleChange = vi.fn();
    const { container } = renderWithIntl(
      <CuratorFilter
        activeCurator="all"
        onCuratorChange={handleChange}
      />,
      { locale: 'ko' }
    );

    // Check that each non-'all' curator button contains an image
    const images = container.querySelectorAll('img');
    // Should have 3 images for nuclear, dragon, honey (not for 'all')
    expect(images.length).toBe(3);
    expect(images[0]).toHaveAttribute('src', '/images/restaurant-map/curators/nuclear.png');
    expect(images[1]).toHaveAttribute('src', '/images/restaurant-map/curators/dragon.png');
    expect(images[2]).toHaveAttribute('src', '/images/restaurant-map/curators/honey.png');
  });
});
