import { transformSync } from '@babel/core';
import plugin from '../index';

function transform(
  code: string,
  options: { debug?: boolean; optimizeStatic?: boolean; strict?: boolean } = {}
) {
  const result = transformSync(code, {
    plugins: [[plugin, options]],
    filename: 'test.tsx',
    presets: ['@babel/preset-typescript'],
  });

  return result?.code || '';
}

describe('babel-plugin-kstyled', () => {
  describe('Shorthand Property Expansion', () => {
    test('should expand padding shorthand with 2 values', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: 4px 8px;
        \`;
      `;

      const output = transform(input);

      // Should expand to longhand properties (not paddingVertical/paddingHorizontal)
      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      // Should NOT contain the shorthand 'padding' property
      expect(output).not.toContain('padding:');
    });

    test('should expand padding shorthand with 4 values', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: 10px 20px 30px 40px;
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
    });

    test('should expand margin shorthand with 2 values', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          margin: 12px 16px;
        \`;
      `;

      const output = transform(input);

      // Should expand to longhand properties (not marginVertical/marginHorizontal)
      expect(output).toContain('marginTop');
      expect(output).toContain('marginRight');
      expect(output).toContain('marginBottom');
      expect(output).toContain('marginLeft');
    });

    test('should expand multiple shorthand properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: 14px 20px;
          margin: 8px 12px;
          background-color: red;
        \`;
      `;

      const output = transform(input);

      // Should expand all shorthands to longhand
      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      expect(output).toContain('marginTop');
      expect(output).toContain('marginRight');
      expect(output).toContain('marginBottom');
      expect(output).toContain('marginLeft');
      expect(output).toContain('backgroundColor');
    });
  });

  describe('Static Style Extraction', () => {
    test('should extract static styles to StyleSheet.create', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          background-color: #007AFF;
          padding: 16px;
        \`;
      `;

      const output = transform(input);

      // Should import StyleSheet
      expect(output).toContain('StyleSheet');
      // Should call StyleSheet.create
      expect(output).toContain('StyleSheet.create');
      // Should contain static values
      expect(output).toContain('#007AFF');
      expect(output).toContain('16');
    });

    test('should handle single value padding (no expansion)', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: 16px;
        \`;
      `;

      const output = transform(input);

      // Single value should remain as 'padding', not expanded
      expect(output).toContain('padding');
      expect(output).not.toContain('paddingVertical');
      expect(output).not.toContain('paddingHorizontal');
    });

    test('should preserve the styled contract for member expressions', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Typography } from './typography';

        const SectionTitle = styled(Typography.Body2)\`
          font-weight: 700;
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('styled(Typography.Body2).__withStyles');
      expect(output).not.toContain('forwardRef');
    });

    test('should preserve attrs and extension APIs for static components', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: 16px;
        \`;
      `;

      const output = transform(input, { optimizeStatic: true });

      expect(output).toContain('styled(View).__withStyles');
      expect(output).not.toContain('forwardRef');
    });
  });

  describe('Inline css Compilation', () => {
    test('should compile static and dynamic css inside functions', () => {
      const input = `
        import { css } from 'kstyled';

        function getStyle(active: boolean) {
          return css\`
            padding: 12px;
            color: \${active ? '#0A7A55' : '#687078'};
          \`;
        }
      `;

      const output = transform(input);

      expect(output).toContain('StyleSheet.create');
      expect(output).toContain("active ? '#0A7A55' : '#687078'");
      expect(output).not.toContain('css.__withStyles');
      expect(output).not.toContain('css`');
    });

    test('should emit a direct object for dynamic-only css', () => {
      const input = `
        import { css } from 'kstyled';

        const getStyle = (opacity: number) => css\`
          opacity: \${opacity};
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('css.__normalizeStyleValue("opacity", opacity)');
      expect(output).not.toContain('StyleSheet.create');
      expect(output).not.toContain('css.__withStyles');
    });

    test('should normalize numeric strings in dynamic css values', () => {
      const input = `
        import { css } from 'kstyled';

        const getStyle = (loading: boolean) => css\`
          opacity: \${loading ? '0' : '1'};
        \`;
      `;

      const output = transform(input);

      expect(output).toContain(
        "css.__normalizeStyleValue(\"opacity\", loading ? '0' : '1')"
      );
    });
  });

  describe('Dynamic Style Generation', () => {
    test('should generate getDynamicPatch for prop-based styles', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Pressable } from 'react-native';

        const Button = styled(Pressable)\`
          padding: 14px 20px;
          background-color: \${(p) => p.$variant === 'primary' ? '#007AFF' : '#FF3B30'};
        \`;
      `;

      const output = transform(input);

      // Should have getDynamicPatch function
      expect(output).toContain('getDynamicPatch');
      // Should have static padding styles expanded to longhand
      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      // Dynamic function should be called with (p)
      expect(output).toMatch(/backgroundColor.*\(p\)/);
    });

    test('should call arrow functions immediately with (p)', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          opacity: \${(p) => p.$visible ? 1 : 0};
        \`;
      `;

      const output = transform(input);

      // The arrow function should be called with (p)
      expect(output).toMatch(/opacity.*\(p\)/);
      expect(output).toContain('getDynamicPatch');
    });

    test('should expand dynamic shorthand and compile dynamic transforms', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: \${p => p.$vertical}px \${p => p.$horizontal}px;
          transform: translateY(\${p => p.$offset}px) scale(\${p => p.$scale});
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      expect(output).toContain('translateY');
      expect(output).toContain('scale');
      expect(output).toContain('p.$offset');
      expect(output).toContain('p.$scale');
    });
  });

  describe('Hybrid Styles (Static + Dynamic)', () => {
    test('should separate static and dynamic styles correctly', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Card = styled(View)\`
          padding: 16px;
          border-radius: 12px;
          background-color: \${(p) => p.$selected ? '#007AFF' : '#FFFFFF'};
        \`;
      `;

      const output = transform(input);

      // Static styles should be in StyleSheet.create
      expect(output).toContain('StyleSheet.create');
      expect(output).toContain('padding');
      expect(output).toContain('borderRadius');

      // Dynamic styles should be in getDynamicPatch
      expect(output).toContain('getDynamicPatch');
      expect(output).toContain('backgroundColor');
    });
  });

  describe('.attrs() Pattern', () => {
    test('should handle .attrs() with static styles', () => {
      const input = `
        import { styled } from 'kstyled';
        import { TextInput } from 'react-native';

        const Input = styled(TextInput).attrs({
          placeholder: 'Enter text',
          accessibilityLabel: 'Text input'
        })\`
          padding: 12px 16px;
          border-radius: 8px;
        \`;
      `;

      const output = transform(input);

      // Should expand padding shorthand to longhand
      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      // Should have attrs
      expect(output).toContain('attrs');
      expect(output).toContain('placeholder');
    });

    test('should compile attrs on styled shortcuts', () => {
      const input = `
        import { styled } from 'kstyled';

        const Input = styled.TextInput.attrs({
          accessibilityLabel: 'Search'
        })\`
          min-height: 44px;
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('__withStyles');
      expect(output).toContain('accessibilityLabel');
      expect(output).toContain('TextInput');
    });
  });

  describe('CSS Property Conversion', () => {
    test('should convert CSS properties to React Native properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Text } from 'react-native';

        const Label = styled(Text)\`
          font-size: 16px;
          font-weight: bold;
          line-height: 24px;
        \`;
      `;

      const output = transform(input);

      // Should convert to camelCase
      expect(output).toContain('fontSize');
      expect(output).toContain('fontWeight');
      expect(output).toContain('lineHeight');
    });
  });

  describe('Complex Real-World Scenarios', () => {
    test('should handle complex button with shorthand and dynamic styles', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Pressable } from 'react-native';

        const DynamicButton = styled(Pressable)\`
          padding: 14px 20px;
          border-radius: 8px;
          align-items: center;
          margin-vertical: 6px;
          background-color: \${(p) => {
            if (p.$variant === 'primary') return '#007AFF';
            if (p.$variant === 'danger') return '#FF3B30';
            return '#34C759';
          }};
        \`;
      `;

      const output = transform(input);

      // Static styles - padding shorthand expanded to longhand
      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      expect(output).toContain('borderRadius');
      expect(output).toContain('alignItems');
      expect(output).toContain('marginVertical');

      // Dynamic backgroundColor
      expect(output).toContain('getDynamicPatch');
      expect(output).toContain('backgroundColor');
      // Function should be called with (p) - check for the pattern (with multiline support)
      expect(output).toMatch(/backgroundColor[\s\S]*?\)\(p\)/);
    });

    test('should not break when styled is not imported', () => {
      const input = `
        import { View } from 'react-native';
        const Box = View;
      `;

      const output = transform(input);

      // Should not transform anything
      expect(output).not.toContain('StyleSheet');
      expect(output).toContain('const Box = View');
    });
  });

  describe('Error Prevention', () => {
    test('should handle empty template literal', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`\`;
      `;

      const output = transform(input);

      // Should not crash
      expect(output).toBeDefined();
    });

    test('should handle invalid CSS gracefully', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          invalid-property: value;
          padding: 16px;
        \`;
      `;

      const output = transform(input);

      // Should still process valid properties
      expect(output).toContain('padding');
      expect(output).toBeDefined();
    });
  });

  describe('Template Literal Interpolation with Units', () => {
    test('should handle interpolation with px unit suffix', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          width: \${({$size = 'medium'}) =>
            $size === 'small' ? 16 : $size === 'large' ? 24 : 20}px;
          height: \${({$size = 'medium'}) =>
            $size === 'small' ? 16 : $size === 'large' ? 24 : 20}px;
          border-radius: \${({$size = 'medium'}) =>
            $size === 'small' ? 8 : $size === 'large' ? 12 : 10}px;
        \`;
      `;

      const output = transform(input);

      // Should contain width, height, borderRadius
      expect(output).toContain('width');
      expect(output).toContain('height');
      expect(output).toContain('borderRadius');
      // The px suffix should be stripped automatically
      // Values should be numbers, not strings with 'px'
      expect(output).not.toContain('px');
      expect(output).toBeDefined();
    });

    test('should handle simple interpolation with px unit', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const SIZE = 16;
        const Box = styled(View)\`
          width: \${SIZE}px;
          height: \${SIZE}px;
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('width');
      expect(output).toContain('height');
      // px should be stripped from interpolations
      expect(output).not.toContain('px');
      expect(output).toBeDefined();
    });

    test('should handle multiple units in interpolations', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Text } from 'react-native';

        const FONT_SIZE = 14;
        const LINE_HEIGHT = 20;
        const Label = styled(Text)\`
          font-size: \${FONT_SIZE}px;
          line-height: \${LINE_HEIGHT}px;
          letter-spacing: \${0.5}px;
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('fontSize');
      expect(output).toContain('lineHeight');
      expect(output).toContain('letterSpacing');
      // All px units should be stripped
      expect(output).not.toContain('px');
    });

    test('should handle string values with px units from functions', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          width: \${({$size = 'medium'}) =>
            $size === 'small' ? '16px' : $size === 'large' ? '24px' : '20px'};
          height: \${({$size = 'medium'}) =>
            $size === 'small' ? '16px' : $size === 'large' ? '24px' : '20px'};
          border-radius: \${({$size = 'medium'}) =>
            $size === 'small' ? '8px' : $size === 'large' ? '12px' : '10px'};
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('width');
      expect(output).toContain('height');
      expect(output).toContain('borderRadius');
      // String values like '16px' are preserved in the function
      // They will be normalized at runtime by normalizeStyleValue
      expect(output).toContain('16px');
      expect(output).toContain('24px');
      expect(output).toContain('20px');
      expect(output).toBeDefined();
    });
  });

  describe('Comprehensive React Native Property Support', () => {
    test('should support all ViewStyle border properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Card = styled(View)\`
          border-width: 1px;
          border-color: #ccc;
          border-style: solid;
          border-start-width: 1px;
          border-end-width: 1px;
          border-start-color: purple;
          border-end-color: orange;
          border-block-color: pink;
          border-start-start-radius: 4px;
          border-end-end-radius: 4px;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('borderWidth');
      expect(output).toContain('borderColor');
      expect(output).toContain('borderStyle');
      expect(output).toContain('borderStartWidth');
      expect(output).toContain('borderEndWidth');
      expect(output).toContain('borderStartColor');
      expect(output).toContain('borderEndColor');
      expect(output).toContain('borderBlockColor');
      expect(output).toContain('borderStartStartRadius');
      expect(output).toContain('borderEndEndRadius');
    });

    test('should support all shadow properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Shadow = styled(View)\`
          shadow-color: #000;
          shadow-opacity: 0.25;
          shadow-radius: 8px;
          elevation: 5;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('shadowColor');
      expect(output).toContain('shadowOpacity');
      expect(output).toContain('shadowRadius');
      expect(output).toContain('elevation');
    });

    test('should serialize transform arrays and shadow offsets', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Floating = styled(View)\`
          transform: translateY(-9px) scale(1.05) rotate(2deg);
          shadow-offset: 0px 4px;
        \`;
      `;

      const output = transform(input);

      expect(output).toContain('translateY: -9');
      expect(output).toContain('scale: 1.05');
      expect(output).toContain('rotate: "2deg"');
      expect(output).toContain('shadowOffset');
      expect(output).toContain('width: 0');
      expect(output).toContain('height: 4');
      expect(output).not.toContain('transform: null');
    });

    test('should support all layout properties including margin/padding start/end', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Layout = styled(View)\`
          aspect-ratio: 1.5;
          margin-start: 5px;
          margin-end: 5px;
          margin-block: 10px;
          padding-start: 5px;
          padding-end: 5px;
          padding-block: 10px;
          position: absolute;
          start: 0px;
          end: 0px;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('aspectRatio');
      expect(output).toContain('marginStart');
      expect(output).toContain('marginEnd');
      expect(output).toContain('marginBlock');
      expect(output).toContain('paddingStart');
      expect(output).toContain('paddingEnd');
      expect(output).toContain('paddingBlock');
      expect(output).toContain('start');
      expect(output).toContain('end');
    });

    test('should support all flexbox properties including gap', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Flex = styled(View)\`
          row-gap: 8px;
          column-gap: 8px;
          gap: 8px;
          align-content: flex-start;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('rowGap');
      expect(output).toContain('columnGap');
      expect(output).toContain('gap');
      expect(output).toContain('alignContent');
    });

    test('should support all TextStyle properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Text } from 'react-native';

        const StyledText = styled(Text)\`
          font-variant: small-caps;
          letter-spacing: 0.5px;
          text-align-vertical: center;
          text-decoration-line: underline;
          text-decoration-color: red;
          text-decoration-style: solid;
          text-shadow-color: #000;
          text-shadow-radius: 2px;
          vertical-align: middle;
          writing-direction: ltr;
          user-select: text;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('fontVariant');
      expect(output).toContain('letterSpacing');
      expect(output).toContain('textAlignVertical');
      expect(output).toContain('textDecorationLine');
      expect(output).toContain('textDecorationColor');
      expect(output).toContain('textDecorationStyle');
      expect(output).toContain('textShadowColor');
      expect(output).toContain('textShadowRadius');
      expect(output).toContain('verticalAlign');
      expect(output).toContain('writingDirection');
      expect(output).toContain('userSelect');
    });

    test('should support all ImageStyle properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { Image } from 'react-native';

        const StyledImage = styled(Image)\`
          resize-mode: cover;
          object-fit: contain;
          tint-color: blue;
          overlay-color: rgba(0,0,0,0.5);
          backface-visibility: hidden;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('resizeMode');
      expect(output).toContain('objectFit');
      expect(output).toContain('tintColor');
      expect(output).toContain('overlayColor');
      expect(output).toContain('backfaceVisibility');
    });

    test('should support New Architecture properties', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const NewArch = styled(View)\`
          outline-color: blue;
          outline-width: 2px;
          outline-style: solid;
          outline-offset: 4px;
          pointer-events: auto;
          cursor: pointer;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('outlineColor');
      expect(output).toContain('outlineWidth');
      expect(output).toContain('outlineStyle');
      expect(output).toContain('outlineOffset');
      expect(output).toContain('pointerEvents');
      expect(output).toContain('cursor');
    });

    test('should support both kebab-case and camelCase', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Mixed = styled(View)\`
          background-color: red;
          backgroundColor: blue;
          border-radius: 8px;
          borderRadius: 4px;
        \`;
      `;

      const output = transform(input);
      // Both should be converted to camelCase
      expect(output).toContain('backgroundColor');
      expect(output).toContain('borderRadius');
    });

    test('should support percentage values', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Percent = styled(View)\`
          width: 50%;
          height: 100%;
          margin: 10%;
          padding: 5%;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('"50%"');
      expect(output).toContain('"100%"');
      expect(output).toContain('"10%"');
      expect(output).toContain('"5%"');
    });

    test('should support unitless numbers', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Box = styled(View)\`
          padding: 16;
          margin: 8;
          border-radius: 12;
          opacity: 0.5;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('padding: 16');
      expect(output).toContain('margin: 8');
      expect(output).toContain('borderRadius: 12');
      expect(output).toContain('opacity: 0.5');
    });

    test('should support mixed unitless and px values', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Mixed = styled(View)\`
          padding: 16px 24;
          margin: 8 12px;
          border-radius: 8;
          border-width: 1px;
        \`;
      `;

      const output = transform(input);
      // Should expand shorthand to longhand
      expect(output).toContain('paddingTop');
      expect(output).toContain('paddingRight');
      expect(output).toContain('paddingBottom');
      expect(output).toContain('paddingLeft');
      expect(output).toContain('marginTop');
      expect(output).toContain('marginRight');
      expect(output).toContain('marginBottom');
      expect(output).toContain('marginLeft');
      expect(output).toContain('borderRadius');
      expect(output).toContain('borderWidth');
    });

    test('should support negative unitless numbers', () => {
      const input = `
        import { styled } from 'kstyled';
        import { View } from 'react-native';

        const Negative = styled(View)\`
          margin-top: -10;
          margin-left: -5px;
          top: -20;
        \`;
      `;

      const output = transform(input);
      expect(output).toContain('marginTop: -10');
      expect(output).toContain('marginLeft: -5');
      expect(output).toContain('top: -20');
    });
  });
});
