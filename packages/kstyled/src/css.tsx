/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { CompiledStyles } from './types';

/**
 * Global debug flag for fallback CSS runtime parser
 * This is only used when babel plugin is not working (fallback mode)
 * For normal usage, control via babel.config.js: ['babel-plugin-kstyled', { debug: true }]
 */
const FALLBACK_DEBUG = false;

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
  __withStyles(metadata: CssMetadata): any[];

  /**
   * Fallback: Called when used as tagged template without Babel transform
   */
  (strings: TemplateStringsArray, ...interpolations: any[]): any;
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
    // Runtime CSS parsing for dynamic values
    // Build the full CSS string with interpolated values
    let cssString = '';
    for (let i = 0; i < strings.length; i++) {
      cssString += strings[i];
      if (i < interpolations.length) {
        cssString += interpolations[i];
      }
    }

    // Extract caller information from stack trace
    let callerInfo = 'unknown';
    try {
      const stack = new Error().stack || '';
      const lines = stack.split('\n');
      // Find the first line that's not from this file or node_modules
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('css.tsx') && !line.includes('node_modules')) {
          // Extract filename and function name
          // Format: "at functionName (filename:line:col)"
          const match = line.match(/at\s+(\S+)\s+\(([^)]+)\)/);
          if (match) {
            const funcName = match[1];
            const fullPath = match[2];
            const filename = fullPath.split('/').pop()?.split(':')[0] || 'unknown';
            callerInfo = `${filename}:${funcName}`;
          } else {
            // Format: "at filename:line:col"
            const match2 = line.match(/at\s+(.+):(\d+):(\d+)/);
            if (match2) {
              const fullPath = match2[1];
              const filename = fullPath.split('/').pop() || 'unknown';
              callerInfo = filename;
            }
          }
          break;
        }
      }
    } catch (e) {
      // Ignore stack trace errors
    }

    if (FALLBACK_DEBUG) {
      console.log(`[kstyled-css-runtime] Parsing CSS in ${callerInfo}:`, cssString);
    }

    // Parse the CSS string into a style object
    try {
      const styleObj: any = {};
      const lines = cssString.split(';').filter(line => line.trim());

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const prop = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();

        if (!prop || !value) continue;

        // Convert CSS property to camelCase
        const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        // Handle padding and margin shorthand
        // 1 value: all sides
        // 2 values: vertical horizontal
        // 3 values: top horizontal bottom
        // 4 values: top right bottom left
        if (camelProp === 'padding' || camelProp === 'margin') {
          const parts = value.split(/\s+/);
          const prefix = camelProp; // 'padding' or 'margin'

          // IMPORTANT: Always use longhand properties for proper override in React Native
          if (parts.length === 1) {
            const val = parseFloat(parts[0]);
            styleObj[`${prefix}Top`] = val;
            styleObj[`${prefix}Right`] = val;
            styleObj[`${prefix}Bottom`] = val;
            styleObj[`${prefix}Left`] = val;
          } else if (parts.length === 2) {
            styleObj[`${prefix}Top`] = parseFloat(parts[0]);
            styleObj[`${prefix}Right`] = parseFloat(parts[1]);
            styleObj[`${prefix}Bottom`] = parseFloat(parts[0]);
            styleObj[`${prefix}Left`] = parseFloat(parts[1]);
          } else if (parts.length === 3) {
            // top, horizontal, bottom
            styleObj[`${prefix}Top`] = parseFloat(parts[0]);
            styleObj[`${prefix}Right`] = parseFloat(parts[1]);
            styleObj[`${prefix}Bottom`] = parseFloat(parts[2]);
            styleObj[`${prefix}Left`] = parseFloat(parts[1]);
          } else if (parts.length === 4) {
            styleObj[`${prefix}Top`] = parseFloat(parts[0]);
            styleObj[`${prefix}Right`] = parseFloat(parts[1]);
            styleObj[`${prefix}Bottom`] = parseFloat(parts[2]);
            styleObj[`${prefix}Left`] = parseFloat(parts[3]);
          }
        }
        // Parse numeric values (remove 'px' suffix)
        else if (value.endsWith('px')) {
          styleObj[camelProp] = parseFloat(value);
        }
        // Parse unitless numeric values (e.g., flex: 1, opacity: 0.5)
        else if (/^-?\d+(\.\d+)?$/.test(value)) {
          styleObj[camelProp] = parseFloat(value);
        }
        // Keep string values as-is
        else {
          styleObj[camelProp] = value;
        }
      }

      if (FALLBACK_DEBUG) {
        console.log(`[kstyled-css-runtime] Result in ${callerInfo}:`, styleObj);
      }
      return styleObj;
    } catch (error) {
      console.warn('[kstyled] Failed to parse css``: ', error);
      return {};
    }
  },
  {
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

            if (hash && metadata._cachedDynamic && metadata._cachedDynamic.hash === hash) {
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
        } catch {
          // getDynamicPatch({}) may fail when it contains theme-dependent
          // functions (e.g., ({theme}) => theme.bg.basic) since {} has no theme.
          // This is expected for css`` used inside styled components where
          // theme is provided at render time, not at definition time.
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
export type CssResult = any[] | any;
