import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Oswald_600SemiBold,
    Oswald_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  // フォント読み込み中はスプラッシュ画面を表示したままにする
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
