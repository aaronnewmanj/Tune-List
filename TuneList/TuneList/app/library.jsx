import { useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { RecordingContext } from './recordingcontext';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

export default function Playlist() {
  const { recordings, setRecordings } = useContext(RecordingContext);

  // Load recordings from storage
  useEffect(() => {
    (async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
          return;
        }

        const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);

        const loaded = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await FileSystem.readAsStringAsync(RECORDINGS_DIR + file);
            const data = JSON.parse(content);
            loaded.push({
              name: file,
              instrument: data.instrument,
              createdAt: data.createdAt,
              notes: data.notes,
            });
          }
        }

        loaded.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecordings(loaded);
      } catch (error) {
        console.error('Error loading recordings:', error);
        Alert.alert('Error', 'Failed to load recordings.');
      }
    })();
  }, []);

  // Map instrument to static files (matches Record.jsx)
  const instrumentFiles = {
    Piano: [
      'piano1.mp3','piano2.mp3','piano3.mp3','piano4.mp3','piano5.mp3',
      'piano6.mp3','piano7.mp3','piano8.mp3','piano9.mp3','piano10.mp3'
    ],
    Guitar: [
      'guitar1_1.wav','guitar2_1.wav','guitar3_1.wav','guitar4_1.wav','guitar5_1.wav',
      'guitar6_1.wav','guitar7_1.wav','guitar8_1.wav','guitar9_1.wav','guitar10_1.wav'
    ],
    Synth: [
      'synth1_1.mp3','synth2_1.wav','synth3_1.wav','synth4_1.wav','synth5_1.wav',
      'synth6_1.wav','synth7_1.wav','synth8_1.wav','synth9_1.wav','synth10_1.wav'
    ],
    Trumpet: [
      'trumpet1_1.wav','trumpet2_1.wav','trumpet3_1.wav','trumpet4_1.wav','trumpet5_1.wav',
      'trumpet6_1.wav','trumpet7_1.wav','trumpet8_1.wav','trumpet9_1.wav','trumpet10_1.wav'
    ]
  };

  const noteNames = ['A','Ab','B','Bb','C','D','E','Eb','G','Gb'];

  function getNoteFile(noteName, instrument) {
  const noteNames = ['A','Ab','B','Bb','C','D','E','Eb','G','Gb'];
  const idx = noteNames.indexOf(noteName);
  if (idx === -1) return null;
  const files = instrumentFiles[instrument] || instrumentFiles['Piano'];
  return files[idx];
}

  async function playRecording(rec) {
    if (!rec?.notes?.length) return;

    rec.notes.forEach(({ noteName, timestamp }) => {
      setTimeout(async () => {
        try {
          const file = getNoteFile(noteName, rec.instrument);
          if (!file) return;
          const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true });
          sound.setOnPlaybackStatusUpdate(status => {
            if (status.didJustFinish) sound.unloadAsync().catch(() => {});
          });
        } catch (err) {
          console.log('Playback error:', err);
        }
      }, timestamp);
    });
  }

  async function deleteRecording(name) {
    try {
      await FileSystem.deleteAsync(RECORDINGS_DIR + name);
      setRecordings(prev => prev.filter(r => r.name !== name));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete recording.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.topText}>Your Recordings</Text>

        {recordings.length === 0 && <Text style={styles.emptyText}>No saved recordings yet.</Text>}

        {recordings.map((rec, index) => (
          <View key={index} style={styles.recordingRow}>
            <Pressable
              style={({ pressed }) => [styles.recordingButton, pressed && { opacity: 0.7 }]}
              onPress={() => playRecording(rec)}
            >
              <Text style={styles.recordingText}>
                {rec.instrument} – {new Date(rec.createdAt).toLocaleString()}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && { backgroundColor: '#ddd' }]}
              onPress={() =>
                Alert.alert('Delete?', 'Remove this recording?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteRecording(rec.name) },
                ])
              }
            >
              <Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  topText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '95%',
  },
  recordingButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginRight: 10,
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});
