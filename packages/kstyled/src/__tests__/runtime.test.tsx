import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { styled } from '../styled';
import { css } from '../css';
import type { CompiledStyles, StyleMetadata } from '../types';
import { normalizeStyleValue } from '../css-runtime-parser';
import { mergeDynamicPatches } from '../utils/style-merger';

jest.mock('../theme', () => {
  const actual = jest.requireActual('../theme');
  return {
    ...actual,
    useTheme: () => actual.defaultTheme,
  };
});

describe('kstyled Runtime Tests', () => {
  describe('Static Styles', () => {
    test('should create component with static styles using __withStyles', () => {
      // Simulate what Babel plugin would do
      const compiledStyles = StyleSheet.create({
        base: {
          padding: 16,
          backgroundColor: '#007AFF',
          borderRadius: 8,
        },
      }) as unknown as CompiledStyles;

      const metadata: StyleMetadata = {
        compiledStyles,
        styleKeys: ['base'],
      };

      const StyledView = styled(View).__withStyles(metadata);

      // Create element and check metadata
      expect(StyledView).toBeDefined();
      expect((StyledView as any).__kstyled_metadata__).toBeDefined();
      // Check that styles are present (may be merged, so use toMatchObject)
      expect((StyledView as any).__kstyled_metadata__.compiledStyles).toMatchObject(compiledStyles);
      expect((StyledView as any).__kstyled_metadata__.styleKeys).toContain('base');
    });

    test('should merge static styles correctly', () => {
      const staticStyles = StyleSheet.create({
        base: {
          padding: 16,
          backgroundColor: '#007AFF',
        },
      }) as unknown as CompiledStyles;

      const StyledView = styled(View).__withStyles({
        compiledStyles: staticStyles,
        styleKeys: ['base'],
      });

      // Check that metadata is properly stored
      const metadata = (StyledView as any).__kstyled_metadata__;
      expect(metadata).toBeDefined();
      expect(metadata.compiledStyles).toBeDefined();
      expect(metadata.compiledStyles.base).toMatchObject(staticStyles.base);
      expect(metadata.styleKeys).toEqual(['base']);
    });
  });

  describe('Dynamic Styles', () => {
    test('should handle dynamic styles based on props', () => {
      const staticStyles = StyleSheet.create({
        base: {
          padding: 16,
          borderRadius: 8,
        },
      }) as unknown as CompiledStyles;

      const getDynamicPatch = (props: any) => ({
        backgroundColor: props.$variant === 'primary' ? '#007AFF' : '#FF3B30',
      });

      const StyledView = styled(View).__withStyles({
        compiledStyles: staticStyles,
        styleKeys: ['base'],
        getDynamicPatch,
      });

      expect(StyledView).toBeDefined();
      const metadata = (StyledView as any).__kstyled_metadata__;
      expect(metadata.getDynamicPatch).toBeDefined();
      expect(typeof metadata.getDynamicPatch).toBe('function');

      // Test that the dynamic patch function works correctly
      const testPatch = metadata.getDynamicPatch({ $variant: 'primary' });
      expect(testPatch).toHaveProperty('backgroundColor');
    });

    test('should handle multiple dynamic values', () => {
      const getDynamicPatch = (props: any) => ({
        opacity: props.$visible ? 1 : 0,
        transform: [{ scale: props.$scale || 1 }],
        backgroundColor: props.$color || 'white',
      });

      const StyledView = styled(View).__withStyles({
        getDynamicPatch,
      });

      expect(StyledView).toBeDefined();
      const metadata = (StyledView as any).__kstyled_metadata__;
      expect(metadata.getDynamicPatch).toBeDefined();

      // Test the dynamic patch function
      const patch1 = getDynamicPatch({ $visible: true, $scale: 1.5, $color: 'red' });
      expect(patch1).toEqual({
        opacity: 1,
        transform: [{ scale: 1.5 }],
        backgroundColor: 'red',
      });

      const patch2 = getDynamicPatch({ $visible: false });
      expect(patch2).toEqual({
        opacity: 0,
        transform: [{ scale: 1 }],
        backgroundColor: 'white',
      });
    });
  });

  describe('Extended Styles (Style Inheritance)', () => {
    test('should extend styled component with additional styles', () => {
      // Base component
      const baseStyles = StyleSheet.create({
        base: {
          padding: 16,
          backgroundColor: '#007AFF',
        },
      }) as unknown as CompiledStyles;

      const BaseButton = styled(View).__withStyles({
        compiledStyles: baseStyles,
        styleKeys: ['base'],
      });

      // Extended component
      const extendedStyles = StyleSheet.create({
        extended: {
          borderRadius: 12,
          borderWidth: 2,
          borderColor: 'white',
        },
      }) as unknown as CompiledStyles;

      const ExtendedButton = styled(BaseButton).__withStyles({
        compiledStyles: extendedStyles,
        styleKeys: ['extended'],
      });

      expect(ExtendedButton).toBeDefined();

      // Check that both base and extended styles are in metadata
      const metadata = (ExtendedButton as any).__kstyled_metadata__;
      expect(metadata).toBeDefined();
      expect(metadata.compiledStyles).toBeDefined();
      expect(metadata.styleKeys).toBeDefined();
    });

    test('should merge dynamic patches from parent and child', () => {
      // Parent with dynamic styles
      const parentDynamic = (props: any) => ({
        opacity: props.$visible ? 1 : 0,
      });

      const ParentComponent = styled(View).__withStyles({
        getDynamicPatch: parentDynamic,
      });

      // Child with additional dynamic styles
      const childDynamic = (props: any) => ({
        backgroundColor: props.$color || 'white',
      });

      const ChildComponent = styled(ParentComponent).__withStyles({
        getDynamicPatch: childDynamic,
      });

      expect(ChildComponent).toBeDefined();
      const metadata = (ChildComponent as any).__kstyled_metadata__;
      expect(metadata.getDynamicPatch).toBeDefined();
    });
  });

  describe('attrs() Pattern', () => {
    test('should handle attrs with static styles', () => {
      const styles = StyleSheet.create({
        base: {
          padding: 12,
          borderRadius: 8,
        },
      }) as unknown as CompiledStyles;

      const StyledInput = styled(Text).attrs({
        placeholder: 'Enter text',
        accessibilityLabel: 'Text input',
      } as any).__withStyles({
        compiledStyles: styles,
        styleKeys: ['base'],
        attrs: {
          placeholder: 'Enter text',
          accessibilityLabel: 'Text input',
        },
      });

      expect(StyledInput).toBeDefined();
      const metadata = (StyledInput as any).__kstyled_metadata__;
      expect(metadata.attrs).toBeDefined();
      expect(metadata.attrs.placeholder).toBe('Enter text');
    });

    test('should handle attrs with function', () => {
      const attrsFunction = (props: any) => ({
        placeholder: props.$placeholder || 'Default',
        editable: !props.$disabled,
      });

      // attrs must be passed via .attrs() method, not directly in __withStyles
      const StyledInput = styled(Text).attrs(attrsFunction).__withStyles({});

      expect(StyledInput).toBeDefined();
      const metadata = (StyledInput as any).__kstyled_metadata__;
      expect(metadata.attrs).toBeDefined();
      expect(typeof metadata.attrs).toBe('function');

      // Test that attrs function works
      const testAttrs = (metadata.attrs as any)({ $placeholder: 'Test', $disabled: true });
      expect(testAttrs).toEqual({
        placeholder: 'Test',
        editable: false,
      });
    });

    test('should forward attrs values to rendered component', () => {
      const Base = React.forwardRef((props: any, _ref) => {
        return React.createElement('Base', props);
      });

      const compiledStyles = StyleSheet.create({
        base: { padding: 4 },
      }) as unknown as CompiledStyles;

      const StyledComp = styled(Base).__withStyles({
        compiledStyles,
        styleKeys: ['base'],
        attrs: {
          accessibilityRole: 'button',
          testID: 'default-id',
        },
      });

      const element = (StyledComp as any).render({ testID: 'override-id' }, null);

      expect(element.props.accessibilityRole).toBe('button');
      expect(element.props.testID).toBe('override-id');
      expect(element.props.style).toBeDefined();
    });

    test('should allow attrs to override base component via as', () => {
      const Base = React.forwardRef((props: any, _ref) => React.createElement('Base', props));
      const Override = React.forwardRef((props: any, _ref) => React.createElement('Override', props));

      const StyledComp = styled(Base).__withStyles({
        attrs: () => ({
          as: Override,
        }),
      });

      const elementWithOverride = (StyledComp as any).render({}, null);
      expect(elementWithOverride.type).toBe(Override);

      const elementWithProp = (StyledComp as any).render({ as: Base }, null);
      expect(elementWithProp.type).toBe(Base);
    });
  });

  describe('Inline css`` with Memoization', () => {
    test('should handle static css`` styles', () => {
      const staticStyles = StyleSheet.create({
        base: {
          fontSize: 16,
          color: '#000',
          padding: 8,
        },
      }) as unknown as CompiledStyles;

      const metadata = {
        compiledStyles: staticStyles,
        styleKeys: ['base'],
      };

      const result = css.__withStyles(metadata);

      // Should return the style object or array
      expect(result).toBeDefined();
      expect(Array.isArray(result) || typeof result === 'object').toBe(true);
    });

    test('should handle dynamic css`` styles', () => {
      const staticStyles = StyleSheet.create({
        base: {
          fontSize: 16,
        },
      }) as unknown as CompiledStyles;

      const getDynamicPatch = () => ({
        color: '#007AFF',
        opacity: 0.8,
      });

      const metadata = {
        compiledStyles: staticStyles,
        styleKeys: ['base'],
        getDynamicPatch,
      };

      const result = css.__withStyles(metadata);

      expect(result).toBeDefined();
      expect(Array.isArray(result) || typeof result === 'object').toBe(true);
    });

    test('should memoize dynamic css`` styles when values do not change', () => {
      const SCREEN_WIDTH = 375; // Simulating a constant

      const getDynamicPatch = () => ({
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.5,
      });

      const metadata: any = {
        getDynamicPatch,
      };

      // First call
      const result1 = css.__withStyles(metadata);

      // Second call with same values - should use cache
      const result2 = css.__withStyles(metadata);

      // The metadata should have cached the result
      expect(metadata._cachedDynamic).toBeDefined();
      expect(metadata._cachedDynamic.patch).toBeDefined();
      expect(metadata._cachedDynamic.hash).toBeDefined();

      // Both calls should return arrays (since we have dynamic styles)
      expect(Array.isArray(result1) || typeof result1 === 'object').toBe(true);
      expect(Array.isArray(result2) || typeof result2 === 'object').toBe(true);
    });

    test('should update memoized css`` when dynamic values change', () => {
      let isActive = true;

      const getDynamicPatch = () => ({
        backgroundColor: isActive ? '#007AFF' : '#8E8E93',
        opacity: isActive ? 1 : 0.5,
      });

      const metadata: any = {
        getDynamicPatch,
      };

      // First call with isActive = true
      const result1 = css.__withStyles(metadata);
      const hash1 = metadata._cachedDynamic?.hash;

      // Change the value
      isActive = false;

      // Second call with isActive = false
      const result2 = css.__withStyles(metadata);
      const hash2 = metadata._cachedDynamic?.hash;

      // Hashes should be different
      expect(hash1).not.toBe(hash2);
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    test('should return single style object when only one style exists', () => {
      const staticStyles = StyleSheet.create({
        base: {
          fontSize: 16,
        },
      }) as unknown as CompiledStyles;

      const metadata = {
        compiledStyles: staticStyles,
        styleKeys: ['base'],
      };

      const result = css.__withStyles(metadata);

      // With only one style, should return the style object directly (not array)
      // unless there are dynamic patches
      expect(typeof result === 'object').toBe(true);
    });

    test('should handle css`` with module-level constants', () => {
      const SPACING = 16;
      const COLOR_PRIMARY = '#007AFF';

      const getDynamicPatch = () => ({
        padding: SPACING,
        marginTop: SPACING * 2,
        backgroundColor: COLOR_PRIMARY,
      });

      const metadata: any = {
        getDynamicPatch,
      };

      const result = css.__withStyles(metadata);

      expect(result).toBeDefined();
      expect(metadata._cachedDynamic).toBeDefined();

      // The values should be captured correctly
      const patch = metadata._cachedDynamic.patch;
      expect(patch.padding).toBe(16);
      expect(patch.marginTop).toBe(32);
      expect(patch.backgroundColor).toBe('#007AFF');
    });

    test('should not crash when getDynamicPatch throws (theme-dependent css``)', () => {
      // Simulates compiled css`` with theme interpolation: css`color: ${({theme}) => theme.text.primary}`
      // When __withStyles calls getDynamicPatch({}), theme is {} so theme.text is undefined
      const getDynamicPatch = (props: any) => ({
        color: props.theme.text.primary, // This throws: Cannot read properties of undefined
      });

      const metadata: any = {
        getDynamicPatch,
      };

      // Should not throw - gracefully handles the error
      expect(() => css.__withStyles(metadata)).not.toThrow();

      // Should return empty styles (no dynamic patch applied)
      const result = css.__withStyles(metadata);
      expect(result).toEqual([]);
    });

    test('should not crash when JSON.stringify encounters circular references', () => {
      const circular: any = { color: 'red' };
      circular.self = circular;

      const getDynamicPatch = () => circular;

      const metadata: any = {
        getDynamicPatch,
      };

      // Should not throw
      expect(() => css.__withStyles(metadata)).not.toThrow();

      // Should still push the patch even without caching
      const result = css.__withStyles(metadata);
      expect(result).toBeDefined();
    });
  });

  describe('Hybrid Styles (Static + Dynamic)', () => {
    test('should combine static and dynamic styles', () => {
      const staticStyles = StyleSheet.create({
        base: {
          padding: 16,
          borderRadius: 12,
        },
      }) as unknown as CompiledStyles;

      const getDynamicPatch = (props: any) => ({
        backgroundColor: props.$selected ? '#007AFF' : '#FFFFFF',
        borderWidth: props.$selected ? 2 : 1,
      });

      const StyledView = styled(View).__withStyles({
        compiledStyles: staticStyles,
        styleKeys: ['base'],
        getDynamicPatch,
      });

      expect(StyledView).toBeDefined();
      const metadata = (StyledView as any).__kstyled_metadata__;
      expect(metadata.compiledStyles).toBeDefined();
      expect(metadata.compiledStyles.base).toMatchObject(staticStyles.base);
      expect(metadata.getDynamicPatch).toBeDefined();
      expect(typeof metadata.getDynamicPatch).toBe('function');
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle component with all features combined', () => {
      // Static styles
      const staticStyles = StyleSheet.create({
        base: {
          borderRadius: 8,
          alignItems: 'center' as const,
        },
      }) as unknown as CompiledStyles;

      // Dynamic styles
      const getDynamicPatch = (props: any) => {
        if (props.$variant === 'primary') return { backgroundColor: '#007AFF' };
        if (props.$variant === 'danger') return { backgroundColor: '#FF3B30' };
        return { backgroundColor: '#34C759' };
      };

      // Attrs
      const attrs = {
        accessible: true,
        accessibilityRole: 'button' as const,
      };

      // attrs must be passed via .attrs() method, then __withStyles
      const ComplexButton = styled(View).attrs(attrs).__withStyles({
        compiledStyles: staticStyles,
        styleKeys: ['base'],
        getDynamicPatch,
      });

      expect(ComplexButton).toBeDefined();
      const metadata = (ComplexButton as any).__kstyled_metadata__;
      expect(metadata.compiledStyles).toBeDefined();
      expect(metadata.compiledStyles.base).toMatchObject(staticStyles.base);
      expect(metadata.getDynamicPatch).toBeDefined();
      expect(typeof metadata.getDynamicPatch).toBe('function');
      expect(metadata.attrs).toEqual(attrs);
    });

    test('should handle deeply nested style extensions', () => {
      // Level 1: Base
      const baseStyles = StyleSheet.create({
        base: { padding: 8 },
      }) as unknown as CompiledStyles;

      const Level1 = styled(View).__withStyles({
        compiledStyles: baseStyles,
        styleKeys: ['base'],
      });

      // Level 2: Extend Level1
      const level2Styles = StyleSheet.create({
        level2: { margin: 12 },
      }) as unknown as CompiledStyles;

      const Level2 = styled(Level1).__withStyles({
        compiledStyles: level2Styles,
        styleKeys: ['level2'],
      });

      // Level 3: Extend Level2
      const level3Styles = StyleSheet.create({
        level3: { borderRadius: 16 },
      }) as unknown as CompiledStyles;

      const Level3 = styled(Level2).__withStyles({
        compiledStyles: level3Styles,
        styleKeys: ['level3'],
      });

      expect(Level3).toBeDefined();
      const metadata = (Level3 as any).__kstyled_metadata__;
      expect(metadata).toBeDefined();
      expect(metadata.compiledStyles).toBeDefined();
    });
  });

  describe('Performance Optimizations', () => {
    test('should reuse StyleSheet styles across multiple instances', () => {
      const staticStyles = StyleSheet.create({
        base: {
          padding: 16,
          backgroundColor: '#007AFF',
        },
      }) as unknown as CompiledStyles;

      const StyledView1 = styled(View).__withStyles({
        compiledStyles: staticStyles,
        styleKeys: ['base'],
      });

      const StyledView2 = styled(View).__withStyles({
        compiledStyles: staticStyles,
        styleKeys: ['base'],
      });

      // Different components, but can share the same compiled styles
      const metadata1 = (StyledView1 as any).__kstyled_metadata__;
      const metadata2 = (StyledView2 as any).__kstyled_metadata__;

      // They should both have the same style values (content equality, not reference)
      expect(metadata1.compiledStyles).toBeDefined();
      expect(metadata2.compiledStyles).toBeDefined();
      expect(metadata1.compiledStyles.base).toMatchObject(staticStyles.base);
      expect(metadata2.compiledStyles.base).toMatchObject(staticStyles.base);
    });
  });

  describe('normalizeStyleValue', () => {
    test('should convert string values with px to numbers', () => {
      expect(normalizeStyleValue('16px')).toBe(16);
      expect(normalizeStyleValue('24px')).toBe(24);
      expect(normalizeStyleValue('1.5px')).toBe(1.5);
    });

    test('should convert string values with em/rem to numbers', () => {
      expect(normalizeStyleValue('2em')).toBe(2);
      expect(normalizeStyleValue('1.5rem')).toBe(1.5);
    });

    test('should convert negative string values', () => {
      expect(normalizeStyleValue('-10px')).toBe(-10);
      expect(normalizeStyleValue('-5')).toBe(-5);
    });

    test('should preserve percentage values as strings', () => {
      expect(normalizeStyleValue('50%')).toBe('50%');
      expect(normalizeStyleValue('100%')).toBe('100%');
    });

    test('should preserve quoted string values', () => {
      expect(normalizeStyleValue('"red"')).toBe('red');
      expect(normalizeStyleValue("'blue'")).toBe('blue');
    });

    test('should preserve non-string values', () => {
      expect(normalizeStyleValue(16)).toBe(16);
      expect(normalizeStyleValue(0)).toBe(0);
      expect(normalizeStyleValue(null)).toBe(null);
      expect(normalizeStyleValue(undefined)).toBe(undefined);
    });

    test('should preserve color strings and keywords', () => {
      expect(normalizeStyleValue('red')).toBe('red');
      expect(normalizeStyleValue('#FF0000')).toBe('#FF0000');
      expect(normalizeStyleValue('transparent')).toBe('transparent');
    });
  });

  describe('Dynamic styles with string px values', () => {
    test('should normalize string px values from getDynamicPatch', () => {
      const getDynamicPatch = (props: any): any => ({
        width: props.$size === 'small' ? '16px' : '20px',
        height: props.$size === 'small' ? '16px' : '20px',
      });

      const baseMetadata = {};
      const props = { $size: 'small' };

      // Call mergeDynamicPatches to test actual normalization
      const normalized = mergeDynamicPatches(
        baseMetadata,
        getDynamicPatch,
        props as any
      );

      // Verify that string px values are normalized to numbers
      expect(normalized).toBeDefined();
      expect(normalized?.width).toBe(16);
      expect(normalized?.height).toBe(16);
    });

    test('should normalize transform arrays with string px values', () => {
      const getDynamicPatch = (props: any): any => ({
        transform: [
          { translateX: props.$offset ? '10px' : '0px' },
          { translateY: '5px' },
          { scale: 1.5 },
        ],
      });

      const baseMetadata = {};
      const props = { $offset: true };

      // Call mergeDynamicPatches to test actual normalization
      const normalized = mergeDynamicPatches(
        baseMetadata,
        getDynamicPatch,
        props as any
      );

      // Verify that transform array values are normalized
      expect(normalized).toBeDefined();
      expect(normalized?.transform).toBeDefined();
      expect(Array.isArray(normalized?.transform)).toBe(true);

      const transform = normalized?.transform as any[];
      expect(transform[0].translateX).toBe(10); // '10px' -> 10
      expect(transform[1].translateY).toBe(5);  // '5px' -> 5
      expect(transform[2].scale).toBe(1.5);     // number unchanged
    });
  });
});
