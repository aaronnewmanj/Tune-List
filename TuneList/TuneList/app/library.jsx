import React, { useEffect, useContext, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { RecordingContext } from './recordingcontext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

export default function Playlist() {
  const { recordings, setRecordings } = useContext(RecordingContext);

  const playbackTimersRef = useRef([]);
  const activeSoundsRef = useRef([]);

  const nodesByNameRef = useRef({}); 
  const headRef = useRef(null);
  const tailRef = useRef(null);
  const currentNodeRef = useRef(null);

  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [, forceRerender] = useState(0);

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

    return () => {
      playbackTimersRef.current.forEach(t => clearTimeout(t));
      playbackTimersRef.current = [];
      (activeSoundsRef.current || []).forEach(s => {
        try { s.unloadAsync && s.unloadAsync(); } catch (e) {}
      });
      activeSoundsRef.current = [];
    };
  }, []);

  useEffect(() => {
    buildLinkedListFromArray(recordings || []);
    forceRerender(n => n + 1);
  }, [recordings]);

  function buildLinkedListFromArray(arr) {
    const nodes = {};
    let prev = null;
    let head = null;
    let tail = null;

    for (let i = 0; i < arr.length; i++) {
      const rec = arr[i];
      const node = {
        rec,
        next: null,
        prev: prev,
      };
      nodes[rec.name] = node;
      if (prev) prev.next = node;
      prev = node;
      if (!head) head = node;
      tail = node;
    }

    if (head && tail) {
      head.prev = tail;
      tail.next = head;
    }

    nodesByNameRef.current = nodes;
    headRef.current = head;
    tailRef.current = tail;

    const cur = currentNodeRef.current;
    if (!cur || !nodes[cur.rec?.name]) {
      currentNodeRef.current = head;
    } else {
      currentNodeRef.current = nodes[cur.rec.name];
    }
  }

  const instrumentFiles = {
    Piano: [
      require('../assets/audio/piano1.mp3'),
      require('../assets/audio/piano2.mp3'),
      require('../assets/audio/piano3.mp3'),
      require('../assets/audio/piano4.mp3'),
      require('../assets/audio/piano5.mp3'),
      require('../assets/audio/piano6.mp3'),
      require('../assets/audio/piano7.mp3'),
      require('../assets/audio/piano8.mp3'),
      require('../assets/audio/piano9.mp3'),
      require('../assets/audio/piano10.mp3'),
    ],
    Guitar: [
      require('../assets/audio/guitar1_1.wav'),
      require('../assets/audio/guitar2_1.wav'),
      require('../assets/audio/guitar3_1.wav'),
      require('../assets/audio/guitar4_1.wav'),
      require('../assets/audio/guitar5_1.wav'),
      require('../assets/audio/guitar6_1.wav'),
      require('../assets/audio/guitar7_1.wav'),
      require('../assets/audio/guitar8_1.wav'),
      require('../assets/audio/guitar9_1.wav'),
      require('../assets/audio/guitar10_1.wav'),
    ],
    Synth: [
      require('../assets/audio/synth1_1.mp3'),
      require('../assets/audio/synth2_1.wav'),
      require('../assets/audio/synth3_1.wav'),
      require('../assets/audio/synth4_1.wav'),
      require('../assets/audio/synth5_1.wav'),
      require('../assets/audio/synth6_1.wav'),
      require('../assets/audio/synth7_1.wav'),
      require('../assets/audio/synth8_1.wav'),
      require('../assets/audio/synth9_1.wav'),
      require('../assets/audio/synth10_1.wav'),
    ],
    Trumpet: [
      require('../assets/audio/trumpet1_1.wav'),
      require('../assets/audio/trumpet2_1.wav'),
      require('../assets/audio/trumpet3_1.wav'),
      require('../assets/audio/trumpet4_1.wav'),
      require('../assets/audio/trumpet5_1.wav'),
      require('../assets/audio/trumpet6_1.wav'),
      require('../assets/audio/trumpet7_1.wav'),
      require('../assets/audio/trumpet8_1.wav'),
      require('../assets/audio/trumpet9_1.wav'),
      require('../assets/audio/trumpet10_1.wav'),
    ],
  };

  const noteNames = ['A','Ab','B','Bb','C','D','E','Eb','G','Gb'];

  function getNoteFile(noteName, instrument) {
    const files = instrumentFiles[instrument] || instrumentFiles['Piano'];
    const idx = noteNames.indexOf(noteName);
    if (idx === -1) return null;
    return files[idx];
  }

  function stopPlayback() {
    playbackTimersRef.current.forEach(t => clearTimeout(t));
    playbackTimersRef.current = [];
    (activeSoundsRef.current || []).forEach(s => {
      try { s.unloadAsync && s.unloadAsync(); } catch (e) {}
    });
    activeSoundsRef.current = [];
    setIsPlayingAll(false);
  }

  async function playRecording(rec) {
    if (!rec?.notes?.length) return;

    stopPlayback();

    rec.notes.forEach(({ noteName, timestamp }) => {
      const delay = Math.max(0, timestamp);
      const timer = setTimeout(async () => {
        try {
          const file = getNoteFile(noteName, rec.instrument || 'Piano');
          if (!file) return;

          const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true });
          activeSoundsRef.current.push(sound);

          sound.setOnPlaybackStatusUpdate(status => {
            if (status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== sound);
            }
          });
        } catch (err) {
          console.log('Playback error:', err);
        }
      }, delay);
      playbackTimersRef.current.push(timer);
    });

    // schedule final cleanup after last timestamp
    const lastTimestamp = rec.notes[rec.notes.length - 1].timestamp || 0;
    const cleanupTimer = setTimeout(() => {
      playbackTimersRef.current = [];
      setIsPlayingAll(false);
    }, lastTimestamp + 500);
    playbackTimersRef.current.push(cleanupTimer);
    setIsPlayingAll(true);
  }

  // play current node
  function playCurrent() {
    const cur = currentNodeRef.current || headRef.current;
    if (!cur || !cur.rec) return;
    playRecording(cur.rec);
    // force rerender so UI highlight updates if needed
    forceRerender(n => n + 1);
  }

  function playNext() {
    const cur = currentNodeRef.current || headRef.current;
    if (!cur) return;
    // circular next (tail.next -> head because we made circular in build)
    const nextNode = cur.next || headRef.current;
    currentNodeRef.current = nextNode || headRef.current;
    playRecording(currentNodeRef.current.rec);
    forceRerender(n => n + 1);
  }

  function playPrev() {
    const cur = currentNodeRef.current || headRef.current;
    if (!cur) return;
    const prevNode = cur.prev || tailRef.current;
    currentNodeRef.current = prevNode || headRef.current;
    playRecording(currentNodeRef.current.rec);
    forceRerender(n => n + 1);
  }

  async function deleteRecording(name) {
    try {
      await FileSystem.deleteAsync(RECORDINGS_DIR + name);
      // remove from recordings array (context)
      setRecordings(prev => {
        const newArr = (prev || []).filter(r => r.name !== name);
        // adjust current node if it was the deleted one
        const nodes = nodesByNameRef.current || {};
        const deletedNode = nodes[name];
        if (deletedNode) {
          // prefer next, otherwise prev, otherwise null
          const nextNode = deletedNode.next && deletedNode.next.rec && deletedNode.next.rec.name !== name ? deletedNode.next : null;
          const prevNode = deletedNode.prev && deletedNode.prev.rec && deletedNode.prev.rec.name !== name ? deletedNode.prev : null;
          if (currentNodeRef.current && currentNodeRef.current.rec.name === name) {
            if (nextNode) currentNodeRef.current = nextNode;
            else if (prevNode) currentNodeRef.current = prevNode;
            else currentNodeRef.current = null;
          }
        }
        return newArr;
      });
      // rebuild linked list will occur automatically via the recordings effect
    } catch (e) {
      Alert.alert('Error', 'Failed to delete recording.');
    } finally {
      forceRerender(n => n + 1);
    }
  }

  // helper to check if a recording is the currently selected one
  function isCurrentRecording(rec) {
    return currentNodeRef.current && currentNodeRef.current.rec && currentNodeRef.current.rec.name === rec.name;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.topText}>Your Recordings</Text>

        {/* Player controls for the "playlist" (linked-list next/prev) */}
        <View style={styles.controlsRow}>
          <Pressable style={styles.controlButton} onPress={playPrev}>
            <MaterialCommunityIcons name="skip-previous" size={28} color="white" />
          </Pressable>

          <Pressable
            style={[styles.controlButton, { width: 80 }]}
            onPress={() => {
              if (isPlayingAll) {
                stopPlayback();
              } else {
                playCurrent();
              }
            }}
          >
            <MaterialCommunityIcons name={isPlayingAll ? "pause" : "play"} size={28} color="white" />
          </Pressable>

          <Pressable style={styles.controlButton} onPress={playNext}>
            <MaterialCommunityIcons name="skip-next" size={28} color="white" />
          </Pressable>
        </View>

        {(!recordings || recordings.length === 0) && (
          <Text style={styles.emptyText}>No saved recordings yet.</Text>
        )}

        {(recordings || []).map((rec) => (
          <View key={rec.name} style={styles.recordingRow}>
            <Pressable
              style={({ pressed }) => [
                styles.recordingButton,
                pressed && { opacity: 0.7 },
                isCurrentRecording(rec) && { borderWidth: 2, borderColor: 'red' }
              ]}
              onPress={() => {
                const node = (nodesByNameRef.current && nodesByNameRef.current[rec.name]) || null;
                if (node) currentNodeRef.current = node;
                else currentNodeRef.current = headRef.current;
                forceRerender(n => n + 1);
                playRecording(rec);
              }}
            >
              <Text style={styles.recordingText}>
                {rec.instrument} – {new Date(rec.createdAt).toLocaleString()}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && { backgroundColor: '#ddd' },
              ]}
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  controlButton: {
    width: 60,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
});
