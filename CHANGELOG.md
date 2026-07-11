# Changelog

All notable changes to this project are documented in this file.

## 0.4.1 - 2026-07-11

### Fixed

- Expand runtime-computed `padding` and `margin` values such as
  `"12px 24px"` into React Native longhand properties.
- Compile dynamic box shorthands used by function-scoped `css` templates
  without passing unsupported multi-value strings to Fabric.
- Apply the same shorthand normalization to styled-component dynamic patches,
  runtime fallback styles, and externally merged style objects.

See the [patch release notes](./packages/docs/docs/releases/0.4.1.md) for the
affected authoring patterns and upgrade guidance.

## 0.4.0 - 2026-07-11

### Upgrade

Install the runtime and compiler at the same version.

```bash
pnpm add kstyled@0.4.0
pnpm add -D babel-plugin-kstyled@0.4.0
```

### Added

- Compile function-scoped `css` templates to native style expressions.
- Add `strict` compiler mode for build-time transform failures.
- Add `defineTheme` and generic `useTheme` typing.
- Add ActivityIndicator, KeyboardAvoidingView, Switch, and
  TouchableHighlight styled shortcuts.
- Publish package export maps, source maps, and provenance from CI.

### Fixed

- Keep Hook ordering stable when an external `style` prop changes.
- Preserve parent dynamic styles when extending a styled component.
- Prevent compiled style key collisions across nested styled components.
- Collapse nested styled wrappers to the original render target.
- Preserve chained factory and component `attrs` values.
- Compile shortcut `attrs` syntax such as `styled.TextInput.attrs(...)`.
- Serialize transform arrays and shadow-offset objects correctly.
- Normalize compiler-emitted numeric strings before they reach React Native
  Fabric, including nested transform and offset values.

### Performance

- Reuse single compiled style references instead of wrapping them in arrays.
- Avoid cloning external styles when no shorthand expansion is needed.
- Avoid cloning already-normalized dynamic style objects.
- Remove stack-trace collection from the normal runtime fallback path.

### Compatibility

- Resolve React Native and CommonJS consumers to the CJS build while ESM
  consumers receive matching `.mjs` declarations.
- `optimizeStatic`, `autoHoist`, and `platformStyles` remain accepted as
  deprecated configuration keys. Static components now use the
  API-compatible runtime fast path.

See the [full release notes](./packages/docs/docs/releases/0.4.0.md)
for migration guidance and the beta validation checklist.
