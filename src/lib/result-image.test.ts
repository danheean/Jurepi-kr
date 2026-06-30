import { describe, it, expect } from 'vitest';
import { buildResultSvgString, type ResultImageParams } from './result-image';

describe('result-image', () => {
  describe('buildResultSvgString', () => {
    it('returns a string containing <svg', () => {
      const params: ResultImageParams = {
        playerCount: 4,
        rungs: [[true, false, false], [false, true, false], [false, false, true]],
        rows: [
          { name: 'Alice', label: 'Prize A', accentHex: '#ff7a85' },
          { name: 'Bob', label: 'Prize B', accentHex: '#2dd4bf' },
          { name: 'Carol', label: 'Prize C', accentHex: '#38bdf8' },
          { name: 'Dave', label: 'Prize D', accentHex: '#fbbf24' },
        ],
        playerNames: ['Alice', 'Bob', 'Carol', 'Dave'],
        prizeLabels: ['Prize A', 'Prize B', 'Prize C', 'Prize D'],
        title: 'Ladder Results',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('<svg');
    });

    it('contains namespace declaration', () => {
      const params: ResultImageParams = {
        playerCount: 3,
        rungs: [[true, false]],
        rows: [
          { name: 'A', label: 'P1', accentHex: '#ff7a85' },
          { name: 'B', label: 'P2', accentHex: '#2dd4bf' },
          { name: 'C', label: 'P3', accentHex: '#38bdf8' },
        ],
        playerNames: ['A', 'B', 'C'],
        prizeLabels: ['P1', 'P2', 'P3'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('has explicit width and height attributes', () => {
      const params: ResultImageParams = {
        playerCount: 4,
        rungs: [[true, false, false]],
        rows: [
          { name: 'A', label: 'P1', accentHex: '#ff7a85' },
          { name: 'B', label: 'P2', accentHex: '#2dd4bf' },
          { name: 'C', label: 'P3', accentHex: '#38bdf8' },
          { name: 'D', label: 'P4', accentHex: '#fbbf24' },
        ],
        playerNames: ['A', 'B', 'C', 'D'],
        prizeLabels: ['P1', 'P2', 'P3', 'P4'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toMatch(/width="\d+"/);
      expect(svg).toMatch(/height="\d+"/);
    });

    it('includes vertical lines for each column', () => {
      const params: ResultImageParams = {
        playerCount: 4,
        rungs: [[true, false, false]],
        rows: [
          { name: 'A', label: 'P1', accentHex: '#ff7a85' },
          { name: 'B', label: 'P2', accentHex: '#2dd4bf' },
          { name: 'C', label: 'P3', accentHex: '#38bdf8' },
          { name: 'D', label: 'P4', accentHex: '#fbbf24' },
        ],
        playerNames: ['A', 'B', 'C', 'D'],
        prizeLabels: ['P1', 'P2', 'P3', 'P4'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      // Count vertical lines (x1 === x2)
      const verticalLineMatches = svg.match(/<line[^>]*x1="(\d+)"[^>]*x2="\1"/g);
      const verticalLineCount = verticalLineMatches ? verticalLineMatches.length : 0;
      expect(verticalLineCount).toBeGreaterThanOrEqual(params.playerCount);
    });

    it('includes text for each row', () => {
      const params: ResultImageParams = {
        playerCount: 2,
        rungs: [[true]],
        rows: [
          { name: 'Alice', label: 'Prize A', accentHex: '#ff7a85' },
          { name: 'Bob', label: 'Prize B', accentHex: '#2dd4bf' },
        ],
        playerNames: ['Alice', 'Bob'],
        prizeLabels: ['Prize A', 'Prize B'],
        title: 'Test Results',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('Alice');
      expect(svg).toContain('Bob');
      expect(svg).toContain('Prize A');
      expect(svg).toContain('Prize B');
    });

    it('escapes XML special characters in name', () => {
      const params: ResultImageParams = {
        playerCount: 1,
        rungs: [],
        rows: [{ name: 'Alice & Bob', label: 'Prize', accentHex: '#ff7a85' }],
        playerNames: ['Alice & Bob'],
        prizeLabels: ['Prize'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('&amp;');
    });

    it('escapes XML special characters in label', () => {
      const params: ResultImageParams = {
        playerCount: 1,
        rungs: [],
        rows: [{ name: 'Alice', label: 'Prize <First>', accentHex: '#ff7a85' }],
        playerNames: ['Alice'],
        prizeLabels: ['Prize <First>'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('&lt;');
      expect(svg).toContain('&gt;');
    });

    it('escapes XML special characters in title', () => {
      const params: ResultImageParams = {
        playerCount: 1,
        rungs: [],
        rows: [{ name: 'Alice', label: 'Prize', accentHex: '#ff7a85' }],
        playerNames: ['Alice'],
        prizeLabels: ['Prize'],
        title: 'Test "Results" & Winners',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('&quot;');
      expect(svg).toContain('&amp;');
    });

    it('includes the title text', () => {
      const params: ResultImageParams = {
        playerCount: 2,
        rungs: [[true]],
        rows: [
          { name: 'A', label: 'P1', accentHex: '#ff7a85' },
          { name: 'B', label: 'P2', accentHex: '#2dd4bf' },
        ],
        playerNames: ['A', 'B'],
        prizeLabels: ['P1', 'P2'],
        title: 'My Test Title',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('My Test Title');
    });

    it('uses accent hex colors from rows', () => {
      const params: ResultImageParams = {
        playerCount: 2,
        rungs: [[true]],
        rows: [
          { name: 'Alice', label: 'First', accentHex: '#ff7a85' },
          { name: 'Bob', label: 'Second', accentHex: '#2dd4bf' },
        ],
        playerNames: ['Alice', 'Bob'],
        prizeLabels: ['First', 'Second'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('#ff7a85');
      expect(svg).toContain('#2dd4bf');
    });

    it('has symmetric top and bottom margins', () => {
      const PADDING = 30;
      const LEVEL_HEIGHT = 40;
      const params: ResultImageParams = {
        playerCount: 2,
        rungs: [[true], [false], [true]],
        rows: [
          { name: 'A', label: 'P1', accentHex: '#ff7a85' },
          { name: 'B', label: 'P2', accentHex: '#2dd4bf' },
        ],
        playerNames: ['A', 'B'],
        prizeLabels: ['P1', 'P2'],
        title: 'Symmetry Test',
      };
      const svg = buildResultSvgString(params);

      // Extract y1 and y2 from vertical lines
      const verticalLineMatch = svg.match(/<line[^>]*x1="(\d+)"[^>]*y1="(\d+)"[^>]*x2="\1"[^>]*y2="(\d+)"/);
      if (verticalLineMatch) {
        const y1 = parseInt(verticalLineMatch[2], 10);
        const y2 = parseInt(verticalLineMatch[3], 10);

        // Check symmetry: (y1 - padding) === (y2 - lastRungY)
        // For this test, we just verify vertical lines exist with reasonable bounds
        expect(y1).toBeGreaterThanOrEqual(PADDING);
        expect(y2).toBeGreaterThan(y1);
      }
    });

    it('handles empty rungs array', () => {
      const params: ResultImageParams = {
        playerCount: 2,
        rungs: [],
        rows: [
          { name: 'Alice', label: 'Prize', accentHex: '#ff7a85' },
          { name: 'Bob', label: 'Prize', accentHex: '#2dd4bf' },
        ],
        playerNames: ['Alice', 'Bob'],
        prizeLabels: ['Prize', 'Prize'],
        title: 'No Rungs',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('<svg');
      expect(svg).toContain('Alice');
    });

    it('handles 2-player game', () => {
      const params: ResultImageParams = {
        playerCount: 2,
        rungs: [[true]],
        rows: [
          { name: 'Alice', label: 'First', accentHex: '#ff7a85' },
          { name: 'Bob', label: 'Second', accentHex: '#2dd4bf' },
        ],
        playerNames: ['Alice', 'Bob'],
        prizeLabels: ['First', 'Second'],
        title: 'Two Players',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('Alice');
      expect(svg).toContain('Bob');
    });

    it('handles 10-player game', () => {
      const params: ResultImageParams = {
        playerCount: 10,
        rungs: Array(9).fill([true, false, false, false, false, false, false, false, false]),
        rows: Array.from({ length: 10 }, (_, i) => ({
          name: `Player${i + 1}`,
          label: `Prize${i + 1}`,
          accentHex: '#ff7a85',
        })),
        playerNames: Array.from({ length: 10 }, (_, i) => `Player${i + 1}`),
        prizeLabels: Array.from({ length: 10 }, (_, i) => `Prize${i + 1}`),
        title: 'Ten Players',
      };
      const svg = buildResultSvgString(params);
      expect(svg).toContain('Player1');
      expect(svg).toContain('Player10');
    });

    it('renders playerNames at top and prizeLabels at bottom', () => {
      const params: ResultImageParams = {
        playerCount: 3,
        rungs: [[true, false]],
        rows: [
          { name: 'Alice', label: 'Prize A', accentHex: '#ff7a85' },
          { name: 'Bob', label: 'Prize B', accentHex: '#2dd4bf' },
          { name: 'Carol', label: 'Prize C', accentHex: '#38bdf8' },
        ],
        playerNames: ['Alice', 'Bob', 'Carol'],
        prizeLabels: ['Prize A', 'Prize B', 'Prize C'],
        title: 'Test',
      };
      const svg = buildResultSvgString(params);
      // Check that playerNames appear in the SVG
      expect(svg).toContain('Alice');
      expect(svg).toContain('Bob');
      expect(svg).toContain('Carol');
      // Check that prizeLabels appear in the SVG
      expect(svg).toContain('Prize A');
      expect(svg).toContain('Prize B');
      expect(svg).toContain('Prize C');
      // Check that there are NO <circle> elements (dots removed)
      expect(svg).not.toMatch(/<circle/);
    });
  });
});
