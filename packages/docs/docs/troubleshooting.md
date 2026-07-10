---
sidebar_position: 6
---

# Troubleshooting

Common issues and solutions when using kstyled.

## Build Issues

### Styles not applying

**Symptom**: Styled components render but styles don't apply.

**Cause**: Babel plugin not running or cache issue.

**Solution**:

```bash
# 1. Verify babel-plugin-kstyled is in babel.config.js
# Should have:
# plugins: ['babel-plugin-kstyled']

# 2. Clear Metro cache
npx react-native start --reset-cache

# 3. Clean build (if using native builds)
cd android && ./gradlew clean
cd ios && xcodebuild clean
```

### "Cannot find module 'kstyled'"

**Solution**:

```bash
# Install the package
npm install kstyled babel-plugin-kstyled
# or
yarn add kstyled babel-plugin-kstyled
# or
pnpm add kstyled babel-plugin-kstyled
```

Ensure both packages are installed - the runtime and the babel plugin.

### Babel transformation errors

**Symptom**: Build fails with Babel errors.

**Solution**:

```bash
# 1. Check babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['babel-plugin-kstyled'],
};

# 2. Clear babel cache
rm -rf node_modules/.cache

# 3. Restart Metro
npx react-native start --reset-cache
```

## Runtime Issues

### Theme not updating

**Symptom**: Theme changes don't reflect in components.

**Cause**: Components not wrapped in ThemeProvider or context not updating.

**Solution**:

```tsx
// ✅ Correct - ThemeProvider at root
import { ThemeProvider } from 'kstyled';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}

// ❌ Wrong - no ThemeProvider
export default function App() {
  return <YourApp />; // Theme won't work
}
```

### Dynamic props not working

**Symptom**: Props with `$` prefix don't affect styles.

**Cause**: Using regular props instead of transient props, or incorrect syntax.

**Solution**:

```tsx
// ✅ Correct - use $ prefix
const Button = styled.Pressable`
  background-color: ${(p) => (p.$variant === 'primary' ? 'blue' : 'gray')};
`;

<Button $variant="primary" />;

// ❌ Wrong - no $ prefix
const Button = styled.Pressable`
  background-color: ${(p) => (p.variant === 'primary' ? 'blue' : 'gray')};
`;
<Button variant="primary" />; // Won't work, variant passed to component
```

### CSS inline not parsing

**Symptom**: `css` helper shows errors or doesn't work.

**Cause**: Using css at build time instead of runtime, or syntax error.

**Solution**:

```tsx
import { css } from 'kstyled';

// ✅ Correct - use in style prop
<View
  style={css`
    padding: 16px;
    background-color: ${color};
  `}
/>;

// ❌ Wrong - trying to use outside style prop
const styles = css`
  padding: 16px;
`; // Won't work as expected
```

## Performance Issues

### App feels slow

**Symptom**: Sluggish UI, especially on older devices.

**Investigation**:

1. **Check if using too many dynamic styles**:

   ```tsx
   // ❌ Bad - everything is dynamic
   const Card = styled.View`
     padding: ${(p) => (p.$size === 'small' ? '8px' : '16px')};
     margin: ${(p) => (p.$size === 'small' ? '4px' : '8px')};
     background: ${(p) => p.$color};
   `;

   // ✅ Better - static styles extracted
   const Card = styled.View`
     border-radius: 8px; /* Static */
     padding: ${(p) => (p.$size === 'small' ? '8px' : '16px')};
     background: ${(p) => p.$color};
   `;
   ```

2. **Use StyleSheet for purely static styles**:

   ```tsx
   // For large static style objects, use StyleSheet directly
   import { StyleSheet } from 'react-native';

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#fff',
     },
   });
   ```

3. **Minimize re-renders**:
   ```tsx
   // ✅ Good - memoized
   const Card = React.memo(styled.View`
     background-color: ${(p) => p.$color};
   `);
   ```

## Metro Bundler Issues

### Port 8081 already in use

**Solution**:

```bash
# Find and kill process using port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx react-native start --port 8082
```

### WebSocket connection errors (Android)

**Symptom**: "WebSocket exception" or "Cannot connect to Metro"

**Solution**:

```bash
# Set up port forwarding
adb reverse tcp:8081 tcp:8081

# Verify Metro is running
curl http://localhost:8081/status
# Should return: {"packager":"running"}

# Restart Metro if needed
npx react-native start --reset-cache
```

## TypeScript Issues

### Type errors with styled components

**Solution**:

```tsx
import { ViewProps } from 'react-native';

// Define prop types
interface ButtonProps extends ViewProps {
  $variant?: 'primary' | 'secondary';
  $size?: 'small' | 'large';
}

// Use with styled
const Button = styled.Pressable<ButtonProps>`
  background-color: ${(p) => (p.$variant === 'primary' ? 'blue' : 'gray')};
  padding: ${(p) => (p.$size === 'small' ? '8px' : '16px')};
`;
```

### "Property '$variant' does not exist"

**Cause**: TypeScript doesn't know about transient props.

**Solution**: Add type declarations:

```tsx
// types.d.ts or in component file
declare module 'kstyled' {
  export interface DefaultTransientProps {
    $variant?: string;
    $size?: string;
    // Add your common transient props
  }
}
```

## Platform-Specific Issues

### Styles work on iOS but not Android (or vice versa)

**Cause**: Using platform-specific style properties without checks.

**Solution**:

```tsx
import { Platform } from 'react-native';

const Card = styled.View`
  /* iOS shadow */
  ${Platform.OS === 'ios' &&
  `
    shadow-color: #000;
    shadow-opacity: 0.1;
    shadow-radius: 8px;
  `}

  /* Android shadow */
  ${Platform.OS === 'android' &&
  `
    elevation: 4;
  `}
`;
```

## Debug Mode

Enable debug mode to see Babel transformations:

```js
// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'babel-plugin-kstyled',
      {
        debug: true, // Enable debug logs
      },
    ],
  ],
};
```

Then check Metro logs for transformation output.

## Still Having Issues?

1. **Check the examples**: See `packages/example/app/` for working examples
2. **Clear everything**:
   ```bash
   rm -rf node_modules
   rm -rf ios/build android/app/build
   npm install
   npx react-native start --reset-cache
   ```
3. **Check versions**:

   ```bash
   npm list kstyled babel-plugin-kstyled
   ```

   Both should be the same version.

4. **File an issue**: [GitHub Issues](https://github.com/crossplatformkorea/kstyled/issues)
   - Include error messages
   - Include babel.config.js
   - Include minimal reproduction code
