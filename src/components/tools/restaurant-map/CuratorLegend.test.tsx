import { describe, it, expect } from 'vitest';
import { screen, renderWithIntl } from './test-utils';
import { CuratorLegend } from './CuratorLegend';

describe('CuratorLegend', () => {
  it('renders the legend heading', () => {
    renderWithIntl(<CuratorLegend />, { locale: 'ko' });
    expect(screen.getByText(/이 맛집 리스트를 만든 사람들/i)).toBeInTheDocument();
  });

  it('renders all 3 curator avatars with names', () => {
    renderWithIntl(<CuratorLegend />, { locale: 'ko' });

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(3);
    expect(images[0]).toHaveAttribute('src', '/images/restaurant-map/curators/nuclear.png');
    expect(images[1]).toHaveAttribute('src', '/images/restaurant-map/curators/dragon.png');
    expect(images[2]).toHaveAttribute('src', '/images/restaurant-map/curators/honey.png');

    expect(screen.getByText(/갈곶동 핵주먹/i)).toBeInTheDocument();
    expect(screen.getByText(/철산동 용주먹/i)).toBeInTheDocument();
    expect(screen.getByText(/복현동 꿀주먹/i)).toBeInTheDocument();
  });

  it('renders avatars with correct dimensions and styling', () => {
    renderWithIntl(<CuratorLegend />, { locale: 'ko' });

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      expect(img).toHaveAttribute('width', '40');
      expect(img).toHaveAttribute('height', '40');
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveClass('rounded-full', 'object-cover');
    });
  });
});
