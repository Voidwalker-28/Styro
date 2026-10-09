import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyroProvider, useStyro } from '@/lib/store';
import { Announcer } from '@/components/bits';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, state, theme } = useStyro();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    const onOnboarding = segments[0] === 'onboarding';
    if (!state.settings.onboarded && !onOnboarding) {
      router.replace('/onboarding');
    } else if (state.settings.onboarded && onOnboarding) {
      router.replace('/');
    }
  }, [ready, state.settings.onboarded, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080B10' }}>
        <ActivityIndicator size="large" color="#C7F36B" />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {children}
      <Announcer />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StyroProvider>
        <Gate>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="drawer" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="customize" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="native-capabilities" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          </Stack>
        </Gate>
      </StyroProvider>
    </SafeAreaProvider>
  );
}
