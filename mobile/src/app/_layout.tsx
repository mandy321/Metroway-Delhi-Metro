import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useMetroStore } from '../store/useMetroStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const store = useMetroStore();
  const scheme = useColorScheme() || 'light';
  const systemTheme = scheme === 'unspecified' ? 'light' : scheme;
  const activeTheme = store.themeMode === 'system' ? systemTheme : store.themeMode;

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
