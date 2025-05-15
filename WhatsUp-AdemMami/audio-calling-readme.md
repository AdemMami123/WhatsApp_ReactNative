# Audio Calling Feature - WhatsApp Clone

This document explains how to use the audio calling feature in the WhatsApp clone application.

## Features

- Real-time audio calls between users
- Call notifications for incoming calls
- Call controls (mute, speaker, end call)
- Call duration tracking
- Background call handling

## How It Works

The audio calling feature uses WebRTC for peer-to-peer audio communication and Firebase for signaling. Here's how it works:

1. **Initiating a Call**: When a user taps the phone icon in a chat, the app creates a call record in Firebase and generates a WebRTC offer.

2. **Receiving a Call**: The recipient's app listens for new call records in Firebase and displays an incoming call notification.

3. **Answering a Call**: When the recipient accepts the call, their app generates a WebRTC answer and updates the call record in Firebase.

4. **Call Connection**: Both devices exchange ICE candidates through Firebase to establish a direct peer-to-peer connection.

5. **Audio Streaming**: Once connected, audio is streamed directly between devices using WebRTC.

6. **Ending a Call**: Either user can end the call, which updates the call status in Firebase and closes the WebRTC connection.

## Using the Feature

### Making a Call

1. Open a chat with the user you want to call
2. Tap the phone icon in the top-right corner of the screen
3. Wait for the recipient to answer

### Receiving a Call

1. When someone calls you, you'll see an incoming call notification
2. Tap the green phone icon to accept the call or the red icon to reject it

### During a Call

- Tap the microphone icon to mute/unmute your microphone
- Tap the speaker icon to toggle the speaker mode
- Tap the red phone icon to end the call

## Troubleshooting

If you encounter issues with the audio calling feature, try these steps:

1. **Call Won't Connect**:
   - Check your internet connection
   - Ensure both users have granted microphone permissions
   - Verify that Firebase rules are set correctly (see firebase-rules.md)

2. **Poor Audio Quality**:
   - Check your internet connection speed and stability
   - Try disabling other bandwidth-intensive applications
   - Ensure you're in an area with good network coverage

3. **App Crashes During Call**:
   - Make sure you have the latest version of the app
   - Check that all required permissions are granted
   - Restart the app and try again

## Technical Implementation

The audio calling feature consists of several components:

- **CallService.js**: Manages WebRTC connections and call state
- **CallScreen.js**: UI for the call screen with controls
- **IncomingCallNotification.js**: UI for incoming call notifications
- **CallUtils.js**: Utility functions for call-related operations

The feature uses the following libraries:

- react-native-webrtc: For WebRTC functionality
- react-native-incall-manager: For managing audio routing and call UI
- react-native-background-timer: For tracking call duration in the background

## Permissions

The app requires the following permissions for audio calls:

- **Microphone**: Required for capturing audio during calls
- **Internet**: Required for transmitting audio data
- **Wake Lock**: Prevents the device from sleeping during calls

These permissions are requested when needed and should be granted for the feature to work properly.
