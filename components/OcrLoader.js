// OcrLoader.js
{/*
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OcrLoader = () => {
  return (
     <View style={styles.loaderContainer}>
       <View style={styles.ocrLoader}>
         <Text style={styles.scanningText}>Scanning</Text>
         <View style={styles.loaderBar}></View>
       </View>
     </View>

    
    

  );
};


const styles = StyleSheet.create({
   loaderContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#121212',
   },
   ocrLoader: {
     width: 350,
     height: 250,
     position: 'relative',
     alignItems: 'center',
   },
   scanningText: {
     color: '#18c89b',
     fontSize: 16,
     fontWeight: '600',
     position: 'absolute',
     bottom: -30,
     left: '38%',
     animation: 'blinker 1s linear infinite',
   },
   loaderBar: {
     position: 'absolute',
     top: '5%',
     left: '4%',
     width: 10,
     height: '90%',
     backgroundColor: '#18c89b',
     boxShadow: '0 0 50px 10px #18c89b',
     animation: 'move 1s ease-in-out infinite alternate',
   },
});

export default OcrLoader; 
*/}


{/*}
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const OcrLoader = () => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 320, // Move the bar to the right
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0, // Move the bar back to the left
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateX]);

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loader}>
        <Text style={styles.scanningText}>Scanning</Text>
        <View style={styles.loaderFrame}>
          <Animated.View
            style={[
              styles.loaderBar,
              { transform: [{ translateX }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loader: {
    width: 350,
    height: 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#18c89b',
    borderWidth: 2,
    borderRadius: 10,
  },
  scanningText: {
    color: '#18c89b',
    fontSize: 16,
    fontWeight: '600',
    position: 'absolute',
    bottom: -30,
    textTransform: 'uppercase',
  },
  loaderFrame: {
    position: 'relative',
    width: '90%',
    height: '90%',
    overflow: 'hidden',
    backgroundColor: '#333',
    borderRadius: 10,
  },
  loaderBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 10,
    height: '100%',
    backgroundColor: '#18c89b',
    shadowColor: '#18c89b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});

export default OcrLoader;
*/}

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,ImageBackground 
} from 'react-native';

const OcrLoader = ({ imageUri }) => {
  const barTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Horizontal Bar Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(barTranslateX, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(barTranslateX, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [barTranslateX]);

  const barTranslateXInterpolate = barTranslateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 325], // Adjust this based on the loader size
  });

  return (
    <ImageBackground source={{ uri: imageUri }} style={styles.container}>
    <View style={styles.loaderContainer}>
      <View style={styles.loader}>
        <Animated.View
          style={[
            styles.horizontalBar,
            { transform: [{ translateX: barTranslateXInterpolate }] },
          ]}
        />
      </View>
      <Text style={styles.scanningText}>
        <Text style={styles.blinkingDot}>•</Text> Scanning
      </Text>
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: 300,
        height: 280,
        justifyContent: 'center', // Center the loader
        alignItems: 'center',
      },
    loaderContainer: {
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    loader: {
        width: 350,
        height: 320,
        margin: 2,
        borderColor: '#18c89b',
        position: 'relative',
        overflow: 'hidden',
      },
    horizontalBar: {
      width: '5%',
      height: '100%',
      backgroundColor: '#18c89b',
      position: 'absolute',
      top: '5%',
      shadowColor: '#18c89b',
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 10,
    },
    scanningText: {
      marginTop: 5,
      color: '#18c89b',
      fontSize: 18,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    blinkingDot: {
      color: '#18c89b',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
  

export default OcrLoader;

