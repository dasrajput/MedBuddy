import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useMealData } from "../mealtime/MealTimeLogic"; // Import the useMealData hook
import DateTimePicker from "@react-native-community/datetimepicker"; // Import DateTimePicker for custom time selection
import { saveReminder } from "../services/firebaseService";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";

const ManualEntry = ({ route }) => {
  const { userId } = route.params;
  const [medicineName, setMedicineName] = useState("");
  const [numberOfPills, setNumberOfPills] = useState("1"); // Default to 1 pill
  const [timingType, setTimingType] = useState("meal"); // 'custom' or 'meal'
  const [mealTiming, setMealTiming] = useState("before"); // 'before' or 'after'
  const [mealType, setMealType] = useState(""); // Morning, Afternoon, Evening
  const [reminderTime, setReminderTime] = useState(new Date()); // Initialize with current date and time
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false); // Initialize showDatePicker state
  const { mealTimes } = useMealData(userId); // Fetch meal times from Firestore
  const navigation = useNavigation();
  const [reminderDate, setReminderDate] = useState(new Date()); // Initialize with current date
  const [loading, setLoading] = useState(false);
  const [selectedDateOption, setSelectedDateOption] = useState("today"); // Default to 'today'
  
  useEffect(() => {
    // Set default medicine name based on existing reminders logic
    const existingReminders = []; // Replace with actual logic to fetch reminders
    if (existingReminders.length === 0) {
      setMedicineName("Medicine A");
    } else {
      const lastMedicine = existingReminders[existingReminders.length - 1].name;
      setMedicineName(
        lastMedicine === "Medicine A" ? "Medicine B" : "Medicine A"
      );
    }
  }, []);

  const handleDateOptionChange = (option) => {
    setSelectedDateOption(option);
    let dateToSet = new Date(); // Initialize with the current date

    if (option === "today") {
      // Today's date is already set in dateToSet
      setReminderDate(dateToSet); // Update reminder date to today
    } else if (option === "tomorrow") {
      dateToSet.setDate(dateToSet.getDate() + 1); // Set to tomorrow's date
      setReminderDate(dateToSet); // Update reminder date to tomorrow
    } else if (option === "custom") {
      // Show date picker for custom date selection
      setShowDatePicker(true);
    }
  };

  const handleDatePickerChange = (event, selectedDate) => {
    const currentDate = selectedDate || reminderDate;
    setShowDatePicker(false);
    setReminderDate(currentDate); // Set the selected date
  };

  const handleTimePickerChange = (event, selectedTime) => {
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }
  
    const currentTime = selectedTime || reminderTime;
    setShowTimePicker(false);
    setReminderTime(currentTime); // Update only the time
  };

  // Function to parse meal time string to a Date object
  const parseMealTime = (mealTimeString) => {
    const [time, period] = mealTimeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hours24 = period === "PM" && hours !== 12 ? hours + 12 : hours;
    hours24 = period === "AM" && hours === 12 ? 0 : hours24; // Handle 12 AM case
    const mealTimeDate = new Date();
    mealTimeDate.setHours(hours24, minutes, 0, 0);
    return mealTimeDate;
  };
  const handleMealTypeChange = (itemValue) => {
    setMealType(itemValue);
    const selectedMeal = mealTimes.find((meal) => meal.name === itemValue);
    if (selectedMeal) {
      const mealTime = parseMealTime(selectedMeal.time);
      setReminderTime(mealTime); // Update reminderTime with the parsed meal time
    }
  };
  
  const handleAddReminder = async () => {
    let finalReminderTime = reminderTime;
    
    if (timingType === "meal") {
      const selectedMeal = mealTimes.find((meal) => meal.name === mealType);
      if (selectedMeal) {
        const mealTime = parseMealTime(selectedMeal.time);
  
        // Adjust reminder time based on meal timing
        if (mealTiming === "before") {
          finalReminderTime = new Date(mealTime.getTime() - 5 * 60 * 1000); // 5 minutes before
        } else if (mealTiming === "after") {
          finalReminderTime = new Date(mealTime.getTime() + 15 * 60 * 1000); // 15 minutes after
        }
      }
    }
    
    const reminderDateString = dayjs(reminderDate).format("YYYY-MM-DD");
    const reminderTimeString = dayjs(finalReminderTime).format("HH:mm:ss");

    console.log("Add Reminder button clicked"); // Debug statement to confirm button click
    setLoading(true);
    
    const reminderData = {
      medicineName,
      numberOfPills,
      reminderDate: reminderDateString, // Save only the date part
      reminderTime: reminderTimeString, // Save only the time part
      status: "active", // Initial status
    };
  
    console.log("Attempting to save reminder data to Firestore:", reminderData);
  
    const result = await saveReminder(userId, reminderData); // Save reminder to Firebase
    console.log("Result from saveReminder:", result); // Debug statement
    setLoading(false);
  
    if (result.success) {
      Alert.alert("Reminder Set Successfully", "", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("Home", { userId, refreshReminders: true }), // Redirect to Home screen
        },
      ]);
    } else {
      Alert.alert("Error", result.error);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Reminder</Text>
      <TextInput
        style={styles.input}
        placeholder="Medicine Name"
        value={medicineName}
        onChangeText={setMedicineName}
        placeholderTextColor="#FFFFFF"
      />
      <Text style={styles.label}>Number of Pills:</Text>
      <View style={styles.numberPickerContainer}>
        <TouchableOpacity
          onPress={() =>
            setNumberOfPills((prev) =>
              parseInt(prev) > 1 ? (parseInt(prev) - 1).toString() : "1"
            )
          }
        >
          <Text style={styles.numberPickerButton}>-</Text>
        </TouchableOpacity>
        <Text style={styles.numberPickerText}>{numberOfPills}</Text>
        <TouchableOpacity
          onPress={() =>
            setNumberOfPills((prev) =>
              parseInt(prev) < 5 ? (parseInt(prev) + 1).toString() : "5"
            )
          }
        >
          <Text style={styles.numberPickerButton}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Select Date:</Text>
      <View style={styles.dateOptionContainer}>
        <TouchableOpacity
          onPress={() => handleDateOptionChange("today")}
          style={styles.dateOptionButton}
        >
          <Text style={styles.dateOptionText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDateOptionChange("tomorrow")}
          style={styles.dateOptionButton}
        >
          <Text style={styles.dateOptionText}>Tomorrow</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDateOptionChange("custom")}
          style={styles.dateOptionButton}
        >
          <Text style={styles.dateOptionText}>Custom Date</Text>
        </TouchableOpacity>
        {selectedDateOption === "custom" && (
          <View>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.timePickerText}>
                {reminderDate
                  ? reminderDate.toLocaleDateString()
                  : "Select Date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={reminderDate}
                mode="date"
                display="default"
                onChange={handleDatePickerChange}
              />
            )}
          </View>
        )}
      </View>

      <Text style={styles.label}>Timing Type:</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            timingType === "custom" && styles.activeToggle,
          ]}
          onPress={() => setTimingType("custom")}
        >
          <Text style={styles.toggleText}>Custom Timing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            timingType === "meal" && styles.activeToggle,
          ]}
          onPress={() => setTimingType("meal")}
        >
          <Text style={styles.toggleText}>Meal Based</Text>
        </TouchableOpacity>
      </View>
      {timingType === "meal" && (
        <View>
          <Text style={styles.label}>Meal Timing:</Text>
          <Picker
            selectedValue={mealTiming}
            onValueChange={(itemValue) => setMealTiming(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Before Meal" value="before" />
            <Picker.Item label="After Meal" value="after" />
          </Picker>
          <Text style={styles.label}>Select Meal Type:</Text>
          <Picker
            selectedValue={mealType}
            onValueChange={handleMealTypeChange} // Use the new handler
            style={styles.picker}
          >
            {mealTimes.map((meal, index) => (
              <Picker.Item
                key={index}
                label={`${meal.name} at ${meal.time}`}
                value={meal.name}
              />
            ))}
          </Picker>
        </View>
      )}

      {timingType === "custom" && (
        <View>
          <Text style={styles.label}>Select Reminder Time:</Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timePickerText}>
              {reminderTime ? reminderTime.toLocaleTimeString() : "Select Time"}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={false} // Set to false for 12-hour format
              display="default"
              onChange={handleTimePickerChange}
            />
          )}
        </View>
      )}

      <View style={{ alignItems: "center", marginTop: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <Button
            title="Add Reminder"
            onPress={handleAddReminder}
            color="#4CAF50"
          />
        )}
      </View>
    </View>
  );
};

// Add your styles here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FFFFFF",
  },
  input: {
    height: 50,
    borderColor: "#4CAF50",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
  },
  label: {
    color: "#FFFFFF",
    marginBottom: 5,
  },
  dateOptionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateOptionButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#1E1E1E",
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  dateOptionText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  timePickerText: {
    color: "#FFFFFF",
    fontSize: 18,
    padding: 10,
    borderColor: "#4CAF50",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#1E1E1E",
    textAlign: "center",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF",
  },
  timingContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    marginBottom: 5,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#1E1E1E",
    borderRadius: 5,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "#4CAF50",
  },
  toggleText: {
    color: "#FFFFFF",
  },
  numberPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  numberPickerButton: {
    backgroundColor: "#4CAF50",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  numberPickerText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  timePickerText: {
    color: "#FFFFFF",
    fontSize: 18,
    padding: 10,
    borderColor: "#4CAF50",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#1E1E1E",
    textAlign: "center",
  },
});
export default ManualEntry;
