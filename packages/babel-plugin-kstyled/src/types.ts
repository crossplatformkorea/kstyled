/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Plugin options
 */
export interface PluginOptions {
  /**
   * Reserved for backward compatibility.
   * @deprecated Inline css templates are compiled automatically.
   */
  autoHoist?: boolean;

  /**
   * Custom import name for styled function
   * @default 'kstyled'
   */
  importName?: string;

  /**
   * Reserved for backward compatibility.
   * @deprecated Use React Native's Platform API for platform-specific values.
   */
  platformStyles?: boolean;

  /**
   * Enable debug mode (adds comments in output)
   * @default false
   */
  debug?: boolean;

  /**
   * Reserved for backward compatibility.
   * @deprecated Static components now use the API-compatible runtime fast path.
   */
  optimizeStatic?: boolean;

  /**
   * Fail the build when a kstyled template cannot be compiled.
   * @default false
   */
  strict?: boolean;
}

/**
 * Parsed CSS property
 */
export interface CSSProperty {
  property: string;
  value: string;
  isDynamic: boolean;
  isConditional: boolean;
}

/**
 * Parsed style rule
 */
export interface StyleRule {
  static: Record<string, any>;
  dynamic: Array<{
    condition?: string;
    properties: Record<string, any>;
  }>;
}

/**
 * Transform result
 */
export interface TransformResult {
  staticStyles: Record<string, any>;
  dynamicPatchFn?: string;
  styleKeys: string[];
}
