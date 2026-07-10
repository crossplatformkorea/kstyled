/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CSS Parser
 * Parses template literal CSS into React Native StyleSheet format
 */

import type { CSSProperty, StyleRule } from './types';

/**
 * CSS property name mapping: CSS -> React Native
 * Comprehensive mapping for all ViewStyle, TextStyle, and ImageStyle properties
 */
const CSS_TO_RN_MAP: Record<string, string> = {
  // ViewStyle - Background & Colors
  'background-color': 'backgroundColor',

  // ViewStyle - Border
  'border-width': 'borderWidth',
  'border-color': 'borderColor',
  'border-style': 'borderStyle',
  'border-radius': 'borderRadius',
  'border-top-width': 'borderTopWidth',
  'border-right-width': 'borderRightWidth',
  'border-bottom-width': 'borderBottomWidth',
  'border-left-width': 'borderLeftWidth',
  'border-top-color': 'borderTopColor',
  'border-right-color': 'borderRightColor',
  'border-bottom-color': 'borderBottomColor',
  'border-left-color': 'borderLeftColor',
  'border-start-color': 'borderStartColor',
  'border-end-color': 'borderEndColor',
  'border-block-color': 'borderBlockColor',
  'border-block-end-color': 'borderBlockEndColor',
  'border-block-start-color': 'borderBlockStartColor',
  'border-top-left-radius': 'borderTopLeftRadius',
  'border-top-right-radius': 'borderTopRightRadius',
  'border-bottom-left-radius': 'borderBottomLeftRadius',
  'border-bottom-right-radius': 'borderBottomRightRadius',
  'border-top-start-radius': 'borderTopStartRadius',
  'border-top-end-radius': 'borderTopEndRadius',
  'border-bottom-start-radius': 'borderBottomStartRadius',
  'border-bottom-end-radius': 'borderBottomEndRadius',
  'border-start-start-radius': 'borderStartStartRadius',
  'border-start-end-radius': 'borderStartEndRadius',
  'border-end-start-radius': 'borderEndStartRadius',
  'border-end-end-radius': 'borderEndEndRadius',
  'border-curve': 'borderCurve',

  // ViewStyle - Shadow & Elevation
  'shadow-color': 'shadowColor',
  'shadow-offset': 'shadowOffset',
  'shadow-opacity': 'shadowOpacity',
  'shadow-radius': 'shadowRadius',
  'box-shadow': 'boxShadow',
  'drop-shadow': 'dropShadow',

  // ViewStyle - Display & Layout
  'backface-visibility': 'backfaceVisibility',
  'pointer-events': 'pointerEvents',
  'outline-color': 'outlineColor',
  'outline-offset': 'outlineOffset',
  'outline-style': 'outlineStyle',
  'outline-width': 'outlineWidth',

  // Layout & Positioning
  'margin-top': 'marginTop',
  'margin-right': 'marginRight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  'margin-start': 'marginStart',
  'margin-end': 'marginEnd',
  'margin-vertical': 'marginVertical',
  'margin-horizontal': 'marginHorizontal',
  'margin-block': 'marginBlock',
  'margin-block-start': 'marginBlockStart',
  'margin-block-end': 'marginBlockEnd',
  'padding-top': 'paddingTop',
  'padding-right': 'paddingRight',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  'padding-start': 'paddingStart',
  'padding-end': 'paddingEnd',
  'padding-vertical': 'paddingVertical',
  'padding-horizontal': 'paddingHorizontal',
  'padding-block': 'paddingBlock',
  'padding-block-start': 'paddingBlockStart',
  'padding-block-end': 'paddingBlockEnd',
  'min-width': 'minWidth',
  'max-width': 'maxWidth',
  'min-height': 'minHeight',
  'max-height': 'maxHeight',
  'aspect-ratio': 'aspectRatio',
  'z-index': 'zIndex',
  'box-sizing': 'boxSizing',

  // Flexbox
  'flex-direction': 'flexDirection',
  'flex-wrap': 'flexWrap',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'align-self': 'alignSelf',
  'align-content': 'alignContent',
  'flex-grow': 'flexGrow',
  'flex-shrink': 'flexShrink',
  'flex-basis': 'flexBasis',
  'row-gap': 'rowGap',
  'column-gap': 'columnGap',

  // TextStyle
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'font-family': 'fontFamily',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'line-height': 'lineHeight',
  'letter-spacing': 'letterSpacing',
  'text-align': 'textAlign',
  'text-align-vertical': 'textAlignVertical',
  'text-decoration': 'textDecorationLine',
  'text-decoration-line': 'textDecorationLine',
  'text-decoration-color': 'textDecorationColor',
  'text-decoration-style': 'textDecorationStyle',
  'text-shadow-color': 'textShadowColor',
  'text-shadow-offset': 'textShadowOffset',
  'text-shadow-radius': 'textShadowRadius',
  'text-transform': 'textTransform',
  'vertical-align': 'verticalAlign',
  'writing-direction': 'writingDirection',
  'include-font-padding': 'includeFontPadding',
  'user-select': 'userSelect',

  // ImageStyle
  'resize-mode': 'resizeMode',
  'object-fit': 'objectFit',
  'tint-color': 'tintColor',
  'overlay-color': 'overlayColor',
};

/**
 * Convert CSS property name to React Native camelCase
 */
export function cssToRNProperty(cssProperty: string): string {
  const trimmed = cssProperty.trim();

  // If already camelCase (no hyphens), return as-is
  if (!trimmed.includes('-')) {
    return trimmed;
  }

  // Try mapped conversion
  const mapped = CSS_TO_RN_MAP[trimmed.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  // Auto-convert kebab-case to camelCase
  return trimmed.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Parse CSS value to appropriate JS type
 */
export function parseCSSValue(value: string): any {
  const trimmed = value.trim();

  // Handle placeholder with units: __EXPR_0__px -> __EXPR_0__
  // In React Native, numeric values don't use units
  if (/__EXPR_\d+__/.test(trimmed)) {
    // Remove common CSS units from placeholders
    return trimmed.replace(/(px|em|rem|pt|vh|vw|%)$/i, '');
  }

  // Percentage values must remain as strings in React Native
  if (trimmed.endsWith('%')) {
    return trimmed;
  }

  // Number with optional unit (px, em, rem) or unitless - strip unit and convert to number
  // Supports: 16, 16px, 1.5, 1.5em, -10, -10px
  if (/^-?\d+(\.\d+)?(px|em|rem)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    return isNaN(num) ? trimmed : num;
  }

  // String values (colors, keywords, etc.)
  if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
    return trimmed.slice(1, -1);
  }

  // Keywords
  return trimmed;
}

function parseOffsetValue(value: string): { width: any; height: any } | null {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 2) {
    return null;
  }

  return {
    width: parseCSSValue(parts[0]),
    height: parseCSSValue(parts[1]),
  };
}

function parseTransformValue(value: string): Array<Record<string, any>> | null {
  const transforms: Array<Record<string, any>> = [];
  const transformPattern = /([a-zA-Z][\w]*)\(([^()]*)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = transformPattern.exec(value)) !== null) {
    if (value.slice(cursor, match.index).trim()) {
      return null;
    }

    const name = match[1];
    const rawValue = match[2].trim();

    if (name === 'translate') {
      const parts = rawValue.split(/[,\s]+/).filter(Boolean);
      if (parts.length < 1 || parts.length > 2) {
        return null;
      }
      transforms.push({ translateX: parseCSSValue(parts[0]) });
      if (parts[1]) {
        transforms.push({ translateY: parseCSSValue(parts[1]) });
      }
    } else if (name === 'matrix') {
      const parts = rawValue
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(parseCSSValue);
      if (parts.length !== 9 && parts.length !== 16) {
        return null;
      }
      transforms.push({ matrix: parts });
    } else if (
      name === 'rotate' ||
      name === 'rotateX' ||
      name === 'rotateY' ||
      name === 'rotateZ' ||
      name === 'skewX' ||
      name === 'skewY'
    ) {
      transforms.push({ [name]: rawValue });
    } else if (
      name === 'perspective' ||
      name === 'scale' ||
      name === 'scaleX' ||
      name === 'scaleY' ||
      name === 'translateX' ||
      name === 'translateY'
    ) {
      transforms.push({ [name]: parseCSSValue(rawValue) });
    } else {
      return null;
    }

    cursor = transformPattern.lastIndex;
  }

  if (value.slice(cursor).trim() || transforms.length === 0) {
    return null;
  }

  return transforms;
}

function parseStaticValue(property: string, value: string): any {
  if (property === 'fontWeight' && /^\d+$/.test(value.trim())) {
    return value.trim();
  }

  if (property === 'transform') {
    return parseTransformValue(value) ?? parseCSSValue(value);
  }

  if (property === 'shadowOffset' || property === 'textShadowOffset') {
    return parseOffsetValue(value) ?? parseCSSValue(value);
  }

  return parseCSSValue(value);
}

/**
 * Expand shorthand properties (padding, margin with multiple values) to longhand
 * React Native doesn't support shorthand like "4px 8px" but does support
 * single-value properties like borderRadius and borderColor
 */
function expandShorthand(
  property: string,
  value: string
): Record<string, any> | null {
  const trimmed = value.trim();

  // React Native supports borderRadius and borderColor as single properties,
  // so we don't need to expand them unless they have multiple values

  // Check if this is a shorthand value (contains spaces and numbers)
  if (!trimmed.includes(' ')) {
    return null; // Not a shorthand, single value
  }

  const parts = trimmed.split(/\s+/).map(parseCSSValue);

  if (property === 'padding') {
    if (parts.length === 2) {
      // padding: vertical horizontal
      // IMPORTANT: Use longhand properties for proper style override in React Native
      return {
        paddingTop: parts[0],
        paddingRight: parts[1],
        paddingBottom: parts[0],
        paddingLeft: parts[1],
      };
    } else if (parts.length === 3) {
      // padding: top horizontal bottom
      return {
        paddingTop: parts[0],
        paddingRight: parts[1],
        paddingBottom: parts[2],
        paddingLeft: parts[1],
      };
    } else if (parts.length === 4) {
      // padding: top right bottom left
      return {
        paddingTop: parts[0],
        paddingRight: parts[1],
        paddingBottom: parts[2],
        paddingLeft: parts[3],
      };
    }
  } else if (property === 'margin') {
    if (parts.length === 2) {
      // margin: vertical horizontal
      // IMPORTANT: Use longhand properties for proper style override in React Native
      return {
        marginTop: parts[0],
        marginRight: parts[1],
        marginBottom: parts[0],
        marginLeft: parts[1],
      };
    } else if (parts.length === 3) {
      // margin: top horizontal bottom
      return {
        marginTop: parts[0],
        marginRight: parts[1],
        marginBottom: parts[2],
        marginLeft: parts[1],
      };
    } else if (parts.length === 4) {
      // margin: top right bottom left
      return {
        marginTop: parts[0],
        marginRight: parts[1],
        marginBottom: parts[2],
        marginLeft: parts[3],
      };
    }
  }

  return null;
}

/**
 * Check if a value contains interpolation placeholder
 */
export function isDynamicValue(value: string): boolean {
  return value.includes('__INTERPOLATION_') || value.includes('__EXPR_');
}

/**
 * Parse a single CSS declaration
 */
export function parseDeclaration(declaration: string): CSSProperty | null {
  const colonIndex = declaration.indexOf(':');
  if (colonIndex === -1) return null;

  const property = declaration.slice(0, colonIndex).trim();
  const value = declaration.slice(colonIndex + 1).trim();

  if (!property || !value) return null;

  return {
    property: cssToRNProperty(property),
    value,
    isDynamic: isDynamicValue(value),
    isConditional: false,
  };
}

/**
 * Parse CSS template string into style object
 * Handles:
 * - Static values
 * - Dynamic interpolations (marked as __INTERPOLATION_N__)
 * - Platform-specific styles (@android, @ios)
 * - Shorthand properties (padding, margin)
 */
export function parseCSS(css: string): StyleRule {
  const staticStyles: Record<string, any> = {};
  const dynamicStyles: Array<{
    condition?: string;
    properties: Record<string, any>;
  }> = [];

  // Split by semicolons and process each declaration
  const declarations = css
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const originalProperty = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();

    if (!originalProperty || !value) continue;

    const rnProperty = cssToRNProperty(originalProperty);
    const isDynamic = isDynamicValue(value);

    if (isDynamic) {
      const expanded = expandShorthand(originalProperty, value);
      if (expanded) {
        for (const [expandedProperty, expandedValue] of Object.entries(
          expanded
        )) {
          if (
            typeof expandedValue === 'string' &&
            isDynamicValue(expandedValue)
          ) {
            dynamicStyles.push({
              properties: { [expandedProperty]: expandedValue },
            });
          } else {
            staticStyles[expandedProperty] = expandedValue;
          }
        }
      } else {
        // Strip units from placeholders (__EXPR_0__px -> __EXPR_0__)
        const processedValue = parseCSSValue(value);
        dynamicStyles.push({
          properties: { [rnProperty]: processedValue },
        });
      }
    } else {
      // Check if this is a shorthand property (use original property name)
      const expanded = expandShorthand(originalProperty, value);

      if (expanded) {
        // Shorthand expanded - add all longhand properties
        Object.assign(staticStyles, expanded);
      } else {
        // Static value - can be extracted to StyleSheet
        staticStyles[rnProperty] = parseStaticValue(rnProperty, value);
      }
    }
  }

  return { static: staticStyles, dynamic: dynamicStyles };
}

/**
 * Convert style object to CSS string (for debugging)
 */
export function styleObjectToCSS(styleObject: Record<string, any>): string {
  return Object.entries(styleObject)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${cssKey}: ${value};`;
    })
    .join('\n  ');
}

/**
 * Validate if a property is a valid React Native style property
 * Comprehensive list covering ViewStyle, TextStyle, ImageStyle, and Transform properties
 */
export function isValidRNProperty(property: string): boolean {
  const validProps = new Set([
    // Layout & Dimensions
    'width',
    'height',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'aspectRatio',

    // Margin
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginVertical',
    'marginHorizontal',
    'marginStart',
    'marginEnd',
    'marginBlock',
    'marginBlockStart',
    'marginBlockEnd',

    // Padding
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'paddingVertical',
    'paddingHorizontal',
    'paddingStart',
    'paddingEnd',
    'paddingBlock',
    'paddingBlockStart',
    'paddingBlockEnd',

    // Flexbox
    'flex',
    'flexDirection',
    'flexWrap',
    'justifyContent',
    'alignItems',
    'alignSelf',
    'alignContent',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'rowGap',
    'columnGap',
    'gap',

    // Position
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'start',
    'end',
    'zIndex',

    // Display
    'opacity',
    'overflow',
    'display',
    'backfaceVisibility',
    'pointerEvents',
    'cursor',

    // Background & Colors
    'backgroundColor',
    'color',

    // Border - Width
    'borderWidth',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStartWidth',
    'borderEndWidth',

    // Border - Color
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderStartColor',
    'borderEndColor',
    'borderBlockColor',
    'borderBlockStartColor',
    'borderBlockEndColor',

    // Border - Style
    'borderStyle',
    'borderCurve',

    // Border - Radius
    'borderRadius',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
    'borderTopStartRadius',
    'borderTopEndRadius',
    'borderBottomStartRadius',
    'borderBottomEndRadius',
    'borderStartStartRadius',
    'borderStartEndRadius',
    'borderEndStartRadius',
    'borderEndEndRadius',

    // Shadow (iOS)
    'shadowColor',
    'shadowOffset',
    'shadowOpacity',
    'shadowRadius',

    // Elevation (Android)
    'elevation',

    // Box Shadow (New Architecture)
    'boxShadow',
    'dropShadow',

    // Outline (New Architecture)
    'outlineColor',
    'outlineOffset',
    'outlineStyle',
    'outlineWidth',

    // Filter (New Architecture)
    'filter',

    // Additional Layout
    'direction',
    'boxSizing',
    'isolation',

    // TextStyle properties
    'fontSize',
    'fontWeight',
    'fontFamily',
    'fontStyle',
    'fontVariant',
    'lineHeight',
    'letterSpacing',
    'textAlign',
    'textAlignVertical',
    'textDecorationLine',
    'textDecorationColor',
    'textDecorationStyle',
    'textShadowColor',
    'textShadowOffset',
    'textShadowRadius',
    'textTransform',
    'verticalAlign',
    'writingDirection',
    'includeFontPadding',
    'userSelect',

    // ImageStyle properties
    'resizeMode',
    'objectFit',
    'tintColor',
    'overlayColor',

    // Transform
    'transform',
    'transformMatrix',
    'rotation',
    'scaleX',
    'scaleY',
    'translateX',
    'translateY',
  ]);

  return validProps.has(property);
}
