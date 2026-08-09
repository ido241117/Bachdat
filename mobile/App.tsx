import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  NavigationContainer,
  useNavigation,
  useRoute,
  type RouteProp,
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
import { TrackingScreen } from './src/screens/TrackingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

export type RootStackParamList = {
  Main: { tab?: TabKey } | undefined;
  RestaurantDetail: { restaurant: Restaurant };
  Tracking: { orderId: string };
  Rewards: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
type Nav = NativeStackNavigationProp<RootStackParamList>;

function HomeTabContent({ onGoCart }: { onGoCart: () => void }) {
  const navigation = useNavigation<Nav>();

  return (
    <HomeScreen
      onRestaurantPress={(restaurant) =>
        navigation.navigate('RestaurantDetail', { restaurant })
      }
      onCheckoutPress={onGoCart}
    />
  );
}

function MainTabs() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Main'>>();
  const [activeTab, setActiveTab] = useState<TabKey>(
    route.params?.tab || 'home',
  );

  useEffect(() => {
    if (route.params?.tab) setActiveTab(route.params.tab);
  }, [route.params?.tab]);

  const goCart = () => setActiveTab('cart');
  const goOrders = () => setActiveTab('orders');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTabContent onGoCart={goCart} />;
      case 'cart':
        return (
          <CheckoutScreen
            onOrderPlaced={(orderId) =>
              navigation.navigate('Tracking', { orderId })
            }
            onBrowse={() => setActiveTab('home')}
          />
        );
      case 'orders':
        return (
          <OrdersScreen
            onTrack={(orderId) => navigation.navigate('Tracking', { orderId })}
            onGoCart={goCart}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onOpenRewards={() => navigation.navigate('Rewards')}
            onOpenOrders={goOrders}
          />
        );
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
      onCheckoutPress={() => navigation.navigate('Main', { tab: 'cart' })}
    />
  );
}

function TrackingWrapper({
  route,
}: {
  route: { params: { orderId: string } };
}) {
  const navigation = useNavigation<Nav>();
  return (
    <TrackingScreen
      orderId={route.params.orderId}
      onBack={() => navigation.goBack()}
      onGoOrders={() => navigation.navigate('Main', { tab: 'orders' })}
    />
  );
}

function RewardsWrapper() {
  const navigation = useNavigation<Nav>();
  return <RewardsScreen onBack={() => navigation.goBack()} />;
}

function RootNavigator() {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailWrapper} />
          <Stack.Screen name="Tracking" component={TrackingWrapper} />
          <Stack.Screen name="Rewards" component={RewardsWrapper} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="light" />
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
