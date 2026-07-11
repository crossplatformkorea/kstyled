import type {
  StyleMetadata,
  StyleArray,
  StyleValue,
  StyleObject,
  PropsWithTheme,
  DynamicPatchFunction,
} from '../types/styled-types';
import type { CompiledStyles } from '../types';
import {
  normalizeStyleDeclaration,
  normalizeStyleProperty,
  normalizeStyleValue,
} from '../css-runtime-parser';

type StyleValueLike = StyleValue | ReadonlyArray<StyleValueLike>;

/**
 * Expand shorthand padding/margin properties to longhand
 * This is necessary because base styles use longhand properties (paddingTop, paddingRight, etc.)
 * and React Native gives longhand higher priority than shorthand (paddingHorizontal/paddingVertical)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expandShorthandProperties(styleObj: any): any {
  if (!styleObj || typeof styleObj !== 'object') {
    return styleObj;
  }

  let hasShorthand = false;
  for (const key in styleObj) {
    if (
      key === 'padding' ||
      key === 'margin' ||
      key === 'paddingHorizontal' ||
      key === 'paddingVertical' ||
      key === 'marginHorizontal' ||
      key === 'marginVertical'
    ) {
      hasShorthand = true;
      break;
    }
  }

  if (!hasShorthand) {
    return styleObj;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};

  for (const key in styleObj) {
    if (Object.prototype.hasOwnProperty.call(styleObj, key)) {
      const value = styleObj[key];

      // Expand padding shorthand to all four sides
      if (key === 'padding') {
        Object.assign(result, normalizeStyleDeclaration(key, value));
      }
      // Expand margin shorthand to all four sides
      else if (key === 'margin') {
        Object.assign(result, normalizeStyleDeclaration(key, value));
      }
      // Expand paddingHorizontal to paddingLeft + paddingRight
      else if (key === 'paddingHorizontal') {
        result.paddingLeft = value;
        result.paddingRight = value;
      }
      // Expand paddingVertical to paddingTop + paddingBottom
      else if (key === 'paddingVertical') {
        result.paddingTop = value;
        result.paddingBottom = value;
      }
      // Expand marginHorizontal to marginLeft + marginRight
      else if (key === 'marginHorizontal') {
        result.marginLeft = value;
        result.marginRight = value;
      }
      // Expand marginVertical to marginTop + marginBottom
      else if (key === 'marginVertical') {
        result.marginTop = value;
        result.marginBottom = value;
      }
      // Keep all other properties as-is
      else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Build style array with correct priority order:
 * 1. Compiled static styles (lowest priority)
 * 2. Dynamic patch styles
 * 3. External styles (highest priority)
 */
export function buildStyleArray(
  compiledStyles: CompiledStyles | undefined,
  styleKeys: string[] | undefined,
  dynamicPatch: StyleObject | null,
  externalStyle: StyleValue
): StyleArray {
  const styles: StyleArray = [];

  // Add compiled static styles first (pre-created by StyleSheet.create)
  if (compiledStyles && styleKeys) {
    for (let i = 0; i < styleKeys.length; i++) {
      styles.push(compiledStyles[styleKeys[i]]);
    }
  }

  // Add dynamic patch
  if (dynamicPatch) {
    styles.push(dynamicPatch);
  }

  // Add external styles last (highest priority)
  // IMPORTANT: Expand shorthand properties to match base style specificity
  const pushExternalStyle = (styleValue: StyleValueLike): void => {
    if (!styleValue) {
      return;
    }

    if (Array.isArray(styleValue)) {
      for (const nestedStyle of styleValue) {
        pushExternalStyle(nestedStyle);
      }
      return;
    }

    // Expand shorthand properties for proper override
    const expanded = expandShorthandProperties(styleValue);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    styles.push(expanded as any);
  };

  pushExternalStyle(externalStyle);

  return styles;
}

/**
 * Normalize all values in a style object
 * Converts string values like '16px' to numbers
 * Handles nested transform arrays
 */
function normalizeStyleObject(
  styleObj: StyleObject | null
): StyleObject | null {
  if (!styleObj) return null;

  const source = styleObj as unknown as Record<string, unknown>;
  let normalized: StyleObject | undefined;
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];

      // Handle transform array specially
      if (key === 'transform' && Array.isArray(value)) {
        let normalizedTransforms: unknown[] | undefined;
        value.forEach((transformObj: unknown, index: number) => {
          if (typeof transformObj === 'object' && transformObj !== null) {
            const transformRecord = transformObj as Record<string, unknown>;
            let normalizedTransform: Record<string, unknown> | undefined;
            for (const transformKey in transformRecord) {
              if (
                Object.prototype.hasOwnProperty.call(
                  transformRecord,
                  transformKey
                )
              ) {
                const transformValue = transformRecord[transformKey];
                const nextValue = normalizeStyleValue(transformValue);
                if (nextValue !== transformValue) {
                  normalizedTransform ||= { ...transformRecord };
                  normalizedTransform[transformKey] = nextValue;
                }
              }
            }

            if (normalizedTransform) {
              normalizedTransforms ||= [...value];
              normalizedTransforms[index] = normalizedTransform;
            }
          }
        });

        if (normalizedTransforms) {
          normalized ||= { ...styleObj };
          (normalized as unknown as Record<string, unknown>)[key] =
            normalizedTransforms;
        }
      } else {
        const normalizedValue = normalizeStyleProperty(key, value);
        if (normalizedValue !== value) {
          normalized ||= { ...styleObj };
          (normalized as unknown as Record<string, unknown>)[key] =
            normalizedValue;
        }
      }
    }
  }
  return expandShorthandProperties(normalized || styleObj);
}

/**
 * Merge dynamic patches from parent and child components
 * Child patches override parent patches for the same properties
 * Also normalizes string values with units (e.g., '16px' -> 16)
 */
export function mergeDynamicPatches(
  baseMetadata: StyleMetadata,
  getDynamicPatch: DynamicPatchFunction | undefined,
  mergedProps: PropsWithTheme
): StyleObject | null {
  const baseDynamicPatch = baseMetadata.getDynamicPatch
    ? baseMetadata.getDynamicPatch(mergedProps)
    : null;

  const childDynamicPatch = getDynamicPatch
    ? getDynamicPatch(mergedProps)
    : null;

  // Merge dynamic patches (child overrides parent)
  if (!baseDynamicPatch && !childDynamicPatch) {
    return null;
  }

  if (!baseDynamicPatch) {
    return normalizeStyleObject(childDynamicPatch);
  }

  if (!childDynamicPatch) {
    return normalizeStyleObject(baseDynamicPatch);
  }

  // Normalize all values in the merged patch
  return normalizeStyleObject({ ...baseDynamicPatch, ...childDynamicPatch });
}

/**
 * Create combined getDynamicPatch function for metadata inheritance
 */
export function createCombinedDynamicPatch(
  baseMetadata: StyleMetadata,
  getDynamicPatch: DynamicPatchFunction | undefined
): DynamicPatchFunction | undefined {
  if (!baseMetadata.getDynamicPatch && !getDynamicPatch) {
    return undefined;
  }

  if (!baseMetadata.getDynamicPatch) {
    return getDynamicPatch;
  }

  if (!getDynamicPatch) {
    return baseMetadata.getDynamicPatch;
  }

  return (props: PropsWithTheme) => {
    const basePatch = baseMetadata.getDynamicPatch!(props);
    const childPatch = getDynamicPatch(props);

    return basePatch || childPatch ? { ...basePatch, ...childPatch } : null;
  };
}
