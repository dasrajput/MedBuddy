import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import OcrLoader from './OcrLoader'; // Import the OcrLoader component
import { useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';
import * as Network from 'expo-network';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

const ImageUploader = ({ userId, onResult, ocrResults }) => {
  const [showLoader, setShowLoader] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const navigation = useNavigation();

  const handleUploadImage = async () => {
    try {
      setShowLoader(true);
      
      if (!imageUri) {
        Alert.alert('No Image', 'Please select an image first');
        return;
      }

      // Actual upload logic
      const responseData = await uploadImage(imageUri);
      
      if (responseData.detection_status === 'no_schedule_detected') {
        Alert.alert(
          'No Schedule Detected',
          'No medication schedule was detected in the image. You can create a reminder manually.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('ManualEntry', {
                  userId,
                  ocrResults: responseData,
                  refreshReminders: true
                });
              }
            }
          ]
        );
      } else if (!responseData.schedule) {
        throw new Error('Invalid server response');
      } else {
        navigation.navigate('ManualEntry', {
          userId,
          ocrResults: responseData,
          refreshReminders: true
        });
      }
  
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setShowLoader(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need permission to access your media.');
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Accessing the correct property for URI
    } else {
      Alert.alert('Image Picker', 'No image selected.');
    }
  };

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    } else {
      Alert.alert('Camera', 'No picture taken.');
    }
  };

  const createFormData = (uri) => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'medication.jpg',
    });
    return formData;
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch('https://mymedbuddy.pagekite.me/process', {
        method: 'POST',
        body: createFormData(uri),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to process image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {showLoader ? (
        <OcrLoader imageUri={imageUri} />
        // Show loader if true
      ) : (
        <View style={styles.innerBox}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} />
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <LinearGradient
                colors={['#EC4899', '#F97316']} // Pink to Orange gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Pick Image</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <LinearGradient
                colors={['#EC4899', '#F97316']} // Pink to Orange gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Take Picture</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.centerButton}>
              <TouchableOpacity style={styles.button} onPress={handleUploadImage} disabled={!imageUri}>
                <LinearGradient
                  colors={['#EC4899', '#F97316']} // Pink to Orange gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>Upload Image</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

ImageUploader.propTypes = {
  userId: PropTypes.string.isRequired,
  onResult: PropTypes.func
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerButton: {
    paddingLeft: 50,
  },
});

export default ImageUploader;