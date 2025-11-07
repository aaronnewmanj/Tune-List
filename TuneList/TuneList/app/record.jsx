import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, Pressable, Alert, useWindowDimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { RecordingContext } from './recordingcontext';

const keyNum = 10;
const keyContainerWidth = 750;
const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';


const NOTE_NAMES = ['A','Ab','B','Bb','C','D','E','Eb','G','Gb'];

export default function Record() {
  const { setRecordings } = useContext(RecordingContext);
  const { height } = useWindowDimensions();
  const { instrument } = useLocalSearchParams();

  const [notes, setNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const recordingStartRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimersRef = useRef([]);
  const playbackStartRef = useRef(null);
  const pauseOffsetRef = useRef(0);

  const activeSoundsRef = useRef([]);

  useEffect(() => {
    (async () => {
      const info = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!info.exists) await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
    })();

    const instrumentFiles = {
      Piano: [
        require('../assets/audio/piano5.mp3'),
        require('../assets/audio/piano2.mp3'),
        require('../assets/audio/piano3.mp3'),
        require('../assets/audio/piano4.mp3'),
        require('../assets/audio/piano1.mp3'),
        require('../assets/audio/piano6.mp3'),
        require('../assets/audio/piano7.mp3'),
        require('../assets/audio/piano8.mp3'),
        require('../assets/audio/piano9.mp3'),
        require('../assets/audio/piano10.mp3'),
      ],
      Guitar: [
        require('../assets/audio/guitar4_1.wav'),
        require('../assets/audio/guitar2_1.wav'),
        require('../assets/audio/guitar3_1.wav'),
        require('../assets/audio/guitar1_1.wav'),
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

    const files = instrumentFiles[instrument] || instrumentFiles['Piano'];
    const noteArray = NOTE_NAMES.map((name, i) => ({
      name,
      file: files[i]
    })).filter(Boolean);

    setNotes(noteArray);
  }, [instrument]);

  // lock orientation
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
  }, []);


  useEffect(() => {
    return () => {
      playbackTimersRef.current.forEach(t => clearTimeout(t));
      playbackTimersRef.current = [];
      (activeSoundsRef.current || []).forEach(s => {
        try { s.unloadAsync && s.unloadAsync(); } catch (e) {}
      });
      activeSoundsRef.current = [];
    };
  }, []);


  async function playAudioAllowOverlap(file) {
    if (!file) return;
    try {
      const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true });
      activeSoundsRef.current.push(sound);

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {

          sound.unloadAsync().catch(() => {});
          activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== sound);
        }
      });
    } catch (err) {
      console.log('Audio play error:', err);
    }
  }

  function handleNotePress(note) {
    if (!note) return;
    playAudioAllowOverlap(note.file);

    if (isRecording) {
      const timestamp = Date.now() - recordingStartRef.current;
      setRecordedNotes(prev => [...prev, { noteName: note.name, timestamp }]);
    }
  }

  function toggleRecording() {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      recordingStartRef.current = Date.now();
      setIsRecording(true);
    }
  }

  function togglePlay() {
    if (isPlaying) {
      playbackTimersRef.current.forEach(timer => clearTimeout(timer));
      playbackTimersRef.current = [];
      pauseOffsetRef.current = Date.now() - playbackStartRef.current;
      setIsPlaying(false);
    } else {
      if (!recordedNotes.length) return;

      playbackStartRef.current = Date.now() - pauseOffsetRef.current;
      setIsPlaying(true);

      recordedNotes.forEach(({ noteName, timestamp }) => {
        const delay = timestamp - pauseOffsetRef.current;
        if (delay >= 0) {
          const timer = setTimeout(() => {
            const noteObj = notes.find(n => n.name === noteName);
            if (noteObj && noteObj.file) playAudioAllowOverlap(noteObj.file);
          }, delay);
          playbackTimersRef.current.push(timer);
        }
      });

      const lastTimestamp = recordedNotes[recordedNotes.length - 1].timestamp;
      const stopTimer = setTimeout(() => {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        playbackTimersRef.current = [];
      }, lastTimestamp - pauseOffsetRef.current + 100);
      playbackTimersRef.current.push(stopTimer);
    }
  }

  async function saveRecording() {
    if (!recordedNotes.length) {
      Alert.alert('Nothing to save', 'Record some notes before saving.');
      return;
    }

    try {
      const filename = `recording_${Date.now()}.json`;
      const payload = {
        instrument: instrument || 'Unknown',
        notes: recordedNotes,
        createdAt: new Date().toISOString(),
      };

      await FileSystem.writeAsStringAsync(RECORDINGS_DIR + filename, JSON.stringify(payload));

      setRecordings(prev => [
        {
          name: filename,
          instrument: payload.instrument,
          createdAt: payload.createdAt,
          notes: payload.notes
        },
        ...prev
      ]);

      Alert.alert('Saved', 'Recording saved to playlist.');
    } catch (e) {
      console.error('Save failed', e);
      Alert.alert('Save failed', String(e));
    }
  }

  const pianoKeyOrder = [2,3,0,1,8,9,6,7,5,4];

  return (
    <View style={styles.container}>
      {pianoKeyOrder.map(i => (
        <Pressable
          key={i}
          style={({ pressed }) => [
            styles.pianoKey, { height: height },
            { backgroundColor: pressed ? 'grey' : 'white' }
          ]}
          onPress={() => { const n = notes[i]; if (n) handleNotePress(n); }}
        />
      ))}

      <Pressable
        style={({ pressed }) => [
          styles.recordButton,
          { backgroundColor: isRecording ? 'green' : pressed ? 'grey' : 'red' }
        ]}
        onPress={toggleRecording}
      />

      <Pressable
        style={({ pressed }) => [
          styles.ppButton, { backgroundColor: pressed ? 'grey' : 'white' }
        ]}
        onPress={togglePlay}
      >
        <View style={styles.ppIconContainer}>
          <MaterialCommunityIcons name="play-pause" size={30} color='black' />
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.clearButton, { backgroundColor: pressed ? 'grey' : 'white' }
        ]}
        onPress={saveRecording}
      >
        <View style={styles.cIconContainer}>
          <Feather name='check' size={40} color='black' />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    flexDirection: 'row',
    gap: 0,
    alignItems:'center',
    justifyContent:'flex-start',
    padding:0,
    backgroundColor:'#007AFF',
    width: 896,
  },
  pianoKey: {
    width: keyContainerWidth/keyNum,
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'black',
    backgroundColor: 'white',
  },
  recordButton:{
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    borderColor: 'black',
    borderWidth: 23,
    bottom: 220,
    right: 38,
  },
  ppButton:{
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    borderColor: 'black',
    borderWidth: 3,
    bottom: 125,
    right: 38,
  },
  clearButton:{
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    borderColor: 'black',
    borderWidth: 3,
    bottom: 30,
    right: 38,
  },
  ppIconContainer:{
    width: 70,
    height: 70,
    alignItems:'center',
    padding: 19,
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
  cIconContainer:{
    width: 70,
    height: 70,
    alignItems:'center',
    padding: 15,
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
});
