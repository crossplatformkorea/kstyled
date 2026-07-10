---
sidebar_position: 1
---

# kstyled

> Compile-time CSS-in-JS for React Native

**kstyled** is a compile-time CSS-in-JS library specifically designed for [React Native](https://reactnative.dev) that transforms [styled-components](https://styled-components.com/) syntax into native `StyleSheet.create()` calls at build time.

## Why kstyled?

<img src="/kstyled/img/k-dev.png" alt="K-Dev Demon Styles" style={{ maxWidth: '600px', margin: '20px auto', display: 'block' }} />

Traditional CSS-in-JS libraries like styled-components and emotion parse and compute styles at runtime. kstyled moves this work to compile time using Babel, resulting in:

- **Predictable runtime work** - Static declarations become registered StyleSheet entries
- **Familiar API** - Use the styled-components syntax you already know
- **More flexible syntax** - Supports `${16}px`, `${'16px'}`, and `${16}` (unlike styled-components/emotion)
- **Type safety** - Full TypeScript support with prop inference
- **Small runtime** - Dynamic props, themes, attrs, and refs stay composable
- **Build-time validation** - Catch CSS errors during compilation

## How it works

```tsx
// You write this:
const Button = styled.Pressable<{ $primary?: boolean }>`
  padding: 16px;
  background-color: ${(p) => (p.$primary ? '#007AFF' : '#ccc')};
  border-radius: 8px;
`;

// Babel transforms it to:
const Button = createStyledComponent(
  Pressable,
  StyleSheet.create({ static: { padding: 16, borderRadius: 8 } }),
  (props) => ({ backgroundColor: props.$primary ? '#007AFF' : '#ccc' })
);
```

Static styles are extracted at compile time, while dynamic prop-based styles remain as minimal runtime functions.

## Quick comparison

| Feature                           | kstyled                         | styled-components | emotion          |
| --------------------------------- | ------------------------------- | ----------------- | ---------------- |
| Static CSS parsing at render time | None                            | Yes               | Yes              |
| Build-time CSS validation         | ✅                              | ❌                | ⚠️ (with plugin) |
| StyleSheet.create                 | ✅                              | ❌                | ❌               |
| Flexible unit syntax              | `${16}px`, `${'16px'}`, `${16}` | `${16}` only      | `${16}px` only   |
| API familiarity                   | styled-components               | ✅                | Similar          |

## Next steps

- [Installation](./getting-started/installation) - Set up kstyled in your project
- [Basic Usage](./getting-started/basic-usage) - Write your first styled component
- [Performance](./performance) - Understand the compilation and runtime paths
