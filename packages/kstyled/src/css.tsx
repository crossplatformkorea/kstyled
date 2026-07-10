/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CompiledStyles } from './types';
import type { StyleObject, StyleValue } from './types/styled-types';
import { normalizeStyleProperty, parseCSS } from './css-runtime-parser';

/**
 * Global debug flag for fallback CSS runtime parser
 * This is only used when babel plugin is not working (fallback mode)
 * For normal usage, control via babel.config.js: ['babel-plugin-kstyled', { debug: true }]
 */
const FALLBACK_DEBUG = false;
let didWarnAboutRuntimeFallback = false;

/**
 * Metadata injected by Babel plugin for css`` helper
 */
interface CssMetadata {
  compiledStyles?: CompiledStyles;
  styleKeys?: string[];
  getDynamicPatch?: (props: any) => any;
  debug?: boolean;
  // Internal cache for dynamic patch memoization
  _cachedDynamic?: {
    patch: any;
    hash: string;
  };
}

/**
 * Factory interface for css`` helper
 */
interface CssFactory {
  /**
   * Method called by Babel plugin with extracted styles
   */
  __withStyles(metadata: CssMetadata): StyleValue;

  /** @internal Used by babel-plugin-kstyled for dynamic css`` values. */
  __normalizeStyleValue(property: string, value: any): any;

  /**
   * Fallback: Called when used as tagged template without Babel transform
   */
  (strings: TemplateStringsArray, ...interpolations: any[]): StyleObject;
}

/**
 * css`` tagged template helper
 * Provides optimized inline styles similar to emotion's css``
 *
 * @example
 * ```tsx
 * import { css } from 'kstyled';
 *
 * function MyComponent({ isActive }) {
 *   return (
 *     <Text style={css`
 *       font-size: 16px;
 *       color: ${isActive ? '#007AFF' : '#8E8E93'};
 *     `}>
 *       Hello
 *     </Text>
 *   );
 * }
 * ```
 *
 * The Babel plugin will extract static styles at build time:
 * - Static styles → StyleSheet.create()
 * - Dynamic styles → computed on each render (still more efficient than creating objects)
 */
export const css: CssFactory = Object.assign(
  function cssRuntime(strings: TemplateStringsArray, ...interpolations: any[]) {
    if (!didWarnAboutRuntimeFallback) {
      didWarnAboutRuntimeFallback = true;
      console.warn(
        '[kstyled] css`` is using the runtime fallback. Add babel-plugin-kstyled to compile inline styles.'
      );
    }

    let callerInfo = 'unknown';
    if (FALLBACK_DEBUG) {
      try {
        const stack = new Error().stack || '';
        const lines = stack.split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.includes('css.tsx') && !line.includes('node_modules')) {
            const match = line.match(/at\s+(\S+)\s+\(([^)]+)\)/);
            if (match) {
              const filename =
                match[2].split('/').pop()?.split(':')[0] || 'unknown';
              callerInfo = `${filename}:${match[1]}`;
            } else {
              const matchWithoutFunction = line.match(/at\s+(.+):(\d+):(\d+)/);
              if (matchWithoutFunction) {
                callerInfo =
                  matchWithoutFunction[1].split('/').pop() || 'unknown';
              }
            }
            break;
          }
        }
      } catch {
        // Stack inspection is debug-only and must never affect rendering.
      }
    }

    try {
      const { staticStyles, dynamicGetter } = parseCSS(strings, interpolations);
      const dynamicStyles = dynamicGetter?.({});
      const styleObject = { ...staticStyles };

      if (dynamicStyles) {
        for (const [key, value] of Object.entries(dynamicStyles)) {
          styleObject[key] = normalizeStyleProperty(key, value);
        }
      }

      if (FALLBACK_DEBUG) {
        console.log(`[kstyled-css-runtime] Parsed ${callerInfo}:`, styleObject);
      }

      return styleObject;
    } catch (error) {
      console.warn('[kstyled] Failed to parse css``:', error);
      return {};
    }
  },
  {
    __normalizeStyleValue: normalizeStyleProperty,
    __withStyles: function (metadata: CssMetadata): any {
      const { compiledStyles, styleKeys, getDynamicPatch } = metadata;

      const styles: any[] = [];

      // Add compiled (static) styles
      if (compiledStyles && styleKeys) {
        for (const key of styleKeys) {
          if (key in compiledStyles) {
            styles.push(compiledStyles[key]);
          }
        }
      }

      // Add dynamic patch with automatic memoization
      // IMPORTANT: getDynamicPatch({}) is evaluated immediately here
      // The dynamic values are captured in the closure when Babel plugin creates this function
      // So SCREEN_WIDTH and other module-level constants work correctly
      if (getDynamicPatch) {
        try {
          const dynamicPatch = getDynamicPatch({});

          if (dynamicPatch && Object.keys(dynamicPatch).length > 0) {
            // Automatic memoization: Create hash from dynamic values
            let hash: string;
            try {
              hash = JSON.stringify(dynamicPatch, (_key, value) =>
                value === undefined ? '__ks__undefined__' : value
              );
            } catch {
              // Fallback for non-serializable values (e.g., circular references on web)
              hash = '';
            }

            if (
              hash &&
              metadata._cachedDynamic &&
              metadata._cachedDynamic.hash === hash
            ) {
              // Check if we can reuse the cached patch
              styles.push(metadata._cachedDynamic.patch);
            } else {
              // Cache miss or non-hashable: store new patch
              if (hash) {
                metadata._cachedDynamic = { patch: dynamicPatch, hash };
              }
              styles.push(dynamicPatch);
            }
          }
        } catch (error) {
          // getDynamicPatch({}) may fail when it contains theme-dependent
          // functions (e.g., ({theme}) => theme.bg.basic) since {} has no theme.
          // This is expected for css`` used inside styled components where
          // theme is provided at render time, not at definition time.
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn(
              '[kstyled] css.__withStyles getDynamicPatch({}) failed:',
              error
            );
          }
        }
      }

      // Optimization: Return single style object if only one style exists
      // This prevents unnecessary array creation and improves performance
      // For multiple styles or when using in arrays, React Native will handle it
      if (styles.length === 1) {
        return styles[0];
      }

      return styles;
    },
  }
);

/**
 * Type helper for css`` return type
 */
export type CssResult = StyleValue;
