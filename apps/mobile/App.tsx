import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { colors, typography, spacing, borderRadius } from './src/theme';
import type { RootStackParamList, MainTabParamList } from './src/types';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ClassifyScreen } from './src/screens/ClassifyScreen';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ShipmentCreateScreen } from './src/screens/ShipmentCreateScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab Icons ───
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '\u{1F3E0}',
    Classify: '\u{1F50D}',
    Calculator: '\u{1F4B0}',
    Tools: '\u{1F6E0}',
    Profile: '\u{1F464}',
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '\u{2B50}'}
    </Text>
  );
}

// ─── Main Tab Navigator ───
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.neutral[100],
          paddingTop: spacing.xs,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          ...typography.tabLabel,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Classify" component={ClassifyScreen} />
      <Tab.Screen name="Calculator" component={CalculatorScreen} />
      <Tab.Screen name="Tools" component={ToolsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Navigation ───
function AppNavigator() {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.neutral[50] },
        headerTintColor: colors.neutral[900],
        headerTitleStyle: typography.h3,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: colors.neutral[50] },
      }}
    >
      {authState === 'unauthenticated' ? (
        // Auth flow
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Authenticated flow
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShipmentCreate"
            component={ShipmentCreateScreen}
            options={{ title: 'New Shipment', presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── App Entry ───
export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: spacing.md,
  },
});
