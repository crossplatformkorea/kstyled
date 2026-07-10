import type { ComponentType } from 'react';
import type {
  ComponentWithMetadata,
  StyleMetadata,
  StyleValue,
} from '../types/styled-types';
import type { CompiledStyles } from '../types';

/**
 * Type for React internal component representations
 * Covers forwardRef, memo, and other wrapper types
 */
type ReactInternalComponent = {
  $$typeof?: symbol;
  render?: unknown;
  type?: unknown;
} & Partial<ComponentWithMetadata>;

/**
 * Type guard to check if component is a React internal component
 */
function isReactInternalComponent(
  component: unknown
): component is ReactInternalComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    ('$$typeof' in component || 'render' in component || 'type' in component)
  );
}

/**
 * Check if a component is an Animated component
 * Animated components are frozen objects
 */
export function isAnimatedComponent(
  component: ComponentType<unknown>
): boolean {
  return Object.isFrozen(component);
}

/**
 * Recursively extract metadata from a component
 * Helper function to traverse through React wrappers
 */
function extractMetadataRecursive(
  component: unknown,
  depth: number = 0,
  maxDepth: number = 5
): StyleMetadata {
  // Prevent infinite recursion
  if (depth > maxDepth || !component) {
    return {};
  }

  // Check if component has metadata directly (works for objects and functions)
  if (
    component !== null &&
    (typeof component === 'object' || typeof component === 'function') &&
    '__kstyled_metadata__' in component
  ) {
    return (component as ComponentWithMetadata).__kstyled_metadata__ || {};
  }

  // Only proceed if it's a React internal component
  if (!isReactInternalComponent(component)) {
    return {};
  }

  // Check if it's a forwardRef component (has $$typeof and render)
  if (component.$$typeof && component.render) {
    const renderFunc = component.render;
    if (
      typeof renderFunc === 'object' &&
      renderFunc !== null &&
      '__kstyled_metadata__' in renderFunc
    ) {
      return (renderFunc as ComponentWithMetadata).__kstyled_metadata__ || {};
    }
    // Recursively check the render function
    return extractMetadataRecursive(renderFunc, depth + 1, maxDepth);
  }

  // Check if it's a React.memo component (has $$typeof and type)
  if (component.$$typeof && component.type) {
    const wrappedComponent = component.type;
    // Recursively check the wrapped component
    return extractMetadataRecursive(wrappedComponent, depth + 1, maxDepth);
  }

  return {};
}

/**
 * Extract metadata from a base component
 * Returns empty object for Animated components or if no metadata exists
 *
 * This function handles various component types:
 * - Direct styled components with __kstyled_metadata__
 * - forwardRef wrapped styled components
 * - React.memo wrapped styled components
 * - Nested wrappers (e.g., React.memo(forwardRef(...)))
 * - Components that expose metadata from their internal styled components
 */
export function extractBaseMetadata(
  baseComponent: ComponentType<unknown>
): StyleMetadata {
  return extractMetadataRecursive(baseComponent);
}

/**
 * Merge parent and child metadata
 */
export function mergeMetadata(
  baseMetadata: StyleMetadata,
  childMetadata: Partial<StyleMetadata>
): {
  mergedCompiledStyles: CompiledStyles;
  mergedStyleKeys: string[];
} {
  const mergedCompiledStyles = {
    ...(baseMetadata.compiledStyles || {}),
  } as CompiledStyles;
  const mergedStyleKeys = [...(baseMetadata.styleKeys || [])];
  const childStyles = childMetadata.compiledStyles;

  for (const childKey of childMetadata.styleKeys || []) {
    if (
      !childStyles ||
      !Object.prototype.hasOwnProperty.call(childStyles, childKey)
    ) {
      continue;
    }

    let mergedKey = childKey;
    let suffix = 1;
    while (
      Object.prototype.hasOwnProperty.call(mergedCompiledStyles, mergedKey)
    ) {
      mergedKey = `${childKey}__${suffix++}`;
    }

    mergedCompiledStyles[mergedKey] = childStyles[childKey];
    mergedStyleKeys.push(mergedKey);
  }

  return { mergedCompiledStyles, mergedStyleKeys };
}

/**
 * Create static styles array from compiled styles
 * Returns undefined if no styles exist
 */
export function createStaticStylesArray(
  compiledStyles: CompiledStyles | undefined,
  styleKeys: string[]
): StyleValue {
  if (!compiledStyles || styleKeys.length === 0) {
    return undefined;
  }

  if (styleKeys.length === 1) {
    return compiledStyles[styleKeys[0]];
  }

  return styleKeys.map((key) => compiledStyles[key]);
}

/**
 * Attach metadata to a styled component
 * Skips for Animated components (frozen objects)
 */
export function attachMetadata(
  component: ComponentWithMetadata,
  metadata: StyleMetadata
): void {
  try {
    component.__kstyled_metadata__ = metadata;
  } catch (e) {
    // Ignore if we can't set metadata (e.g., on frozen objects)
    console.warn('[kstyled] Could not set metadata on component:', e);
  }
}
