/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Runtime CSS Parser
 * Lightweight CSS-to-RN style converter for fallback mode
 */

/**
 * CSS property mapping to React Native
 */
const cssToRN: Record<string, string> = {
  'align-content': 'alignContent',
  'align-items': 'alignItems',
  'align-self': 'alignSelf',
  'background-color': 'backgroundColor',
  'border-color': 'borderColor',
  'border-radius': 'borderRadius',
  'border-width': 'borderWidth',
  'border-bottom-color': 'borderBottomColor',
  'border-bottom-left-radius': 'borderBottomLeftRadius',
  'border-bottom-right-radius': 'borderBottomRightRadius',
  'border-bottom-width': 'borderBottomWidth',
  'border-left-color': 'borderLeftColor',
  'border-left-width': 'borderLeftWidth',
  'border-right-color': 'borderRightColor',
  'border-right-width': 'borderRightWidth',
  'border-top-color': 'borderTopColor',
  'border-top-left-radius': 'borderTopLeftRadius',
  'border-top-right-radius': 'borderTopRightRadius',
  'border-top-width': 'borderTopWidth',
  'flex-direction': 'flexDirection',
  'flex-wrap': 'flexWrap',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'justify-content': 'justifyContent',
  'line-height': 'lineHeight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  'margin-right': 'marginRight',
  'margin-top': 'marginTop',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  'padding-right': 'paddingRight',
  'padding-top': 'paddingTop',
  'text-align': 'textAlign',
  'text-decoration': 'textDecorationLine',
};

/**
 * Convert CSS property to React Native property
 */
function convertProperty(prop: string): string {
  const trimmed = prop.trim();

  // Already camelCase
  if (!trimmed.includes('-')) {
    return trimmed;
  }

  // Use mapping
  if (cssToRN[trimmed]) {
    return cssToRN[trimmed];
  }

  // Auto-convert kebab-case to camelCase
  return trimmed.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Parse CSS value to appropriate type
 * Converts string values like '16px' to numbers
 */
function parseValue(value: string): any {
  const trimmed = value.trim();

  // Remove quotes
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Percentage values must remain as strings in React Native
  if (trimmed.endsWith('%')) {
    return trimmed;
  }

  // Parse number with optional unit (px, em, rem) or unitless
  // Supports: 16, 16px, 1.5, 1.5em, -10, -10px
  if (/^-?\d+(\.\d+)?(px|em|rem)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Return as-is
  return trimmed;
}

/**
 * Normalize a style value by converting string values with units to numbers
 * Used for runtime dynamic values that may return '16px' instead of 16
 */
export function normalizeStyleValue(value: any): any {
  // Handle string values
  if (typeof value === 'string') {
    return parseValue(value);
  }

  if (Array.isArray(value)) {
    let normalized: any[] | undefined;

    value.forEach((item, index) => {
      const nextValue = normalizeStyleValue(item);
      if (nextValue !== item) {
        normalized ||= [...value];
        normalized[index] = nextValue;
      }
    });

    return normalized || value;
  }

  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      let normalized: Record<string, any> | undefined;

      for (const [key, item] of Object.entries(value)) {
        const nextValue = normalizeStyleValue(item);
        if (nextValue !== item) {
          const target = normalized || { ...value };
          target[key] = nextValue;
          normalized = target;
        }
      }

      return normalized || value;
    }
  }

  // Return non-string values as-is (numbers, objects, etc.)
  return value;
}

export function normalizeStyleProperty(property: string, value: any): any {
  if (property === 'fontWeight') {
    return typeof value === 'number' ? String(value) : value;
  }

  return normalizeStyleValue(value);
}

/**
 * Expand shorthand properties (padding, margin, etc.) to longhand
 * React Native doesn't support shorthand like "4px 8px"
 */
function expandShorthand(
  property: string,
  value: string
): Record<string, any> | null {
  const trimmed = value.trim();

  // Check if this is a shorthand value (contains spaces and numbers)
  if (!trimmed.includes(' ')) {
    return null; // Not a shorthand
  }

  const parts = trimmed.split(/\s+/).map(parseValue);

  if (property === 'padding') {
    if (parts.length === 2) {
      // padding: vertical horizontal
      return {
        paddingVertical: parts[0],
        paddingHorizontal: parts[1],
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
      return {
        marginVertical: parts[0],
        marginHorizontal: parts[1],
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
 * Parse CSS template string to React Native styles
 */
export function parseCSS(
  strings: TemplateStringsArray,
  expressions: any[]
): {
  staticStyles: Record<string, any>;
  dynamicGetter: ((props: any) => Record<string, any>) | null;
} {
  // Build full CSS string with placeholders
  let css = '';
  const exprMap = new Map<string, any>();

  for (let i = 0; i < strings.length; i++) {
    css += strings[i];
    if (i < expressions.length) {
      const placeholder = `__EXPR${i}__`;
      css += placeholder;
      exprMap.set(placeholder, expressions[i]);
    }
  }

  // Parse declarations
  const staticStyles: Record<string, any> = {};
  const dynamicProps: Array<{ prop: string; expr: any }> = [];

  const declarations = css
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = decl.slice(0, colonIdx).trim();
    const value = decl.slice(colonIdx + 1).trim();

    if (!prop || !value) continue;

    const rnProp = convertProperty(prop);

    // Check if value contains expression placeholder
    const match = value.match(/__EXPR(\d+)__/);
    if (match) {
      const exprIdx = parseInt(match[1], 10);
      const expr = expressions[exprIdx];
      dynamicProps.push({ prop: rnProp, expr });
    } else {
      // Check if this is a shorthand property
      const expanded = expandShorthand(prop, value);

      if (expanded) {
        // Shorthand expanded - add all longhand properties
        Object.assign(staticStyles, expanded);
      } else {
        const parsedValue = parseValue(value);
        staticStyles[rnProp] =
          rnProp === 'fontWeight' && typeof parsedValue === 'number'
            ? String(parsedValue)
            : parsedValue;
      }
    }
  }

  // Create dynamic getter if needed
  let dynamicGetter: ((props: any) => Record<string, any>) | null = null;

  if (dynamicProps.length > 0) {
    dynamicGetter = (props: any) => {
      const result: Record<string, any> = {};
      for (const { prop, expr } of dynamicProps) {
        const value = typeof expr === 'function' ? expr(props) : expr;
        result[prop] = value;
      }
      return result;
    };
  }

  return { staticStyles, dynamicGetter };
}
