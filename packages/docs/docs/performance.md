---
sidebar_position: 5
---

# Performance

kstyled optimizes the work it can prove is static and keeps dynamic behavior
explicit. It does not claim a zero-runtime component model: refs, attrs, themes,
transient props, composed components, and prop-based styles still need a small
runtime layer.

## Execution paths

### Static styles

The Babel plugin parses static template declarations at build time and emits a
registered `StyleSheet` reference. Rendering does not parse the CSS template.

```tsx
const Card = styled.View`
  padding: 16px;
  border-radius: 8px;
  background-color: #ffffff;
`;
```

Static components use a dedicated render path that does not subscribe to the
theme context. External `style` values are appended without rebuilding the
compiled style object.

### Dynamic styles

Interpolations that depend on props or themes compile to small style functions:

```tsx
const Card = styled.View<{ $selected?: boolean }>`
  padding: 16px;
  background-color: ${(props) =>
    props.$selected ? props.theme.colors.accent : props.theme.colors.surface};
`;
```

The runtime evaluates only those dynamic declarations. Static declarations in
the same component still use registered styles.

### Runtime fallback

Templates that are not transformed by Babel remain functional through the
runtime parser. This is a compatibility path, not the optimized path. In a
production setup, enable the plugin's `strict` option so unsupported transforms
fail during the build instead of silently falling back.

```js
plugins: [['babel-plugin-kstyled', { strict: true }]];
```

## Practical guidance

- Keep invariant declarations static.
- Use transient props such as `$selected` for style-only values so they are not
  forwarded to native views.
- Define styled components at module scope instead of recreating them during
  render.
- Measure the screen and interaction that matters to your product. Synthetic
  cross-library percentages are not a substitute for application profiling.
- Use the example app's Performance Lab to compare static and dynamic kstyled
  workloads with React Profiler on the same device.

## Reproducing package size

Build the release artifacts and measure the exact files you plan to publish:

```bash
pnpm --filter kstyled build
wc -c packages/kstyled/dist/index.mjs
gzip -c packages/kstyled/dist/index.mjs | wc -c
```

Package size can change with compiler output and dependencies, so release notes
should report measurements from the tagged build rather than a permanent claim.
