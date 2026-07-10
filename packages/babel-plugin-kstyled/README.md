# babel-plugin-kstyled

Compile `kstyled` and inline `css` templates to React Native style expressions.

```bash
pnpm add -D babel-plugin-kstyled@beta
```

```js
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'babel-plugin-kstyled',
      {
        strict: true,
        debug: false,
        importName: 'kstyled',
      },
    ],
  ],
};
```

## Output

```tsx
const Button = styled(Pressable)`
  min-height: 44px;
  background-color: ${(p) => (p.$active ? '#0A7A55' : '#687078')};
`;
```

is reduced to the equivalent of:

```tsx
const __ks0 = StyleSheet.create({
  base: { minHeight: 44 },
});

const Button = styled(Pressable).__withStyles({
  compiledStyles: __ks0,
  styleKeys: ['base'],
  getDynamicPatch: (p) => ({
    backgroundColor: p.$active ? '#0A7A55' : '#687078',
  }),
});
```

Function-scoped `css` templates compile directly to a registered static style,
a dynamic object, or an array containing both. They do not invoke the runtime
CSS parser when the plugin is configured.

## Options

- `strict`: fail the build when a matched template cannot be compiled.
- `debug`: print compiler diagnostics.
- `importName`: compile imports from a package alias instead of `kstyled`.

Full documentation is available at
[crossplatformkorea.github.io/kstyled](https://crossplatformkorea.github.io/kstyled).
