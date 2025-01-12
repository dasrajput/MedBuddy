import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const ImageUploader = ({ onResult }) => {
  const [imageUri, setImageUri] = useState(null);

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

  const uploadImage = async (uri) => {
    if (!uri) {
      Alert.alert('Error', 'No image selected!');
      return;
    }

    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: 'uploaded_image.jpg',
      type: 'image/jpeg',
    });


    try {
      const response = await axios.post('http://192.168.140.16:5000/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        
      });

      console.log('Server response:', response.data);

      // Ensure onResult is defined before calling it
      if (onResult && typeof onResult === 'function') {
        onResult(response.data);
        Alert.alert('Success!', 'Uploaded image successfully!');
      } else {
        console.warn('onResult is not defined or is not a function');
      }
    } catch (error) {
      console.error('Error uploading image:', error); // Log error for debugging
      if (error.response) {
        console.error('Server responded with:', error.response.data); 
      }
      Alert.alert('Error', 'Failed to process image.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerBox}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.image} />
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>
          <View style={styles.centerButton}>
            <TouchableOpacity style={styles.button} onPress={() => uploadImage(imageUri)}>
              <Text style={styles.buttonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
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
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
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