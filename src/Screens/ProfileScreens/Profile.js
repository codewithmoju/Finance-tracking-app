import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { colors, THEME_COLORS, SPACING, TYPOGRAPHY } from "../../global/styles";
import { auth, db, storage } from "../../../firebaseConfig"; // Firebase initialized
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [name, setName] = useState(""); // State for user's name
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser; // Get the currently logged-in user
      if (user) {
        const docRef = doc(db, "users", user.uid); // Reference to the user's document in Firestore
        const docSnap = await getDoc(docRef); // Fetch the user's document
        if (docSnap.exists()) {
          const userData = docSnap.data(); // Get user data from the document
          setName(userData.username || ""); // Set the user's name
          setProfileImageUrl(userData.profileImageUrl || null); // Set the user's profile image URL
        }
      }
    } catch (error) {
      Alert.alert("Error fetching user data", error.message); // Show error if fetching fails
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return; // Exit if no image is selected

    try {
      setUploading(true); // Set uploading state to true
      const user = auth.currentUser; // Get the currently logged-in user
      const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`); // Reference to the storage location
      const response = await fetch(imageUri); // Fetch the image from the URI
      const blob = await response.blob(); // Convert the image to a blob
      await uploadBytes(storageRef, blob); // Upload the image blob to Firebase Storage
      const downloadURL = await getDownloadURL(storageRef); // Get the download URL of the uploaded image
      await updateProfileImage(downloadURL); // Update the user's profile image in Firestore
      setProfileImageUrl(downloadURL); // Update the state with the new profile image URL

      Alert.alert("Success", "Profile picture updated successfully"); // Show success message
      setImageUri(null); // Hide the upload button by resetting imageUri to null
    } catch (error) {
      Alert.alert("Upload failed", error.message); // Show error if upload fails
    } finally {
      setUploading(false); // Reset uploading state
    }
  };

  const updateProfileImage = async (url) => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);

    await setDoc(
      userRef,
      { profileImageUrl: url, name: name },
      { merge: true }
    );

    // Save image URL and name in AsyncStorage
    try {
      await AsyncStorage.setItem("profileImageUrl", url);
      await AsyncStorage.setItem("username", name);
    } catch (error) {
      console.log("Error saving data to AsyncStorage", error);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => {
        Alert.alert("Error logging out", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Categories</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.pictureContainer}>
          <Image
            source={
              profileImageUrl
                ? { uri: profileImageUrl }
                : require("../../Drawable/Images/user.png")
            }
            style={styles.profileImage}
          />
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{name.toUpperCase()}</Text>
          </View>
          <View style={styles.allFunctions}>
            {imageUri && (
              <TouchableOpacity style={styles.card} onPress={uploadImage}>
                <MaterialIcons
                  name="upload"
                  color={THEME_COLORS.text.primary}
                  size={30}
                  style={styles.icon}
                />
                <Text style={styles.functionName}>Upload Picture</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.card} onPress={pickImage}>
              <FontAwesome
                name="user-circle-o"
                color={THEME_COLORS.text.primary}
                size={30}
                style={styles.icon}
              />
              <Text style={styles.functionName}>Change Profile Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={handleLogout}>
              <SimpleLineIcons
                name="logout"
                color={THEME_COLORS.danger.main}
                size={30}
                style={styles.icon}
              />
              <Text style={styles.functionName}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.primary.main,
  },
  header: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    color: THEME_COLORS.text.primary,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: height * 0.08,
  },
  scrollView: {
    paddingBottom: SPACING.md,
  },
  pictureContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
    padding: SPACING.md,
  },
  profileImage: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    borderWidth: 2,
    borderColor: THEME_COLORS.accent.main,
  },
  nameContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  nameText: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: "Poppins-Bold",
    textDecorationLine: "underline",
  },
  allFunctions: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  card: {
    width: "95%",
    height: height * 0.08,
    backgroundColor: THEME_COLORS.background.card,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    margin: SPACING.sm,
    borderBottomColor: THEME_COLORS.accent.main,
    borderBottomWidth: 2,
    padding: SPACING.md,
  },
  functionName: {
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: THEME_COLORS.text.primary,
    fontFamily: "Poppins-Regular",
    marginLeft: SPACING.md,
  },
  icon: {
    marginLeft: SPACING.sm,
  },
});
