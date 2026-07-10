---
sidebar_position: 1
---

# Styling

## Static styles

Static styles are extracted at compile time and converted to `StyleSheet.create()`:

```tsx
const Box = styled.View`
  width: 100px;
  height: 100px;
  background-color: #007aff;
  border-radius: 8px;
`;

// Compiles to:
const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
});
```

This is the most efficient path: CSS parsing happens during compilation and the
component reuses a registered native style at runtime.

## Units

### Pixel values

Numbers without units are treated as `dp` (density-independent pixels):

```tsx
const Box = styled.View`
  width: 100px; // 100 dp
  height: 50px; // 50 dp
  padding: 16px; // 16 dp
`;
```

### Percentage values

Use percentages for responsive layouts:

```tsx
const Container = styled.View`
  width: 100%;
  padding: 5%;
`;
```

## Layout

### Flexbox

React Native uses Flexbox by default:

```tsx
const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Column = styled.View`
  flex-direction: column;
  flex: 1;
`;
```

### Positioning

```tsx
const Absolute = styled.View`
  position: absolute;
  top: 0;
  right: 0;
`;

const Relative = styled.View`
  position: relative;
  z-index: 10;
`;
```

## Shadows

### iOS shadows

```tsx
const Card = styled.View`
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
`;
```

### Android elevation

```tsx
const Card = styled.View`
  elevation: 5;
`;
```

### Cross-platform

Combine both for consistent appearance:

```tsx
const Card = styled.View`
  background-color: white;
  border-radius: 8px;

  /* iOS */
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 8px;

  /* Android */
  elevation: 3;
`;
```

## Text styling

```tsx
const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #000;
  text-align: center;
`;

const Body = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: #666;
`;
```

## Supported properties

kstyled supports **all React Native style properties** including:

- **[ViewStyle](https://reactnative.dev/docs/view-style-props)** - All view styling properties (borders, shadows, layout, etc.)
- **[TextStyle](https://reactnative.dev/docs/text-style-props)** - All text styling properties (fonts, colors, decorations, etc.)
- **[ImageStyle](https://reactnative.dev/docs/image-style-props)** - All image styling properties (resize modes, tint, etc.)
- **New Architecture features** - boxShadow, filter, outline properties

Properties can be written in either CSS kebab-case or React Native camelCase:

```tsx
// Both work identically
const Box = styled.View`
  background-color: #fff; /* kebab-case */
  backgroundcolor: #fff; /* camelCase */
`;
```

For a complete reference of all supported properties, see the official [React Native Style documentation](https://reactnative.dev/docs/style).
