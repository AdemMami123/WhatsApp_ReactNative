import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * Format call duration in MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
export const formatCallDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Request microphone permission
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'WhatsApp needs access to your microphone for calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Failed to request microphone permission:', err);
      return false;
    }
  } else {
    // iOS handles permissions through the native modules
    return true;
  }
};

/**
 * Show incoming call notification (simplified version)
 * @param {Object} caller - Caller information
 * @returns {Promise<string>} - Notification ID
 */
export const showIncomingCallNotification = async (caller) => {
  try {
    // In a real implementation, this would use proper notifications
    // For now, we'll just show an alert
    Alert.alert(
      'Incoming Call',
      `${caller.name} is calling you`,
      [
        {
          text: 'Reject',
          style: 'cancel',
        },
        {
          text: 'Answer',
        },
      ]
    );
    return 'notification-id';
  } catch (error) {
    console.error('Failed to show call notification:', error);
    return null;
  }
};

/**
 * Cancel a notification (simplified version)
 * @param {string} notificationId - ID of the notification to cancel
 */
export const cancelNotification = (notificationId) => {
  // In a real implementation, this would cancel the notification
  console.log('Notification canceled:', notificationId);
};

export default {
  formatCallDuration,
  requestMicrophonePermission,
  showIncomingCallNotification,
  cancelNotification,
};
