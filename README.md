# kstyled

[![CI](https://github.com/crossplatformkorea/kstyled/actions/workflows/ci.yml/badge.svg)](https://github.com/crossplatformkorea/kstyled/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/kstyled.svg)](https://www.npmjs.com/package/kstyled)
[![npm downloads](https://img.shields.io/npm/dm/kstyled.svg)](https://www.npmjs.com/package/kstyled)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Compile-time CSS-in-JS for React Native and Expo. kstyled keeps the familiar
styled-components authoring model while extracting static declarations to
`StyleSheet.create` and reducing dynamic templates to small native style
patches.

> `0.4.0` is the current stable release on the `latest` dist-tag. Install the
> runtime and compiler at the same version.

## Install

```bash
pnpm add kstyled@0.4.0
pnpm add -D babel-plugin-kstyled@0.4.0
```

Configure the compiler before plugins that must run last, such as Reanimated:

```js
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['babel-plugin-kstyled', { strict: true }],
    'react-native-reanimated/plugin',
  ],
};
```

`strict: true` makes a failed style transform fail the build instead of quietly
falling back to runtime parsing.

## Use it

```tsx
import { Pressable, Text } from 'react-native';
import { defineTheme, styled, ThemeProvider } from 'kstyled';

const theme = defineTheme({
  colors: {
    accent: '#0A7A55',
    accentPressed: '#075F43',
    textOnAccent: '#FFFFFF',
  },
  space: { md: 12, lg: 16 },
  radii: { control: 8 },
});

const Button = styled(Pressable)<{ $pressed?: boolean }>`
  min-height: 44px;
  padding-vertical: ${(p) => p.theme.space.md}px;
  padding-horizontal: ${(p) => p.theme.space.lg}px;
  border-radius: ${(p) => p.theme.radii.control}px;
  background-color: ${(p) =>
    p.$pressed ? p.theme.colors.accentPressed : p.theme.colors.accent};
`;

const Label = styled.Text`
  color: ${(p) => p.theme.colors.textOnAccent};
  font-size: 15px;
  font-weight: 600;
`;

export function SaveButton() {
  return (
    <ThemeProvider theme={theme}>
      <Button accessibilityRole="button">
        <Label>Save changes</Label>
      </Button>
    </ThemeProvider>
  );
}
```

Props prefixed with `$` are transient: they can drive styles but are not passed
to the underlying native component. Dynamic styles that do not read a theme
also work without a `ThemeProvider`.

Inline `css` templates are compiled even when they are declared inside a
component:

```tsx
import { css } from 'kstyled';

function Status({ active }: { active: boolean }) {
  return (
    <Text
      style={css`
        font-size: 14px;
        color: ${active ? '#0A7A55' : '#687078'};
      `}
    >
      {active ? 'Active' : 'Paused'}
    </Text>
  );
}
```

## 0.4 highlights

- Compiles function-scoped `css` templates to direct native style expressions.
- Preserves `attrs`, `as`, refs, transient props, and styled extension APIs.
- Collapses nested styled wrappers and preserves colliding compiled style keys.
- Supports typed themes with `defineTheme` and `useTheme<typeof theme>()`.
- Emits CJS, ESM, React Native export conditions, declarations, and source maps.
- Includes an API-compatible runtime fallback with one actionable warning.

See the [documentation](https://crossplatformkorea.github.io/kstyled),
[0.4 release notes](https://crossplatformkorea.github.io/kstyled/releases/0.4.0),
[changelog](./CHANGELOG.md), and [example app](./packages/example).

## License

MIT (c) [hyodotdev](https://hyo.dev)
