import { expandShorthandProperties } from '../style-merger';

describe('expandShorthandProperties', () => {
  describe('padding shorthand expansion', () => {
    it('should expand padding to all four longhand properties', () => {
      const input = {
        padding: 0,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      });
    });

    it('should expand paddingHorizontal to paddingLeft + paddingRight', () => {
      const input = {
        paddingHorizontal: 0,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        paddingLeft: 0,
        paddingRight: 0,
      });
    });

    it('should expand paddingVertical to paddingTop + paddingBottom', () => {
      const input = {
        paddingVertical: 8,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        paddingTop: 8,
        paddingBottom: 8,
      });
    });
  });

  describe('margin shorthand expansion', () => {
    it('should expand margin to all four longhand properties', () => {
      const input = {
        margin: 4,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        marginTop: 4,
        marginRight: 4,
        marginBottom: 4,
        marginLeft: 4,
      });
    });

    it('should expand marginHorizontal to marginLeft + marginRight', () => {
      const input = {
        marginHorizontal: 0,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        marginLeft: 0,
        marginRight: 0,
      });
    });

    it('should expand marginVertical to marginTop + marginBottom', () => {
      const input = {
        marginVertical: 12,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        marginTop: 12,
        marginBottom: 12,
      });
    });
  });

  describe('preserving other properties', () => {
    it('should reuse objects that do not contain shorthand properties', () => {
      const input = { backgroundColor: 'red', opacity: 0.8 };

      expect(expandShorthandProperties(input)).toBe(input);
    });

    it('should preserve non-shorthand properties', () => {
      const input = {
        padding: 8,
        backgroundColor: 'red',
        flexDirection: 'row',
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        paddingTop: 8,
        paddingRight: 8,
        paddingBottom: 8,
        paddingLeft: 8,
        backgroundColor: 'red',
        flexDirection: 'row',
      });
    });

    it('should handle mixed shorthand properties', () => {
      const input = {
        padding: 8,
        margin: 4,
      };

      const result = expandShorthandProperties(input);

      expect(result).toEqual({
        paddingTop: 8,
        paddingRight: 8,
        paddingBottom: 8,
        paddingLeft: 8,
        marginTop: 4,
        marginRight: 4,
        marginBottom: 4,
        marginLeft: 4,
      });
    });
  });

  describe('edge cases', () => {
    it('should return null for null input', () => {
      const result = expandShorthandProperties(null);
      expect(result).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      const result = expandShorthandProperties(undefined);
      expect(result).toBeUndefined();
    });

    it('should return empty object for empty input', () => {
      const result = expandShorthandProperties({});
      expect(result).toEqual({});
    });
  });
});
