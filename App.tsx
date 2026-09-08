import React, {useCallback, useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {SplashScreen} from './src/components/SplashScreen';
import {colors} from './src/theme';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={showSplash ? 'light-content' : 'dark-content'}
        backgroundColor={showSplash ? colors.ink : colors.paper}
      />
      <RootNavigator />
      {showSplash && <SplashScreen onFinish={hideSplash} />}
    </SafeAreaProvider>
  );
}
