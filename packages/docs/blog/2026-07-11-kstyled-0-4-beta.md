---
slug: kstyled-0-4-beta
title: kstyled 0.4 beta moves styling work out of render
description: The first kstyled 0.4 beta strengthens compile-time output, composition, typed themes, and package interoperability.
tags: [release, react-native, performance]
---

kstyled 0.4 starts with a narrow goal: keep the styled authoring model while
making the generated React Native code easier to predict, inspect, and ship.

`0.4.0-beta.1` is now the validation release for that work. The stable
`latest` tag stays on `0.3.8`, so teams can adopt the beta screen by screen
without changing the default installation for everyone else.

<!-- truncate -->

## A compiler contract developers can rely on

Static declarations belong in `StyleSheet.create()`. Values that depend on
props or themes should remain small runtime expressions. The 0.4 compiler makes
that boundary explicit for styled components and function-scoped `css`
templates.

Strict mode turns that contract into a CI check:

```js
['babel-plugin-kstyled', { strict: true }];
```

When a matched template cannot be transformed, the build fails with compiler
context instead of quietly changing its performance characteristics.

## Composition without wrapper debt

Real component libraries extend styles, add `attrs`, forward refs, switch the
render target with `as`, and pass external styles. The beta preserves those
behaviors while collapsing nested styled wrappers back to the original target.

The runtime also avoids avoidable allocation in common paths: a single
compiled style remains a single reference, normalized dynamic objects are
reused, and external styles are not cloned when no shorthand expansion is
needed.

## Better boundaries for library authors

`defineTheme` and generic `useTheme` improve theme inference without requiring
global type augmentation. Explicit CJS, ESM, and React Native export conditions
make package resolution less dependent on bundler heuristics. Source maps and
matching declarations ship with both the runtime and compiler packages.

These are not headline APIs, but they are the details that determine whether a
styling package behaves consistently in an application, a component library,
and a test runner.

## Try the beta

Install both packages at the same version:

```bash
pnpm add kstyled@0.4.0-beta.1
pnpm add -D babel-plugin-kstyled@0.4.0-beta.1
```

Then validate production builds and representative screens on iOS, Android,
and web. The
[full release notes](/releases/0.4.0-beta.1) include migration guidance and a
practical validation checklist.
