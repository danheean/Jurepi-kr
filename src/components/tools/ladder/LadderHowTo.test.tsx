import { render, screen } from '@/__test__/test-utils';
import { LadderHowTo } from './LadderHowTo';
import { describe, it, expect } from 'vitest';

describe('LadderHowTo Component', () => {
  it('renders main heading', () => {
    render(<LadderHowTo />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('renders "How to play" heading from translation', () => {
    render(<LadderHowTo />);
    const heading = screen.getByRole('heading', { level: 2, name: /How to play/ });
    expect(heading).toBeInTheDocument();
  });

  it('renders "What is the Ladder Game?" subheading', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    expect(subheadings[0]).toHaveTextContent('What is the Ladder Game?');
  });

  it('renders "How to play" subheading', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    expect(subheadings[1]).toHaveTextContent('How to play');
  });

  it('renders whatIsBody content', () => {
    render(<LadderHowTo />);
    expect(screen.getByText('The Ladder Game is a classic method for fairly deciding outcomes.')).toBeInTheDocument();
  });

  it('renders howToBody content', () => {
    render(<LadderHowTo />);
    expect(screen.getByText('Start by selecting the number of players.')).toBeInTheDocument();
  });

  it('renders in a section element', () => {
    const { container } = render(<LadderHowTo />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('has article elements for each section', () => {
    const { container } = render(<LadderHowTo />);
    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(2);
  });

  it('applies space-y-8 to main container', () => {
    const { container } = render(<LadderHowTo />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('space-y-8');
  });

  it('applies my-12 for vertical margins', () => {
    const { container } = render(<LadderHowTo />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('my-12');
  });

  it('applies headline font class to main heading', () => {
    render(<LadderHowTo />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('font-headline');
  });

  it('applies card-title font class to subheadings', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    subheadings.forEach((subheading) => {
      expect(subheading).toHaveClass('font-card-title');
    });
  });

  it('applies body font class to paragraphs', () => {
    render(<LadderHowTo />);
    const paragraphs = screen.getAllByText((content, element) => {
      return element?.tagName === 'P';
    });
    paragraphs.forEach((paragraph) => {
      expect(paragraph).toHaveClass('font-body');
    });
  });

  it('applies text-secondary class to paragraphs', () => {
    render(<LadderHowTo />);
    const paragraphs = screen.getAllByText((content, element) => {
      return element?.tagName === 'P';
    });
    paragraphs.forEach((paragraph) => {
      expect(paragraph).toHaveClass('text-text-secondary');
    });
  });

  it('applies leading-relaxed class to paragraphs', () => {
    render(<LadderHowTo />);
    const paragraphs = screen.getAllByText((content, element) => {
      return element?.tagName === 'P';
    });
    paragraphs.forEach((paragraph) => {
      expect(paragraph).toHaveClass('leading-relaxed');
    });
  });
});
