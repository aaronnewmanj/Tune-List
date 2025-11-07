import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RecordingProvider } from './recordingcontext';

export default function Layout() {
  return (
    <RecordingProvider>
      <Tabs
        screenOptions={{
          headerShown: true,    
          tabBarActiveTintColor: 'red',
          tabBarInactiveTintColor: 'grey',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Insturments',
            tabBarIcon: ({ color, size = 5 }) => (
              <MaterialIcons name="piano" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="library"
          options={{
            title: 'Playlist',
            tabBarIcon: ({ color, size = 5 }) => (
              <Ionicons name="headset" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="record"
          options={{
            title: 'Record',
            tabBarIcon: ({ color, size = 5 }) => (
              <Foundation name="record" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </RecordingProvider>
  );
}
