# kstyled

Runtime and type package for compile-time React Native styling.

```bash
pnpm add kstyled@0.4.0
pnpm add -D babel-plugin-kstyled@0.4.0
```

```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [['babel-plugin-kstyled', { strict: true }]],
};
```

```tsx
import { defineTheme, styled, ThemeProvider } from 'kstyled';

const theme = defineTheme({
  colors: { accent: '#0A7A55', onAccent: '#FFFFFF' },
});

const Button = styled.Pressable<{ $selected?: boolean }>`
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${(p) => (p.$selected ? p.theme.colors.accent : '#E8ECEA')};
`;

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <Button $selected accessibilityRole="button" />
    </ThemeProvider>
  );
}
```

The Babel plugin extracts static declarations, compiles inline `css` templates,
and retains only the dynamic values that must be evaluated at render time.
Transient `$props` are filtered before native props are forwarded.

Full guides and release notes are available in the
[repository](https://github.com/crossplatformkorea/kstyled) and
[documentation](https://crossplatformkorea.github.io/kstyled).
