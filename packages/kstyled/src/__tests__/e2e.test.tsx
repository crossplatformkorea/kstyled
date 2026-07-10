/**
 * End-to-End Tests
 *
 * These tests verify the complete flow from source code → Babel transformation → Runtime execution
 * This ensures that the Babel plugin and runtime work together correctly.
 */
import { transformSync } from '@babel/core';
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
// @ts-ignore - importing from parent package for testing
import babelPlugin from '../../../babel-plugin-kstyled/src/index';

// Helper to transform and execute code
function transformAndExecute(code: string) {
  const source = `
    import { styled, css } from 'kstyled';
    import { StyleSheet } from 'react-native';
    ${code}
  `;
  const stripImports = () => ({
    visitor: {
      Program: {
        exit(path: any) {
          for (const statement of path.get('body')) {
            if (statement.isImportDeclaration()) {
              statement.remove();
            }
          }
        },
      },
    },
  });

  const transformResult = transformSync(source, {
    plugins: [[babelPlugin, { debug: false, strict: true }], stripImports],
    filename: 'test.tsx',
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
  });

  if (!transformResult || !transformResult.code) {
    throw new Error('Babel transformation failed');
  }

  // Create a context with necessary imports
  const context: Record<string, any> = {
    React,
    View,
    Pressable,
    Text,
    StyleSheet,
    _StyleSheet: StyleSheet,
    styled: undefined,
    css: undefined,
    exports: {},
  };

  // Inject styled and css from the actual package
  const styledModule = require('../styled');
  const cssModule = require('../css');
  context.styled = styledModule.styled;
  context.css = cssModule.css;

  // Wrap code to export result via exports object
  const wrappedCode = `
    ${transformResult.code}
    exports.__result = result;
  `;

  // Execute the transformed code
  const fn = new Function(...Object.keys(context), wrappedCode);
  fn(...Object.values(context));

  return context.exports.__result;
}

describe('End-to-End Tests', () => {
  describe('styled() with Static Styles', () => {
    test('should transform and execute static styled component', () => {
      const code = `
        const result = styled(View)\`
          padding: 16px;
          background-color: #007AFF;
          border-radius: 8px;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);

      // Verify the component was created
      expect(StyledComponent).toBeDefined();
      expect(typeof StyledComponent).toBe('object');

      // Check metadata
      const metadata = (StyledComponent as any).__kstyled_metadata__;
      expect(metadata).toBeDefined();
      expect(metadata.compiledStyles).toBeDefined();
      expect(metadata.styleKeys).toBeDefined();
      expect(metadata.styleKeys.length).toBeGreaterThan(0);

      // Verify static styles were compiled
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];
      expect(styles).toBeDefined();
      expect(styles.padding).toBe(16);
      expect(styles.backgroundColor).toBe('#007AFF');
      expect(styles.borderRadius).toBe(8);
    });

    test('should handle shorthand properties correctly', () => {
      const code = `
        const result = styled(View)\`
          padding: 14px 20px;
          margin: 8px 12px;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);
      const metadata = (StyledComponent as any).__kstyled_metadata__;
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];

      // Shorthand should be expanded
      expect(styles.paddingTop).toBe(14);
      expect(styles.paddingRight).toBe(20);
      expect(styles.paddingBottom).toBe(14);
      expect(styles.paddingLeft).toBe(20);
      expect(styles.marginTop).toBe(8);
      expect(styles.marginRight).toBe(12);
      expect(styles.marginBottom).toBe(8);
      expect(styles.marginLeft).toBe(12);
    });
  });

  describe('styled() with Dynamic Styles', () => {
    test('should transform and execute dynamic styled component', () => {
      const code = `
        const result = styled(Pressable)\`
          padding: 16px;
          background-color: \${p => p.$primary ? '#007AFF' : '#ccc'};
          border-radius: 8px;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);
      const metadata = (StyledComponent as any).__kstyled_metadata__;

      // Check static styles
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];
      expect(styles.padding).toBe(16);
      expect(styles.borderRadius).toBe(8);

      // Check dynamic patch function
      expect(metadata.getDynamicPatch).toBeDefined();
      expect(typeof metadata.getDynamicPatch).toBe('function');

      // Test the dynamic function
      const dynamicPatch1 = metadata.getDynamicPatch({ $primary: true });
      expect(dynamicPatch1.backgroundColor).toBe('#007AFF');

      const dynamicPatch2 = metadata.getDynamicPatch({ $primary: false });
      expect(dynamicPatch2.backgroundColor).toBe('#ccc');
    });

    test('should handle multiple dynamic values', () => {
      const code = `
        const result = styled(View)\`
          opacity: \${p => p.$visible ? 1 : 0};
          background-color: \${p => p.$color || 'white'};
          padding: 16px;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);
      const metadata = (StyledComponent as any).__kstyled_metadata__;

      // Static style
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];
      expect(styles.padding).toBe(16);

      // Dynamic patches
      const patch1 = metadata.getDynamicPatch({
        $visible: true,
        $color: 'red',
      });
      expect(patch1.opacity).toBe(1);
      expect(patch1.backgroundColor).toBe('red');

      const patch2 = metadata.getDynamicPatch({ $visible: false });
      expect(patch2.opacity).toBe(0);
      expect(patch2.backgroundColor).toBe('white');
    });
  });

  describe('styled() with Extended Styles', () => {
    test('should transform and execute extended styled component', () => {
      const code = `
        const BaseButton = styled(Pressable)\`
          padding: 16px;
          border-radius: 8px;
        \`;

        const result = styled(BaseButton)\`
          background-color: #007AFF;
          border-width: 2px;
        \`;
      `;

      const ExtendedComponent = transformAndExecute(code);
      const metadata = (ExtendedComponent as any).__kstyled_metadata__;

      expect(metadata).toBeDefined();
      expect(metadata.compiledStyles).toBeDefined();

      // Check that styles are present
      // In inheritance, styles are merged, so we should check the metadata directly
      expect(metadata.styleKeys).toBeDefined();
      expect(metadata.styleKeys.length).toBeGreaterThan(0);

      // Verify that at least some expected styles exist
      const allStyles: Record<string, any> = Object.values(
        metadata.compiledStyles
      ).reduce(
        (acc: Record<string, any>, style: any) => ({ ...acc, ...style }),
        {}
      );

      // Should have borderRadius and backgroundColor
      expect(
        allStyles.borderRadius !== undefined ||
          allStyles.backgroundColor !== undefined
      ).toBe(true);
      expect(
        allStyles.borderWidth !== undefined ||
          allStyles.backgroundColor !== undefined
      ).toBe(true);
    });
  });

  describe('css`` helper', () => {
    test('should transform and execute static css``', () => {
      const code = `
        const result = css\`
          font-size: 16px;
          color: #000;
          border-radius: 8px;
        \`;
      `;

      const styles = transformAndExecute(code);

      expect(styles).toBeDefined();

      // css`` returns either an object or array
      const flatStyles = Array.isArray(styles)
        ? StyleSheet.flatten(styles)
        : styles;

      expect(flatStyles.fontSize).toBe(16);
      expect(flatStyles.color).toBe('#000');
      expect(flatStyles.borderRadius).toBe(8);
    });

    test('should transform and execute dynamic css``', () => {
      const code = `
        const isActive = true;
        const result = css\`
          font-size: 16px;
          color: \${isActive ? '#007AFF' : '#8E8E93'};
        \`;
      `;

      const styles = transformAndExecute(code);
      const flatStyles = Array.isArray(styles)
        ? StyleSheet.flatten(styles)
        : styles;

      expect(flatStyles.fontSize).toBe(16);
      expect(flatStyles.color).toBe('#007AFF');
    });

    test('should normalize string numbers in compiled dynamic css``', () => {
      const code = `
        const loading = false;
        const result = css\`
          opacity: \${loading ? '0' : '1'};
          transform: scale(\${'1.5'});
        \`;
      `;

      const styles = transformAndExecute(code);
      const flatStyles = Array.isArray(styles)
        ? StyleSheet.flatten(styles)
        : styles;

      expect(flatStyles.opacity).toBe(1);
      expect(flatStyles.transform).toEqual([{ scale: 1.5 }]);
    });

    test('should memoize css`` with constants', () => {
      const code = `
        const SCREEN_WIDTH = 375;

        // First call
        const styles1 = css\`
          width: \${SCREEN_WIDTH}px;
          height: \${SCREEN_WIDTH * 0.5}px;
        \`;

        // Second call with same values
        const styles2 = css\`
          width: \${SCREEN_WIDTH}px;
          height: \${SCREEN_WIDTH * 0.5}px;
        \`;

        const result = { styles1, styles2 };
      `;

      const { styles1, styles2 } = transformAndExecute(code);

      const flat1 = Array.isArray(styles1)
        ? StyleSheet.flatten(styles1)
        : styles1;
      const flat2 = Array.isArray(styles2)
        ? StyleSheet.flatten(styles2)
        : styles2;

      // Both should have the same values
      expect(flat1.width).toBe(375);
      expect(flat1.height).toBe(187.5);
      expect(flat2.width).toBe(375);
      expect(flat2.height).toBe(187.5);
    });

    test('should compile css`` inside a function without runtime parsing', () => {
      const code = `
        function getStyle(isActive) {
          return css\`
            padding: 12px;
            color: \${isActive ? '#0A7A55' : '#687078'};
          \`;
        }

        const result = getStyle(true);
      `;

      const styles = transformAndExecute(code);
      expect(StyleSheet.flatten(styles)).toMatchObject({
        padding: 12,
        color: '#0A7A55',
      });
    });
  });

  describe('.attrs() Pattern', () => {
    test('should transform and execute styled component with attrs', () => {
      const code = `
        const result = styled(Text).attrs({
          numberOfLines: 2,
          ellipsizeMode: 'tail'
        })\`
          font-size: 16px;
          color: #000;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);
      const metadata = (StyledComponent as any).__kstyled_metadata__;

      expect(metadata).toBeDefined();
      expect(metadata.attrs).toBeDefined();
      expect(metadata.attrs.numberOfLines).toBe(2);
      expect(metadata.attrs.ellipsizeMode).toBe('tail');

      // Check styles
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];
      expect(styles.fontSize).toBe(16);
      expect(styles.color).toBe('#000');
    });
  });

  describe('Complex Real-World Scenarios', () => {
    test('should handle button with all features', () => {
      const code = `
        const result = styled(Pressable)\`
          padding: 14px 20px;
          border-radius: 8px;
          align-items: center;
          background-color: \${p => {
            if (p.$variant === 'primary') return '#007AFF';
            if (p.$variant === 'danger') return '#FF3B30';
            return '#34C759';
          }};
          opacity: \${p => p.$disabled ? 0.5 : 1};
        \`;
      `;

      const Button = transformAndExecute(code);
      const metadata = (Button as any).__kstyled_metadata__;

      // Check static styles
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];
      expect(styles.paddingTop).toBe(14);
      expect(styles.paddingRight).toBe(20);
      expect(styles.paddingBottom).toBe(14);
      expect(styles.paddingLeft).toBe(20);
      expect(styles.borderRadius).toBe(8);
      expect(styles.alignItems).toBe('center');

      // Check dynamic styles
      const primaryPatch = metadata.getDynamicPatch({
        $variant: 'primary',
        $disabled: false,
      });
      expect(primaryPatch.backgroundColor).toBe('#007AFF');
      expect(primaryPatch.opacity).toBe(1);

      const disabledPatch = metadata.getDynamicPatch({ $disabled: true });
      expect(disabledPatch.opacity).toBe(0.5);

      const dangerPatch = metadata.getDynamicPatch({ $variant: 'danger' });
      expect(dangerPatch.backgroundColor).toBe('#FF3B30');
    });

    test('should handle mixed unitless and px values', () => {
      const code = `
        const result = styled(View)\`
          padding: 16px 24;
          margin: 8 12px;
          border-radius: 8;
          border-width: 1px;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);
      const metadata = (StyledComponent as any).__kstyled_metadata__;
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];

      // Should handle mixed units correctly
      expect(styles.paddingTop).toBe(16);
      expect(styles.paddingRight).toBe(24);
      expect(styles.paddingBottom).toBe(16);
      expect(styles.paddingLeft).toBe(24);
      expect(styles.marginTop).toBe(8);
      expect(styles.marginRight).toBe(12);
      expect(styles.marginBottom).toBe(8);
      expect(styles.marginLeft).toBe(12);
      expect(styles.borderRadius).toBe(8);
      expect(styles.borderWidth).toBe(1);
    });

    test('should handle percentage values', () => {
      const code = `
        const result = styled(View)\`
          width: 50%;
          height: 100%;
          padding: 5%;
        \`;
      `;

      const StyledComponent = transformAndExecute(code);
      const metadata = (StyledComponent as any).__kstyled_metadata__;
      const styleKey = metadata.styleKeys[0];
      const styles = metadata.compiledStyles[styleKey];

      expect(styles.width).toBe('50%');
      expect(styles.height).toBe('100%');
      expect(styles.padding).toBe('5%');
    });

    test('should handle nested component with theme', () => {
      const code = `
        const Card = styled(View)\`
          padding: 16px;
          border-radius: 12px;
          background-color: \${p => p.theme?.colors?.card || 'white'};
        \`;

        const result = styled(Card)\`
          margin: 8px;
          shadow-color: #000;
          shadow-opacity: 0.1;
          elevation: 2;
        \`;
      `;

      const StyledCard = transformAndExecute(code);
      const metadata = (StyledCard as any).__kstyled_metadata__;

      expect(metadata).toBeDefined();
      expect(metadata.compiledStyles).toBeDefined();

      // Should have both base and extended styles
      const allStyles: Record<string, any> = Object.values(
        metadata.compiledStyles
      ).reduce(
        (acc: Record<string, any>, style: any) => ({ ...acc, ...style }),
        {}
      );

      expect(allStyles.margin).toBeDefined();
      expect(allStyles.shadowColor).toBeDefined();
      expect(allStyles.shadowOpacity).toBeDefined();
      expect(allStyles.elevation).toBeDefined();
    });
  });
});
