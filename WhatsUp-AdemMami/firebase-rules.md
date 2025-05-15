# Firebase Rules for Audio Calling Feature

To enable the audio calling feature, you need to update your Firebase Realtime Database rules. Follow these steps:

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Navigate to "Realtime Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the current rules with the following:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "ListComptes": {
      ".read": true,
      ".write": "auth != null",
      "$uid": {
        ".read": true,
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "LesDiscussions": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$discussionId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "calls": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$callId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "candidates": {
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null"
          }
        }
      }
    },
    "groups": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

6. Click "Publish" to save the rules

These rules allow:
- Reading and writing to the calls collection for authenticated users
- Storing WebRTC ICE candidates for call connections
- Proper permissions for call signaling

## Firebase Storage Rules

You also need to update your Firebase Storage rules to allow audio file uploads:

1. Go to your Firebase Console
2. Navigate to "Storage" in the left sidebar
3. Click on the "Rules" tab
4. Replace the current rules with the following:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    match /voice_messages/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /voice_messages/public/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /fallback/{fileName} {
      allow read, write: if request.auth != null;
    }
  }
}
```

These storage rules allow:
- Authenticated users to upload voice messages to their own folder
- Public voice messages accessible to all authenticated users
- Fallback storage for troubleshooting purposes
