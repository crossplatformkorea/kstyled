import React, { ComponentType, forwardRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageBackground,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  TouchableHighlight,
  TouchableOpacity,
  Pressable,
  TextInput,
  SafeAreaView,
  FlatList,
  SectionList,
} from 'react-native';
import type { StyledComponent, CompiledStyles, AttrsFunction } from './types';
import type {
  StyleMetadata,
  StyledFactory,
  StyleObject,
  PropsWithTheme,
  StyleValue,
  DynamicPatchFunction,
  AttrsValue,
} from './types/styled-types';
import { useThemeOrDefault } from './theme';
import { parseCSS } from './css-runtime-parser';
import {
  extractBaseMetadata,
  mergeMetadata,
  createStaticStylesArray,
  attachMetadata,
} from './utils/component-metadata';
import {
  buildStyleArray,
  mergeDynamicPatches,
  createCombinedDynamicPatch,
} from './utils/style-merger';
import {
  filterProps,
  hasTransientProps,
  mergeAttrsWithProps,
  combineAttrs,
} from './utils/props-filter';

let didWarnAboutRuntimeFallback = false;

function warnAboutRuntimeFallback(): void {
  if (didWarnAboutRuntimeFallback) {
    return;
  }

  didWarnAboutRuntimeFallback = true;
  console.warn(
    '[kstyled] Runtime parsing is active. Add babel-plugin-kstyled to compile styles at build time.'
  );
}

/**
 * Main styled function
 * Creates styled components with build-time style extraction
 *
 * @example
 * ```tsx
 * const Button = styled(Pressable)`
 *   padding: 16px;
 *   background-color: ${p => p.theme.colors.primary};
 * `;
 *
 * // With typed props:
 * const Card = styled<typeof View, { $active?: boolean }>(View)`
 *   background-color: ${p => p.$active ? 'blue' : 'white'};
 * `;
 * ```
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
function styledFunction<C extends ComponentType<any>, P = {}, AttrsP = {}>(
  BaseComponent: C,
  baseAttrs?: AttrsP
): StyledFactory<C, P, AttrsP> {
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
  /**
   * Create the actual styled component from metadata
   */
  function createStyledComponent<CurrentAttrsP = AttrsP>(
    metadata: StyleMetadata = {}
  ): StyledComponent<C, P, CurrentAttrsP> {
    const { compiledStyles, styleKeys, getDynamicPatch, attrs } = metadata;

    // Extract base component's metadata (handles Animated components)
    const baseMetadata = extractBaseMetadata(BaseComponent);
    const combinedAttrs = combineAttrs(baseMetadata.attrs, attrs);
    const hasAttrs = Boolean(combinedAttrs);
    const hasDynamicStyles = Boolean(
      baseMetadata.getDynamicPatch || getDynamicPatch
    );
    const targetComponent = baseMetadata.target || BaseComponent;

    // Merge parent and child styles
    const { mergedCompiledStyles, mergedStyleKeys } = mergeMetadata(
      baseMetadata,
      { compiledStyles, styleKeys }
    );

    // Pre-compute static styles array ONCE at component creation time
    const staticStylesArray = createStaticStylesArray(
      mergedCompiledStyles,
      mergedStyleKeys
    );

    const renderStatic = (props: Record<string, unknown>, ref: unknown) => {
      const externalStyle = props.style as StyleValue;
      const finalStyle = externalStyle
        ? buildStyleArray(
            mergedCompiledStyles,
            mergedStyleKeys,
            null,
            externalStyle
          )
        : staticStylesArray;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Component = (props.as || targetComponent) as ComponentType<any>;
      const needsPropFiltering =
        hasTransientProps(props) ||
        Boolean(props.as) ||
        Object.prototype.hasOwnProperty.call(props, 'theme');

      if (!needsPropFiltering) {
        return <Component {...props} ref={ref} style={finalStyle} />;
      }

      const forwardedProps = filterProps(props, ref);
      forwardedProps.style = finalStyle;
      return <Component {...forwardedProps} />;
    };

    const renderDynamic = (props: Record<string, unknown>, ref: unknown) => {
      const { as: asProp, style: externalStyle, ...restProps } = props;
      const theme = useThemeOrDefault();

      // Build final props with theme
      const propsWithTheme: PropsWithTheme = { ...restProps, theme };
      const propsWithAttrs = mergeAttrsWithProps(combinedAttrs, propsWithTheme);

      // Compute and merge dynamic patches
      const dynamicPatch = mergeDynamicPatches(
        baseMetadata,
        getDynamicPatch,
        propsWithAttrs
      );

      const attrsStyle = propsWithAttrs.style as StyleValue;
      const resolvedExternalStyle = attrsStyle
        ? ([attrsStyle, externalStyle] as StyleValue)
        : (externalStyle as StyleValue);

      // Build style array with correct priority:
      // 1. Static compiled styles (lowest)
      // 2. Dynamic patch
      // 3. External inline styles (highest - ensures override)
      const styles = buildStyleArray(
        mergedCompiledStyles,
        mergedStyleKeys,
        dynamicPatch,
        resolvedExternalStyle
      );

      // Filter props and add styles
      const forwardedProps = filterProps(propsWithAttrs, ref);
      forwardedProps.style = styles;

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const Component = (asProp ||
        (propsWithAttrs.as as ComponentType<any>) ||
        targetComponent) as ComponentType<any>;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      return <Component {...forwardedProps} />;
    };

    // The branch is fixed when the component is created, so every component
    // has a stable Hook order across renders.
    const StyledComponent =
      hasDynamicStyles || hasAttrs
        ? forwardRef<unknown, Record<string, unknown>>(renderDynamic)
        : forwardRef<unknown, Record<string, unknown>>(renderStatic);

    // Set display name
    StyledComponent.displayName = `Styled(${
      BaseComponent.displayName || BaseComponent.name || 'Component'
    })`;

    // Add attrs method and metadata to the component
    type ComponentWithMethods = typeof StyledComponent & {
      attrs: <NewAttrs extends Record<string, unknown>>(
        attrsArg: NewAttrs | AttrsFunction<P & Partial<NewAttrs>>
      ) => StyledComponent<C, P, CurrentAttrsP & NewAttrs>;
      __kstyled_metadata__?: StyleMetadata;
    };

    const StyledWithMethods = StyledComponent as ComponentWithMethods;

    StyledWithMethods.attrs = function <
      NewAttrs extends Record<string, unknown>,
    >(
      attrsArg: NewAttrs | AttrsFunction<P & Partial<NewAttrs>>
    ): StyledComponent<C, P, CurrentAttrsP & NewAttrs> {
      return createStyledComponent<CurrentAttrsP & NewAttrs>({
        ...metadata,
        attrs: combineAttrs(metadata.attrs, attrsArg as AttrsValue),
      });
    };

    // Store merged metadata for inheritance
    const combinedGetDynamicPatch = createCombinedDynamicPatch(
      baseMetadata,
      getDynamicPatch
    );

    attachMetadata(StyledWithMethods, {
      compiledStyles: mergedCompiledStyles,
      styleKeys: mergedStyleKeys,
      getDynamicPatch: combinedGetDynamicPatch,
      attrs: combinedAttrs,
      target: targetComponent,
    });

    return StyledWithMethods as StyledComponent<C, P, CurrentAttrsP>;
  }

  /**
   * Factory function returned by styled()
   * Handles runtime fallback when Babel plugin is not available
   */
  const factory = function (
    strings: TemplateStringsArray,
    ...interpolations: Array<
      | string
      | number
      | ((props: Record<string, unknown>) => StyleObject | string | number)
    >
  ): StyledComponent<C, P, AttrsP> {
    // Runtime fallback: parse template literal at runtime
    warnAboutRuntimeFallback();

    // Parse CSS at runtime
    const { staticStyles, dynamicGetter } = parseCSS(strings, interpolations);

    // Create StyleSheet from static styles
    const compiledStyles =
      Object.keys(staticStyles).length > 0
        ? (StyleSheet.create({
            base: staticStyles,
          }) as unknown as CompiledStyles)
        : undefined;

    // Create metadata
    const metadata: StyleMetadata = {
      compiledStyles,
      styleKeys: compiledStyles ? ['base'] : undefined,
      getDynamicPatch: dynamicGetter as DynamicPatchFunction | undefined,
      attrs: baseAttrs as AttrsValue,
    };

    return createStyledComponent<AttrsP>(metadata);
  };

  /**
   * Method called by Babel plugin
   */
  factory.__withStyles = function (
    metadata: StyleMetadata
  ): StyledComponent<C, P, AttrsP> {
    const mergedAttrs = combineAttrs(
      baseAttrs as AttrsValue | undefined,
      metadata.attrs
    );
    return createStyledComponent<AttrsP>({ ...metadata, attrs: mergedAttrs });
  };

  /**
   * Method to add default attributes before template literal
   */
  factory.attrs = function <NewAttrs extends Record<string, unknown>>(
    attrsArg: NewAttrs | AttrsFunction<P & Partial<NewAttrs>>
  ): StyledFactory<C, P, AttrsP & NewAttrs> {
    return styledFunction<C, P, AttrsP & NewAttrs>(
      BaseComponent,
      combineAttrs(
        baseAttrs as AttrsValue | undefined,
        attrsArg as AttrsValue
      ) as AttrsP & NewAttrs
    );
  };

  return factory as StyledFactory<C, P, AttrsP>;
}

/**
 * @deprecated Use styled(Component).__withStyles() instead
 * This is kept for backward compatibility with old Babel plugin
 */
export function __injectKStyledMetadata(
  component: ComponentType<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _metadata: StyleMetadata
): ComponentType<unknown> {
  console.warn(
    '[kstyled] __injectKStyledMetadata is deprecated. Please update babel-plugin-kstyled.'
  );
  return component;
}

// Add styled.View, styled.Text, etc. shortcuts and export

type StyledShortcuts = {
  View: ReturnType<typeof styledFunction<typeof View>>;
  Text: ReturnType<typeof styledFunction<typeof Text>>;
  Image: ReturnType<typeof styledFunction<typeof Image>>;
  ImageBackground: ReturnType<typeof styledFunction<typeof ImageBackground>>;
  ActivityIndicator: ReturnType<
    typeof styledFunction<typeof ActivityIndicator>
  >;
  KeyboardAvoidingView: ReturnType<
    typeof styledFunction<typeof KeyboardAvoidingView>
  >;
  ScrollView: ReturnType<typeof styledFunction<typeof ScrollView>>;
  Switch: ReturnType<typeof styledFunction<typeof Switch>>;
  TouchableHighlight: ReturnType<
    typeof styledFunction<typeof TouchableHighlight>
  >;
  TouchableOpacity: ReturnType<typeof styledFunction<typeof TouchableOpacity>>;
  Pressable: ReturnType<typeof styledFunction<typeof Pressable>>;
  TextInput: ReturnType<typeof styledFunction<typeof TextInput>>;
  SafeAreaView: ReturnType<typeof styledFunction<typeof SafeAreaView>>;
  FlatList: ReturnType<typeof styledFunction<typeof FlatList>>;
  SectionList: ReturnType<typeof styledFunction<typeof SectionList>>;
};

// Lazy initialization of styled shortcuts to avoid importing
// FlatList/SectionList at module load time (prevents Platform.OS issues in tests)
const styledShortcuts: Partial<StyledShortcuts> = {};

// Create the styled object with lazy getters using defineProperty
export const styled = styledFunction as typeof styledFunction & StyledShortcuts;

// Define lazy getters for each component to avoid eager module loading
Object.defineProperty(styled, 'View', {
  get() {
    return (
      styledShortcuts.View || (styledShortcuts.View = styledFunction(View))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'Text', {
  get() {
    return (
      styledShortcuts.Text || (styledShortcuts.Text = styledFunction(Text))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'Image', {
  get() {
    return (
      styledShortcuts.Image || (styledShortcuts.Image = styledFunction(Image))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'ImageBackground', {
  get() {
    return (
      styledShortcuts.ImageBackground ||
      (styledShortcuts.ImageBackground = styledFunction(ImageBackground))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'ActivityIndicator', {
  get() {
    return (
      styledShortcuts.ActivityIndicator ||
      (styledShortcuts.ActivityIndicator = styledFunction(ActivityIndicator))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'KeyboardAvoidingView', {
  get() {
    return (
      styledShortcuts.KeyboardAvoidingView ||
      (styledShortcuts.KeyboardAvoidingView =
        styledFunction(KeyboardAvoidingView))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'ScrollView', {
  get() {
    return (
      styledShortcuts.ScrollView ||
      (styledShortcuts.ScrollView = styledFunction(ScrollView))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'Switch', {
  get() {
    return (
      styledShortcuts.Switch ||
      (styledShortcuts.Switch = styledFunction(Switch))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'TouchableHighlight', {
  get() {
    return (
      styledShortcuts.TouchableHighlight ||
      (styledShortcuts.TouchableHighlight = styledFunction(TouchableHighlight))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'TouchableOpacity', {
  get() {
    return (
      styledShortcuts.TouchableOpacity ||
      (styledShortcuts.TouchableOpacity = styledFunction(TouchableOpacity))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'Pressable', {
  get() {
    return (
      styledShortcuts.Pressable ||
      (styledShortcuts.Pressable = styledFunction(Pressable))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'TextInput', {
  get() {
    return (
      styledShortcuts.TextInput ||
      (styledShortcuts.TextInput = styledFunction(TextInput))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'SafeAreaView', {
  get() {
    return (
      styledShortcuts.SafeAreaView ||
      (styledShortcuts.SafeAreaView = styledFunction(SafeAreaView))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'FlatList', {
  get() {
    return (
      styledShortcuts.FlatList ||
      (styledShortcuts.FlatList = styledFunction(FlatList))
    );
  },
  enumerable: true,
  configurable: true,
});
Object.defineProperty(styled, 'SectionList', {
  get() {
    return (
      styledShortcuts.SectionList ||
      (styledShortcuts.SectionList = styledFunction(SectionList))
    );
  },
  enumerable: true,
  configurable: true,
});
