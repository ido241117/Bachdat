import { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './src/constants/colors';
import { Restaurant } from './src/data/restaurants';
import { BottomTabBar, TabKey } from './src/components/BottomTabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RestaurantDetailScreen } from './src/screens/RestaurantDetailScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

export type RootStackParamList = {
  Main: undefined;
  RestaurantDetail: { restaurant: Restaurant };
  Checkout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
type Nav = NativeStackNavigationProp<RootStackParamList>;

function HomeTabContent() {
  const navigation = useNavigation<Nav>();

  return (
    <HomeScreen
      onRestaurantPress={(restaurant) =>
        navigation.navigate('RestaurantDetail', { restaurant })
      }
      onCheckoutPress={() => navigation.navigate('Checkout')}
    />
  );
}

function MainTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTabContent />;
      case 'orders':
        return <OrdersScreen />;
      case 'rewards':
        return <RewardsScreen />;
      case 'profile':
        return <ProfileScreen />;
    }
  };

  return (
    <View style={styles.main}>
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

function RestaurantDetailWrapper({
  route,
}: {
  route: { params: { restaurant: Restaurant } };
}) {
  const navigation = useNavigation<Nav>();

  return (
    <RestaurantDetailScreen
      restaurant={route.params.restaurant}
      onBack={() => navigation.goBack()}
      onCheckoutPress={() => navigation.navigate('Checkout')}
    />
  );
}

function CheckoutWrapper() {
  const navigation = useNavigation<Nav>();

  return <CheckoutScreen onBack={() => navigation.goBack()} />;
}

function RootNavigator() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailWrapper} />
      <Stack.Screen name="Checkout" component={CheckoutWrapper} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
