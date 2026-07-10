/**
 * kstyled
 *
 * Compile-time CSS-in-JS for React Native
 * Build-time style extraction with StyleSheet performance
 *
 * @packageDocumentation
 */

export { styled, __injectKStyledMetadata } from './styled';
export { css } from './css';
export { ThemeProvider, useTheme, defaultTheme, defineTheme } from './theme';
export type { ThemeProviderProps } from './theme';
export type {
  CompiledStyle,
  DefaultTheme,
  StyledComponent,
  StyledComponentProps,
  CompiledStyles,
  RNStyle,
  StyleObject,
  TransientProps,
  ForwardedProps,
  AsProp,
  Interpolation,
  VariantConfig,
  VariantsConfig,
  AttrsFunction,
  StyledFunction,
  StyledFactory,
} from './types';
export type { CssResult } from './css';
