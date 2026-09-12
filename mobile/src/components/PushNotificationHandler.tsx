import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';

export const PushNotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle notification when app is in foreground
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const { type, trek_id, title, body } = remoteMessage.data || {};

      // Show toast / banner
      if (type === 'participant_joined') {
        // "3 people just joined Langtang Trek!"
      }
    });

    // Handle notification tap
    messaging().onNotificationOpenedApp((remoteMessage) => {
      const trek_id = remoteMessage?.data?.trek_id;
      if (trek_id) {
        navigation.navigate('TrekDetails', { trekId: trek_id });
      }
    });

    return unsubscribe;
  }, []);

  return null;
};
