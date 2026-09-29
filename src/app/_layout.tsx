import { AlegreyaSans_400Regular } from '@expo-google-fonts/alegreya-sans/400Regular';
import { AlegreyaSans_500Medium } from '@expo-google-fonts/alegreya-sans/500Medium';
import { AlegreyaSans_700Bold } from '@expo-google-fonts/alegreya-sans/700Bold';
import { Grenze_500Medium } from '@expo-google-fonts/grenze/500Medium';
import { Grenze_600SemiBold } from '@expo-google-fonts/grenze/600SemiBold';
import { Grenze_700Bold } from '@expo-google-fonts/grenze/700Bold';
import { GrenzeGotisch_600SemiBold } from '@expo-google-fonts/grenze-gotisch/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessionProvider } from '@/ui/SessionProvider';
import { colors } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    GrenzeGotisch_600SemiBold,
    Grenze_500Medium,
    Grenze_600SemiBold,
    Grenze_700Bold,
    AlegreyaSans_400Regular,
    AlegreyaSans_500Medium,
    AlegreyaSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.nuit } }}>
        <Stack.Screen name="hand" options={{ gestureEnabled: false }} />
      </Stack>
    </SessionProvider>
  );
}
