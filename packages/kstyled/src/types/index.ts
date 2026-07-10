/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
import type { ComponentType, ComponentProps } from 'react';
import type {
  ImageStyle,
  RegisteredStyle,
  TextStyle,
  ViewStyle,
  StyleProp,
} from 'react-native';

/**
 * Union of all React Native style types
 */
export type RNStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Style object that can be used in StyleSheet.create
 * This is a union of all React Native style types
 */
export type StyleObject = ViewStyle & TextStyle & ImageStyle;

/**
 * Compiled style reference injected by Babel plugin
 * Values are native registered styles or React Native Web style objects.
 */
export type CompiledStyle = StyleObject | RegisteredStyle<StyleObject>;

export type CompiledStyles = Record<string, CompiledStyle>;

/**
 * Default theme structure
 * Users can extend this via module augmentation
 */
export interface DefaultTheme {
  colors: Record<string, string>;
  space?: Record<string, number>;
  radii?: Record<string, number>;
  fontSizes?: Record<string, number>;
  fonts?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  theme: DefaultTheme;
}

/**
 * Props that should be filtered out before passing to React Native components
 * All props starting with $ are transient props
 */
export type TransientProps<P = {}> = {
  [K in keyof P as K extends `$${string}` ? K : never]: P[K];
};

/**
 * Props that should be passed to the underlying component
 */
export type ForwardedProps<P = {}> = Omit<P, keyof TransientProps<P>>;

/**
 * Extract attrs props type from component
 */
export type AttrsProps<T> =
  T extends StyledComponent<any, any, infer A> ? A : {};

/**
 * The `as` prop allows changing the component type
 */
export interface AsProp<C extends ComponentType<any> = ComponentType<any>> {
  as?: C;
}

/**
 * Styled component props combine original props + as prop
 * AttrsP represents props provided by .attrs() which become optional
 */
export type StyledComponentProps<
  C extends ComponentType<any>,
  P = {},
  AttrsP = {},
> = Omit<ComponentProps<C>, keyof P | keyof AttrsP> &
  P &
  Partial<AttrsP> &
  AsProp;

/**
 * Interpolation function type
 */
export type Interpolation<P = {}> = (
  props: P & { theme: DefaultTheme }
) => StyleObject | string | number | undefined;

/**
 * Template literal or interpolation array
 */
export type TemplateStringsArray = ReadonlyArray<string>;

/**
 * Style variant configuration
 */
export interface VariantConfig<P = {}> {
  [key: string]: StyleObject | Interpolation<P>;
}

/**
 * Variants configuration object
 */
export interface VariantsConfig<P = {}> {
  [variantName: string]: VariantConfig<P>;
}

/**
 * Attrs function type for setting default props
 */
export type AttrsFunction<P = {}> = (
  props: P & { theme: DefaultTheme }
) => Partial<P>;

/**
 * Styled component with attrs and other methods
 * AttrsP tracks which props were added via .attrs() to make them optional
 */
export type StyledComponent<
  C extends ComponentType<any>,
  P = {},
  AttrsP = {},
> = ComponentType<StyledComponentProps<C, P, AttrsP>> & {
  attrs<NewAttrs extends Record<string, unknown>>(
    attrs: NewAttrs | AttrsFunction<P & Partial<NewAttrs>>
  ): StyledComponent<C, P, AttrsP & NewAttrs>;
};

/**
 * Styled factory for component shortcuts
 */
export interface StyledFactory<C extends ComponentType<any>> {
  <P = {}>(
    strings: TemplateStringsArray,
    ...interpolations: Array<Interpolation<P> | string | number>
  ): StyledComponent<C, P>;
}

/**
 * Main styled function signature with component shortcuts
 */
export interface StyledFunction {
  <C extends ComponentType<any>, P = {}>(
    component: C
  ): (
    strings: TemplateStringsArray,
    ...interpolations: Array<Interpolation<P> | string | number>
  ) => StyledComponent<C, P>;

  // Component shortcuts
  View: StyledFactory<typeof import('react-native').View>;
  Text: StyledFactory<typeof import('react-native').Text>;
  Image: StyledFactory<typeof import('react-native').Image>;
  ImageBackground: StyledFactory<typeof import('react-native').ImageBackground>;
  ActivityIndicator: StyledFactory<
    typeof import('react-native').ActivityIndicator
  >;
  KeyboardAvoidingView: StyledFactory<
    typeof import('react-native').KeyboardAvoidingView
  >;
  ScrollView: StyledFactory<typeof import('react-native').ScrollView>;
  Switch: StyledFactory<typeof import('react-native').Switch>;
  TouchableHighlight: StyledFactory<
    typeof import('react-native').TouchableHighlight
  >;
  TouchableOpacity: StyledFactory<
    typeof import('react-native').TouchableOpacity
  >;
  Pressable: StyledFactory<typeof import('react-native').Pressable>;
  TextInput: StyledFactory<typeof import('react-native').TextInput>;
  SafeAreaView: StyledFactory<typeof import('react-native').SafeAreaView>;
  FlatList: StyledFactory<typeof import('react-native').FlatList>;
  SectionList: StyledFactory<typeof import('react-native').SectionList>;
}

/**
 * Runtime style combiner - merges base styles, variants, and dynamic patches
 */
export interface StyleCombiner {
  (
    compiledStyles: CompiledStyles,
    styleKeys: string[],
    dynamicStyles?: StyleProp<StyleObject>
  ): StyleProp<StyleObject>[];
}

// Re-export types from styled-types for convenience
export type {
  StyleMetadata,
  DynamicPatchFunction,
  PropsWithTheme,
} from './styled-types';
