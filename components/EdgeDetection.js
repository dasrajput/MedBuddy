import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    console.log("Attempting to pick an image..."); // Debug statement
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Image selected:", result.assets[0].uri); // Debug statement
      setSelectedImage(result.assets[0].uri);
      setProcessedImage(null); // Reset the processed image
    } else {
      console.log("No image selected"); // Debug statement
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please select an image first.");
      console.log("No image selected for upload"); // Debug statement
      return;
    }

    setLoading(true);
    console.log("Uploading image..."); // Debug statement

    const formData = new FormData();
    formData.append("image", {
      uri: selectedImage,
      name: "image.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await fetch("http://192.168.140.16:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Image processed successfully. Processed image URL:", data.processed_image_url); // Debug statement
        setProcessedImage(`http://192.168.140.16:5000${data.processed_image_url}`);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Something went wrong");
        console.log("Error while processing image:", errorData); // Debug statement
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
      console.error("Error uploading image:", error); // Debug statement
    } finally {
      setLoading(false);
      console.log("Upload process finished."); // Debug statement
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sticker Edge Detection</Text>

      <Button title="Pick an Image" onPress={pickImage} />

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.image} />
      )}

      <Button
        title="Upload and Process"
        onPress={uploadImage}
        disabled={loading}
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {processedImage && (
        <Image source={{ uri: processedImage }} style={styles.image} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginVertical: 10,
    resizeMode: "contain",
  },
});
