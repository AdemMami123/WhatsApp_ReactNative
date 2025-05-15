import firebase from '../Config';

const database = firebase.database();
const auth = firebase.auth();

class CallService {
  constructor() {
    this.callRef = database.ref('Calls');
    this.activeCallsRef = database.ref('ActiveCalls');
    this.callSignalingRef = database.ref('CallSignaling');
    this.callHistoryRef = database.ref('CallHistory');

    this.currentCall = null;
    this.onCallStatusChanged = null;
    this.onCallDurationChanged = null;
    this.durationTimer = null;
    this.callDuration = 0;
  }

  // Initialize call service with callbacks
  initialize(onCallStatusChanged, onCallDurationChanged) {
    this.onCallStatusChanged = onCallStatusChanged;
    this.onCallDurationChanged = onCallDurationChanged;
    return this;
  }

  // Make an outgoing call
  async makeCall(remoteUser) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const callId = this.callRef.push().key;
    const callData = {
      callerId: currentUser.uid,
      calleeId: remoteUser.id,
      type: 'voice',
      status: 'outgoing',
      startTime: firebase.database.ServerValue.TIMESTAMP,
      endTime: null
    };

    // Create the call record
    await this.callRef.child(callId).set(callData);

    // Add to active calls
    await this.activeCallsRef.child(currentUser.uid).set({
      callId: callId,
      remoteUserId: remoteUser.id,
      status: 'outgoing'
    });

    this.currentCall = {
      id: callId,
      ...callData,
      remoteUser
    };

    return callId;
  }

  // Answer an incoming call
  async answerCall() {
    if (!this.currentCall) throw new Error('No active call to answer');

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Update call status
    await this.callRef.child(this.currentCall.id).update({
      status: 'connected',
      answeredAt: firebase.database.ServerValue.TIMESTAMP
    });

    // Update active call status
    await this.activeCallsRef.child(currentUser.uid).update({
      status: 'connected'
    });

    // Start call duration timer
    this.startDurationTimer();

    if (this.onCallStatusChanged) {
      this.onCallStatusChanged('connected', this.currentCall.remoteUser);
    }
  }

  // Reject an incoming call
  async rejectCall() {
    if (!this.currentCall) throw new Error('No active call to reject');

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Update call status
    await this.callRef.child(this.currentCall.id).update({
      status: 'rejected',
      endTime: firebase.database.ServerValue.TIMESTAMP
    });

    // Remove from active calls
    await this.activeCallsRef.child(currentUser.uid).remove();

    // Add to call history
    await this.addToCallHistory(this.currentCall.id, 'rejected');

    this.currentCall = null;
    this.stopDurationTimer();

    if (this.onCallStatusChanged) {
      this.onCallStatusChanged('idle', null);
    }
  }

  // End an ongoing call
  async endCall() {
    if (!this.currentCall) throw new Error('No active call to end');

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Update call status
    await this.callRef.child(this.currentCall.id).update({
      status: 'ended',
      endTime: firebase.database.ServerValue.TIMESTAMP,
      duration: this.callDuration
    });

    // Remove from active calls
    await this.activeCallsRef.child(currentUser.uid).remove();

    // Add to call history
    await this.addToCallHistory(this.currentCall.id, 'ended');

    this.currentCall = null;
    this.stopDurationTimer();

    if (this.onCallStatusChanged) {
      this.onCallStatusChanged('idle', null);
    }
  }

  // Add call to history
  async addToCallHistory(callId, status) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const call = await this.callRef.child(callId).once('value');
    const callData = call.val();

    if (callData) {
      await this.callHistoryRef.child(currentUser.uid).push({
        callId: callId,
        remoteUserId: callData.callerId === currentUser.uid ? callData.calleeId : callData.callerId,
        type: callData.type,
        status: status,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        duration: this.callDuration
      });
    }
  }

  // Toggle mute status
  toggleMute() {
    // In a real app, this would interact with audio APIs
    // For now, just return the new state
    return true;
  }

  // Toggle speaker
  toggleSpeaker(enabled) {
    // In a real app, this would interact with audio APIs
    // For now, just return the new state
    return enabled;
  }

  // Start call duration timer
  startDurationTimer() {
    this.callDuration = 0;
    this.durationTimer = setInterval(() => {
      this.callDuration += 1;
      if (this.onCallDurationChanged) {
        this.onCallDurationChanged(this.callDuration);
      }
    }, 1000);
  }

  // Stop call duration timer
  stopDurationTimer() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  // Cleanup resources and reset state
  cleanup() {
    this.stopDurationTimer();
    this.onCallStatusChanged = null;
    this.onCallDurationChanged = null;
    this.currentCall = null;
    this.callDuration = 0;
    return this;
  }

  // Get call history for current user
  async getCallHistory() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Get call history entries
      const snapshot = await this.callHistoryRef.child(currentUser.uid).orderByChild('timestamp').once('value');
      const callHistory = [];

      // Process each call history entry
      snapshot.forEach(childSnapshot => {
        callHistory.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sort by timestamp (newest first)
      return callHistory.reverse();
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  }

  // Get user details for a specific user ID
  async getUserDetails(userId) {
    if (!userId) return null;

    try {
      const snapshot = await database.ref('ListComptes').child(userId).once('value');
      if (snapshot.exists()) {
        return {
          id: userId,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }
}

export default new CallService();

