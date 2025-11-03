// app/index.jsx
import { View, Text, StyleSheet, Pressable, ImageBackground, ScrollView, useWindowDimensions} from 'react-native';
import { useRouter } from 'expo-router';
import pianoImage from '../assets/images/piano.jpg';
import guitarImage from '../assets/images/guitar.png';
import trumpetImage from '../assets/images/trumpet.png';
import synthImage from '../assets/images/synth.png';


const FullScreenPressable = () => {
  const { width, height } = useWindowDimensions();
};

export default function Home() {
  const router = useRouter();
  return (
    <ScrollView
    contentContainerStyle={styles.scrollContainer}
    showsVerticalScrollIndicator={false}
    >
      <View style= {styles.container}>
        <Pressable
          style={({ pressed }) => [
            styles.insturmentButton,
            { backgroundColor: pressed ? 'transparent' : 'transparent' },
          ]}
          onPress={() => router.push({
            pathname: 'record',
            params: { instrument: 'Piano' }
          })}
        >
          <ImageBackground
            source={pianoImage}
            style={styles.image}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.textOverlay}>
              <Text style={styles.buttonText}>Piano</Text>
            </View>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.insturmentButton,
            { backgroundColor: pressed ? 'transparent' : 'transparent' },
          ]}
          onPress={() => router.push({
            pathname: 'record',
            params: { instrument: 'Synth' }
          })}
        >
          <ImageBackground
            source={synthImage}
            style={styles.image}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.textOverlay}>
              <Text style={styles.buttonText}>Synth</Text>
            </View>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.insturmentButton,
            { backgroundColor: pressed ? 'transparent' : 'transparent' },
          ]}
          onPress={() => router.push({
            pathname: 'record',
            params: { instrument: 'Guitar' }
          })}
        >
          <ImageBackground
            source={guitarImage}
            style={styles.image}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.textOverlay}>
              <Text style={styles.buttonText}>Guitar</Text>
            </View>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.insturmentButton,
            { backgroundColor: pressed ? 'transparent' : 'transparent' },
          ]}
          onPress={() => router.push({
            pathname: 'record',
            params: { instrument: 'Trumpet' }
          })}
        >
          <ImageBackground
            source={trumpetImage}
            style={styles.image}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.textOverlay}>
              <Text style={styles.buttonText}>Trumpet</Text>
            </View>
          </ImageBackground>
        </Pressable>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1, 
    flexDirection: 'column', 
    gap: 16,
    alignItems:'center', 
    justifyContent:'flex-start', 
    padding:16,
    backgroundColor:'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  insturmentButton:{
    width: 400,
    height: 150,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'black',
    overflow: 'hidden',
    backgroundColor: 'dimgrey',
  },
  image:{
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  buttonText:{
    fontSize: 60,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    letterSpacing: 8,
    color: 'black',
    opacity: 0.9,
  },
  textOverlay: {
    backgroundColor: 'rgba(0,0,0,0)',
    width: 400,
    height: 150,  // semi-transparent background for readability
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 25, // distance from top
    borderRadius: 5,
    alignItems:'center', 
    justifyContent:'flex-start', 
  },
  
  
});


