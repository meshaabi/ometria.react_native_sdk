import * as React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import Ometria, { OmetriaBasketItem } from 'react-native-ometria';
// import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

// import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';

enableScreens();
const Stack = createNativeStackNavigator();

const EventType = {
  SCREEN_VIEWED: 'SCREEN_VIEWED',
  DEEPLINK_OPENED_EVENT: 'DEEPLINK_OPENED_EVENT',
  PROFILE_IDENTIFIED_BY_EMAIL: 'PROFILE_IDENTIFIED_BY_EMAIL',
  PROFILE_IDENTIFIED_BY_CUSTOMER_ID: 'PROFILE_IDENTIFIED_BY_CUSTOMER_ID',
  PROFILE_DEIDENTIFIED: 'PROFILE_DEIDENTIFIED',
  PRODUCT_VIEWED: 'PRODUCT_VIEWED',
  PRODUCT_LISTING_VIEWED: 'PRODUCT_LISTING_VIEWED',
  WISH_LIST_ADDED_TO: 'WISH_LIST_ADDED_TO',
  WISHLIST_REMOVED_FROM: 'WISHLIST_REMOVED_FROM',
  BASKET_VIEWED: 'BASKET_VIEWED',
  BASKET_UPDATED: 'BASKET_UPDATED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  HOME_SCREEN_VIEWED: 'HOME_SCREEN_VIEWED',
  CUSTOM: 'CUSTOM',
  FLUSH: 'FLUSH',
  CLEAR: 'CLEAR',
};

const Home = () => {
  const navigation = useNavigation();
  const [isReady, setIsReady] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const requestUserPermission = React.useCallback(async () => {
    await messaging().requestPermission({
      sound: true,
      badge: true,
      alert: true,
    });
  }, []);

  React.useEffect(() => {
    // Ometria init
    Ometria.initializeWithApiToken('OMETRIA_API_TOKEN').then(() => {
      setIsReady(true);

      // enabled Ometria logging
      Ometria.isLoggingEnabled(true);

      // Deep linking interaction from push notifications
      Ometria.onDeepLinkInteracted()
        .then((notificationURL) => {
          console.log('Notification URL interacted: ', notificationURL);
        })
        .catch((error: any) => {
          console.warn('Error: ', error);
        });
    });
  }, []);

  React.useEffect(() => {
    if (isReady) {
      const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        // only for Android
        if (Platform.OS === 'android') {
          Ometria.onMessageReceived(remoteMessage);
        }
      });

      // If using other push notification providers (ie Amazon SNS, etc)
      // you may need to get the APNs token instead for iOS:
      if (Platform.OS === 'android') {
        // Get Android device token
        messaging()
          .getToken()
          .then((pushToken) => Ometria.onNewToken(pushToken));
      } else {
        // Request permission for iOS notifications
        requestUserPermission().then((status) => {
          console.log('Permission status: ', status);
        });
      }

      return () => {
        unsubscribe();
        // Listen to whether the token changes
        messaging().onTokenRefresh((pushToken) => {
          if (Platform.OS === 'android') {
            Ometria.onNewToken(pushToken);
          }
        });
      };
    }
    return;
  }, [isReady, requestUserPermission]);

  const handleLogin = React.useCallback(async () => {
    await Ometria.trackProfileIdentifiedByEmailEvent(email);
  }, [email]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={(value) => setEmail(value)}
        placeholder="Email"
      />
      <TouchableOpacity style={styles.button} onPress={() => handleLogin()}>
        <Text>LOGIN WITH EMAIL</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Events')}
      >
        <Text>Go to Events</Text>
      </TouchableOpacity>
    </View>
  );
};

const Events = () => {
  const sendEvent = (eventType: string) => {
    if (eventType === EventType.DEEPLINK_OPENED_EVENT)
      Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
    if (eventType === EventType.SCREEN_VIEWED)
      Ometria.trackScreenViewedEvent('OnboardingScreen', { a: '1', b: '2' });
    if (eventType === EventType.HOME_SCREEN_VIEWED)
      Ometria.trackHomeScreenViewedEvent();
    if (eventType === EventType.PROFILE_IDENTIFIED_BY_EMAIL)
      Ometria.trackProfileIdentifiedByEmailEvent('test@gmail.com');
    if (eventType === EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID)
      Ometria.trackProfileIdentifiedByCustomerIdEvent('test_customer_id');
    if (eventType === EventType.PROFILE_DEIDENTIFIED)
      Ometria.trackProfileDeidentifiedEvent();
    if (eventType === EventType.PRODUCT_VIEWED)
      Ometria.trackProductViewedEvent('product_1');
    if (eventType === EventType.PRODUCT_LISTING_VIEWED)
      Ometria.trackProductListingViewedEvent();
    if (eventType === EventType.WISH_LIST_ADDED_TO)
      Ometria.trackWishlistAddedToEvent('product_1');
    if (eventType === EventType.WISHLIST_REMOVED_FROM)
      Ometria.trackWishlistRemovedFromEvent('product_1');
    if (eventType === EventType.BASKET_VIEWED) Ometria.trackBasketViewedEvent();
    if (eventType === EventType.BASKET_UPDATED) {
      // list of products
      const items: OmetriaBasketItem[] = [
        {
          productId: 'product-1',
          sku: 'sku-product-1',
          quantity: 1,
          price: 12.0,
        },
        {
          productId: 'product-2',
          sku: 'sku-product-2',
          quantity: 2,
          price: 9.0,
        },
        {
          productId: 'product-3',
          sku: 'sku-product-3',
          quantity: 3,
          price: 20.0,
        },
      ];

      Ometria.trackBasketUpdatedEvent({
        totalPrice: 12.0,
        currency: 'USD',
        items,
      });
    }
    if (eventType === EventType.ORDER_COMPLETED) {
      Ometria.trackOrderCompletedEvent('order-1', {
        totalPrice: 12.0,
        currency: 'USD',
        items: [],
      });
    }
    if (eventType === EventType.CUSTOM)
      Ometria.trackCustomEvent('my_custom_type', {});
    if (eventType === EventType.FLUSH) Ometria.flush();
    if (eventType === EventType.CLEAR) Ometria.clear();
  };

  return (
    <SafeAreaView>
      <ScrollView
        renderToHardwareTextureAndroid
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => Ometria.isLoggingEnabled(true)}
          >
            <Text>ENABLE LOGGING</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PROFILE_IDENTIFIED_BY_EMAIL)}
          >
            <Text>{EventType.PROFILE_IDENTIFIED_BY_EMAIL}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              sendEvent(EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID)
            }
          >
            <Text>{EventType.PROFILE_IDENTIFIED_BY_CUSTOMER_ID}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PROFILE_DEIDENTIFIED)}
          >
            <Text>{EventType.PROFILE_DEIDENTIFIED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.PRODUCT_VIEWED)}
          >
            <Text>{EventType.PRODUCT_VIEWED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.WISH_LIST_ADDED_TO)}
          >
            <Text>{EventType.WISH_LIST_ADDED_TO}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.WISHLIST_REMOVED_FROM)}
          >
            <Text>{EventType.WISHLIST_REMOVED_FROM}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.BASKET_VIEWED)}
          >
            <Text>{EventType.BASKET_VIEWED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.BASKET_UPDATED)}
          >
            <Text>{EventType.BASKET_UPDATED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.ORDER_COMPLETED)}
          >
            <Text>{EventType.ORDER_COMPLETED}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.DEEPLINK_OPENED_EVENT)}
          >
            <Text>{EventType.DEEPLINK_OPENED_EVENT}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.SCREEN_VIEWED)}
          >
            <Text>{EventType.SCREEN_VIEWED}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.HOME_SCREEN_VIEWED)}
          >
            <Text>{EventType.HOME_SCREEN_VIEWED}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.CUSTOM)}
          >
            <Text>{EventType.CUSTOM}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.FLUSH)}
          >
            <Text>FLUSH EVENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => sendEvent(EventType.CLEAR)}
          >
            <Text>CLEAR EVENTS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Events" component={Events} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { margin: 10 },
  title: { fontSize: 18, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#33323A',
    padding: 12,
  },
  button: {
    color: '#FFF',
    borderColor: '#33323A',
    backgroundColor: '#E53062',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
  },
  gray: { backgroundColor: '#33323A' },
});
