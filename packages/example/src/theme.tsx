import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StatusBar } from 'expo-status-bar';
import { defineTheme, ThemeProvider, type DefaultTheme } from 'kstyled';

export interface ShowcaseTheme extends DefaultTheme {
  colors: {
    canvas: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    borderStrong: string;
    ink: string;
    inkMuted: string;
    accent: string;
    accentPressed: string;
    onAccent: string;
    coral: string;
    amber: string;
    blue: string;
    code: string;
  };
  isDark: boolean;
}

export const lightTheme = defineTheme<ShowcaseTheme>({
  isDark: false,
  colors: {
    canvas: '#F3F6F4',
    surface: '#FFFFFF',
    surfaceMuted: '#E9EEEB',
    border: '#D5DDD8',
    borderStrong: '#AAB8B0',
    ink: '#17211D',
    inkMuted: '#66736C',
    accent: '#087A55',
    accentPressed: '#075F43',
    onAccent: '#FFFFFF',
    coral: '#C75A43',
    amber: '#B7791F',
    blue: '#315F8C',
    code: '#111815',
  },
});

export const darkTheme = defineTheme<ShowcaseTheme>({
  isDark: true,
  colors: {
    canvas: '#101713',
    surface: '#18221D',
    surfaceMuted: '#223029',
    border: '#314139',
    borderStrong: '#52665B',
    ink: '#F1F5F2',
    inkMuted: '#A8B6AE',
    accent: '#4CCB96',
    accentPressed: '#7BE0B5',
    onAccent: '#092319',
    coral: '#F08A72',
    amber: '#EDB85B',
    blue: '#83B4E4',
    code: '#0B100D',
  },
});

type ThemeMode = 'light' | 'dark';

interface ShowcaseContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: ShowcaseTheme;
}

const ShowcaseContext = createContext<ShowcaseContextValue | undefined>(
  undefined
);

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const value = useMemo(() => ({ mode, setMode, theme }), [mode, theme]);

  return (
    <ShowcaseContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        {children}
      </ThemeProvider>
    </ShowcaseContext.Provider>
  );
}

export function useShowcase(): ShowcaseContextValue {
  const context = useContext(ShowcaseContext);
  if (!context) {
    throw new Error('useShowcase must be used within ShowcaseProvider');
  }
  return context;
}
