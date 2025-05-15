# Audio Calling Feature - Setup Guide

## Current Implementation

The current implementation provides a **simulated** audio calling experience without using WebRTC. This was done to avoid the complex setup requirements of WebRTC which was causing errors in the Metro bundler.

### What Works Now

- Call UI with proper states (outgoing, incoming, connected)
- Call duration tracking
- Simulated mute and speaker controls
- Firebase integration for call signaling
- Call state management

### What Doesn't Work

- Actual audio transmission (since WebRTC is not configured)
- Real-time audio streaming
- Background call handling

## Setting Up WebRTC Properly

To implement full audio calling functionality with real-time audio streaming, follow these steps:

### 1. Install Required Dependencies

```bash
# Remove any existing WebRTC packages
npm uninstall react-native-webrtc react-native-incall-manager

# Install with specific versions that are compatible with your React Native version
npm install react-native-webrtc@1.94.1 react-native-incall-manager@4.0.0 --legacy-peer-deps
```

### 2. Configure Android

1. Edit `android/app/build.gradle` and add:

```gradle
dependencies {
    // ... other dependencies
    implementation "com.facebook.react:react-native-webrtc:1.94.1"
}
```

2. Edit `android/app/src/main/AndroidManifest.xml` and add these permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

3. Edit `android/app/src/main/java/com/yourapp/MainApplication.java` and add:

```java
import com.oney.WebRTCModule.WebRTCModulePackage;

// Inside the getPackages() method, add:
packages.add(new WebRTCModulePackage());
```

### 3. Configure iOS (if applicable)

1. Edit `ios/Podfile` and add:

```ruby
pod 'react-native-webrtc', :path => '../node_modules/react-native-webrtc'
```

2. Run `cd ios && pod install`

3. Add these permissions to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera permission for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone permission for audio calls</string>
```

### 4. Replace the Simplified CallService

Once WebRTC is properly set up, you can replace the simplified `CallService.js` with the full implementation that uses WebRTC for real-time audio streaming.

## Troubleshooting WebRTC Issues

If you encounter issues with WebRTC:

1. **Metro Bundler Errors**:
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Ensure you're using compatible versions of all packages

2. **Android Build Errors**:
   - Check that your minSdkVersion is at least 21
   - Make sure you've added all required permissions
   - Verify that ProGuard isn't stripping WebRTC classes

3. **iOS Build Errors**:
   - Ensure you've run `pod install`
   - Check that all required permissions are in Info.plist
   - Verify that you're using a compatible iOS version (iOS 11+)

4. **Runtime Errors**:
   - Check that you're requesting permissions before accessing the microphone
   - Verify that your STUN/TURN servers are accessible
   - Look for network connectivity issues

## Alternative Approaches

If WebRTC continues to cause issues, consider these alternatives:

1. **Agora.io**: A simpler SDK for real-time audio/video
2. **Twilio Programmable Voice**: Managed voice calling service
3. **Firebase Cloud Functions + FCM**: For simpler push-to-talk functionality

## Resources

- [React Native WebRTC Documentation](https://github.com/react-native-webrtc/react-native-webrtc)
- [WebRTC Official Website](https://webrtc.org/)
- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
