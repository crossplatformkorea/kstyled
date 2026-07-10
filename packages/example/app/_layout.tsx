import { Stack } from 'expo-router';
import { ShowcaseProvider, useShowcase } from '../src/theme';

function Navigator() {
  const { theme } = useShowcase();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 15, fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.canvas },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: 'Workbench' }}
      />
      <Stack.Screen name="feature/static" options={{ title: 'kstyled' }} />
      <Stack.Screen name="feature/dynamic" options={{ title: 'kstyled' }} />
      <Stack.Screen name="feature/hybrid" options={{ title: 'kstyled' }} />
      <Stack.Screen name="feature/attrs" options={{ title: 'kstyled' }} />
      <Stack.Screen name="feature/theme" options={{ title: 'kstyled' }} />
      <Stack.Screen name="performance/index" options={{ title: 'kstyled' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ShowcaseProvider>
      <Navigator />
    </ShowcaseProvider>
  );
}
