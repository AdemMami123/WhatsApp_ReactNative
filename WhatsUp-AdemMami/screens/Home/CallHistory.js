import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Avatar, Chip, Divider } from 'react-native-paper';
import CallService from '../../services/CallService';
import firebase from '../../Config';

// Format timestamp to readable date/time
const formatTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

// Format call duration in MM:SS format
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function CallHistory({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;

  const [callHistory, setCallHistory] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'incoming', 'outgoing', 'missed'
  const [filteredCalls, setFilteredCalls] = useState([]);

  // Fetch call history
  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        setLoading(true);
        const history = await CallService.getCallHistory();
        setCallHistory(history);

        // Fetch user details for each remote user
        const userIds = [...new Set(history.map(call => call.remoteUserId))];
        const userDetailsMap = {};

        for (const userId of userIds) {
          const details = await CallService.getUserDetails(userId);
          if (details) {
            userDetailsMap[userId] = details;
          }
        }

        setUserDetails(userDetailsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching call history:', error);
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchCallHistory();
    } else {
      setLoading(false);
    }
  }, [currentUserId]);

  // Apply filter when filter or call history changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredCalls(callHistory);
    } else if (filter === 'incoming') {
      setFilteredCalls(callHistory.filter(call =>
        call.callerId !== currentUserId && call.status !== 'rejected'
      ));
    } else if (filter === 'outgoing') {
      setFilteredCalls(callHistory.filter(call =>
        call.callerId === currentUserId
      ));
    } else if (filter === 'missed') {
      setFilteredCalls(callHistory.filter(call =>
        call.status === 'rejected' || call.status === 'missed'
      ));
    }
  }, [filter, callHistory, currentUserId]);

  // Render a call history item
  const renderCallItem = ({ item }) => {
    const isOutgoing = item.callerId === currentUserId;
    const remoteUser = userDetails[item.remoteUserId] || {};
    const isMissed = item.status === 'rejected' || item.status === 'missed';

    // Determine call icon and color
    let iconName = isOutgoing ? 'phone-outgoing' : 'phone-incoming';
    let iconColor = '#128C7E'; // Default WhatsApp green

    if (isMissed) {
      iconName = 'phone-missed';
      iconColor = '#FF0000'; // Red for missed calls
    }

    return (
      <>
        <TouchableOpacity style={styles.callItem}>
          <View style={styles.avatarContainer}>
            {remoteUser.image ? (
              <Avatar.Image source={{ uri: remoteUser.image }} size={50} />
            ) : (
              <Avatar.Text
                size={50}
                label={remoteUser.pseudo ? remoteUser.pseudo.charAt(0).toUpperCase() : '?'}
                style={styles.avatar}
                color="#fff"
                backgroundColor="#128C7E"
              />
            )}
          </View>

          <View style={styles.callInfo}>
            <Text style={styles.userName}>{remoteUser.pseudo || 'Unknown User'}</Text>
            <View style={styles.callDetails}>
              <MaterialCommunityIcons name={iconName} size={16} color={iconColor} style={styles.callIcon} />
              <Text style={[styles.callStatus, isMissed && styles.missedCall]}>
                {isOutgoing ? 'Outgoing' : 'Incoming'}
                {isMissed ? ' (Missed)' : item.duration ? ` (${formatDuration(item.duration)})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.callTime}>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => navigation.navigate('CallScreen', {
                remoteUser: {
                  id: item.remoteUserId,
                  name: remoteUser.pseudo || 'Unknown',
                  avatar: remoteUser.image
                },
                isIncoming: false
              })}
            >
              <MaterialCommunityIcons name="phone" size={22} color="#128C7E" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
      </>
    );
  };

  // Render filter chips
  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={filter === 'all'}
        onPress={() => setFilter('all')}
        style={[styles.filterChip, filter === 'all' && styles.selectedChip]}
        textStyle={[styles.filterText, filter === 'all' && styles.selectedFilterText]}
      >
        All
      </Chip>
      <Chip
        selected={filter === 'incoming'}
        onPress={() => setFilter('incoming')}
        style={[styles.filterChip, filter === 'incoming' && styles.selectedChip]}
        textStyle={[styles.filterText, filter === 'incoming' && styles.selectedFilterText]}
      >
        Incoming
      </Chip>
      <Chip
        selected={filter === 'outgoing'}
        onPress={() => setFilter('outgoing')}
        style={[styles.filterChip, filter === 'outgoing' && styles.selectedChip]}
        textStyle={[styles.filterText, filter === 'outgoing' && styles.selectedFilterText]}
      >
        Outgoing
      </Chip>
      <Chip
        selected={filter === 'missed'}
        onPress={() => setFilter('missed')}
        style={[styles.filterChip, filter === 'missed' && styles.selectedChip]}
        textStyle={[styles.filterText, filter === 'missed' && styles.selectedFilterText]}
      >
        Missed
      </Chip>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
        <Text style={styles.loadingText}>Loading call history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />

      {renderFilterChips()}

      {filteredCalls.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="phone-off" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No call history</Text>
          <Text style={styles.emptySubText}>
            {filter !== 'all'
              ? `No ${filter} calls found`
              : "Your call history will appear here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => item.id}
          renderItem={renderCallItem}
          contentContainerStyle={styles.callsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-around',
  },
  filterChip: {
    backgroundColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#128C7E',
  },
  filterText: {
    color: '#333',
  },
  selectedFilterText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  callsList: {
    flexGrow: 1,
  },
  callItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  callInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callIcon: {
    marginRight: 5,
  },
  callStatus: {
    fontSize: 14,
    color: '#666',
  },
  missedCall: {
    color: '#FF0000',
  },
  callTime: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  callButton: {
    padding: 5,
  },
  divider: {
    backgroundColor: '#f0f0f0',
  },
});
