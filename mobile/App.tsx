import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import { AddressesScreen } from './src/screens/AddressesScreen';
import { SelectAddressScreen } from './src/screens/SelectAddressScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { DeliveryLocationProvider } from './src/context/DeliveryLocationContext';
import { styles } from './src/styles/app/App.styles';

export type RootStackParamList = {
  Main: { tab?: TabKey } | undefined;
  RestaurantDetail: { restaurant: Restaurant };
  Tracking: { orderId: string };
  Rewards: undefined;
  Login: undefined;
  Addresses: undefined;
  SelectAddress: { saveToAccount?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
type Nav = NativeStackNavigationProp<RootStackParamList>;

function HomeTabContent({
  onGoCart,
  onNeedLogin,
}: {
  onGoCart: () => void;
  onNeedLogin: () => void;
}) {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  return (
    <HomeScreen
      onRestaurantPress={(restaurant) =>
        navigation.navigate('RestaurantDetail', { restaurant })
      }
      onCheckoutPress={onGoCart}
      onAddressPress={() => {
        if (user) navigation.navigate('Addresses');
        else navigation.navigate('SelectAddress');
      }}
      onNeedLogin={onNeedLogin}
    />
  );
}

function MainTabs() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Main'>>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>(
    route.params?.tab || 'home',
  );

  useEffect(() => {
    if (route.params?.tab) setActiveTab(route.params.tab);
  }, [route.params?.tab]);

  const goCart = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    setActiveTab('cart');
  };
  const goOrders = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    setActiveTab('orders');
  };
  const needLogin = () => navigation.navigate('Login');

  const onTabPress = (tab: TabKey) => {
    if (!user && (tab === 'cart' || tab === 'orders')) {
      navigation.navigate('Login');
      return;
    }
    setActiveTab(tab);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTabContent onGoCart={goCart} onNeedLogin={needLogin} />;
      case 'cart':
        return (
          <CheckoutScreen
            onOrderPlaced={(orderId) =>
              navigation.navigate('Tracking', { orderId })
            }
            onBrowse={() => setActiveTab('home')}
            onOpenAddresses={() => navigation.navigate('Addresses')}
            onOpenMapPicker={() =>
              navigation.navigate('SelectAddress', { saveToAccount: true })
            }
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
            onOpenRewards={() => {
              if (!user) {
                navigation.navigate('Login');
                return;
              }
              navigation.navigate('Rewards');
            }}
            onOpenOrders={goOrders}
            onOpenAddresses={() => {
              if (!user) {
                navigation.navigate('SelectAddress');
                return;
              }
              navigation.navigate('Addresses');
            }}
            onLogin={() => navigation.navigate('Login')}
          />
        );
    }
  };

  return (
    <View style={styles.main}>
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

function RestaurantDetailWrapper({
  route,
}: {
  route: { params: { restaurant: Restaurant } };
}) {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  return (
    <RestaurantDetailScreen
      restaurant={route.params.restaurant}
      onBack={() => navigation.goBack()}
      onCheckoutPress={() => {
        if (!user) {
          navigation.navigate('Login');
          return;
        }
        navigation.navigate('Main', { tab: 'cart' });
      }}
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

function AddressesWrapper() {
  const navigation = useNavigation<Nav>();
  return (
    <AddressesScreen
      onBack={() => navigation.goBack()}
      onLogin={() => navigation.navigate('Login')}
      onOpenMap={() =>
        navigation.navigate('SelectAddress', { saveToAccount: true })
      }
    />
  );
}

function SelectAddressWrapper({
  route,
}: {
  route: { params?: { saveToAccount?: boolean } };
}) {
  const navigation = useNavigation<Nav>();
  return (
    <SelectAddressScreen
      onBack={() => navigation.goBack()}
      saveToAccount={Boolean(route.params?.saveToAccount)}
    />
  );
}

function LoginWrapper() {
  const navigation = useNavigation<Nav>();
  return (
    <LoginScreen
      onBack={() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Main');
      }}
      onLoggedIn={() => navigation.navigate('Main')}
    />
  );
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
      <Stack.Screen name="Tracking" component={TrackingWrapper} />
      <Stack.Screen name="Rewards" component={RewardsWrapper} />
      <Stack.Screen name="Addresses" component={AddressesWrapper} />
      <Stack.Screen name="SelectAddress" component={SelectAddressWrapper} />
      <Stack.Screen name="Login" component={LoginWrapper} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DeliveryLocationProvider>
        <CartProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </CartProvider>
      </DeliveryLocationProvider>
    </AuthProvider>
  );
}

