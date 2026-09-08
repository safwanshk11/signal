import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {AddSignScreen} from '../screens/AddSignScreen';
import {RecognitionScreen} from '../screens/RecognitionScreen';
import {MySignsScreen} from '../screens/MySignsScreen';
import {SignDetailScreen} from '../screens/SignDetailScreen';
import {QuizScreen} from '../screens/QuizScreen';
import {AnalyticsScreen} from '../screens/AnalyticsScreen';
import {hasCompletedOnboarding} from '../storage/onboarding';
import {colors} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const initialRouteName = hasCompletedOnboarding() ? 'Home' : 'Onboarding';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.paper}}}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddSign" component={AddSignScreen} />
        <Stack.Screen name="Recognition" component={RecognitionScreen} />
        <Stack.Screen name="MySigns" component={MySignsScreen} />
        <Stack.Screen name="SignDetail" component={SignDetailScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
