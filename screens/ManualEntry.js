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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useMealData } from "../mealtime/MealTimeLogic"; // Import the useMealData hook
import DateTimePicker from "@react-native-community/datetimepicker"; // Import DateTimePicker for custom time selection
import { saveReminder } from "../services/firebaseService";
import { useNavigation } from "@react-navigation/native";
import dayjs from 'dayjs';

const ToggleButtonGroup = ({ options, selected, onSelect, style }) => (
  <View style={[styles.toggleContainer, style]}>
    {options.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.toggleButton,
          selected === option.value && styles.selectedToggle
        ]}
        onPress={() => onSelect(option.value)}
      >
        <Text style={styles.toggleButtonText}>
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const ManualEntry = ({ route }) => {
  const { userId, ocrResults = {} } = route.params;
  const navigation = useNavigation();

  if (!userId) {
    Alert.alert("Error", "User authentication required");
    navigation.goBack();
    return null;
  }

  const [mealTimes] = useState([]); // Default to empty array

  const [schedules, setSchedules] = useState([{
    timeLabel: 'morning',
    pills: '1',
    mealRelation: 'before',
    timingType: 'meal'
  }]);
  const [currentSchedule, setCurrentSchedule] = useState({
    pills: '',
    time: 'morning',
    mealRelation: 'before'
  });
  const [medicineName, setMedicineName] = useState("Medicine A");
  const [numberOfPills, setNumberOfPills] = useState("2"); // Default to 2 pill
  const [timingType, setTimingType] = useState("meal"); // 'meal' or 'custom'
  const [mealTiming, setMealTiming] = useState("before"); // 'before' or 'after'
  const [mealType, setMealType] = useState(ocrResults?.schedule?.[0]?.time?.toLowerCase() || 'morning');
  const [reminderDateTime, setReminderDateTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false); // Initialize showDatePicker state
  const { mealTimes: mealTimesFromData } = useMealData(userId); // Fetch meal times from Firestore
  const [loading, setLoading] = useState(false);
  const [selectedDateOption, setSelectedDateOption] = useState("today"); // Default to 'today'
  const [reminderTime, setReminderTime] = useState(new Date());
  const [reminderDate, setReminderDate] = useState(new Date());
  const [dateOptions, setDateOptions] = useState([]);
  const [autoDate, setAutoDate] = useState(new Date());

  useEffect(() => {
    console.log('Received OCR Results:', route.params?.ocrResults);
    
    if (route.params?.ocrResults?.schedule) {
      Alert.alert('OCR Data Loaded', 'Auto-filling detected schedule');
    }
  }, [route.params]);

  useEffect(() => {
    if (ocrResults) {
      // Extract first schedule entry
      const firstSchedule = ocrResults.schedule?.[0] || {};
      const mealRelation = ocrResults.meal_relation || 'before';

      setNumberOfPills(String(firstSchedule.pills || ''));
      setMealType(firstSchedule.time?.toLowerCase() || 'morning');
      setMealTiming(mealRelation);
    }
  }, [ocrResults]);

  useEffect(() => {
    if (ocrResults?.schedule) {
      const validSchedules = ocrResults.schedule
        .filter(item => item.pills > 0) // Only keep schedules with pills > 0
        .map(item => ({
          timeLabel: item.time || 'morning',
          pills: item.pills.toString(),
          mealRelation: ocrResults.meal_relation || 'before',
          timingType: 'meal'
        }));
      
      // Fallback to default if no valid schedules
      setSchedules(validSchedules.length > 0 ? validSchedules : [{
        timeLabel: 'morning',
        pills: '1',
        mealRelation: 'before',
        timingType: 'meal'
      }]);
    }
  }, [ocrResults]);

  useEffect(() => {
    if (!ocrResults?.schedule) {
      Alert.alert('No Schedule Found', 'Please create a reminder manually');
    }
  }, []);

  useEffect(() => {
    // Access CORRECT property name
    const receivedData = route.params?.ocrResults;
    
    if (receivedData?.schedule) {
      console.log('Valid OCR Data:', receivedData);
      Alert.alert('Schedule Loaded', `Found ${receivedData.schedule.length} entries`);
    }
  }, [route.params]);

  useEffect(() => {
    const calculateDefaultDate = () => {
      if (timingType === 'meal' && mealTimesFromData.length > 0) {
        const calculatedTime = calculateMealTime();
        const now = new Date();
        
        // Determine if we should use today or tomorrow
        const isTodayValid = calculatedTime > now;
        const defaultDateOption = isTodayValid ? 'today' : 'tomorrow';
        const defaultDate = isTodayValid ? new Date() : dayjs().add(1, 'day').toDate();

        setDateOptions([
          { value: 'today', label: 'Today', disabled: !isTodayValid },
          { value: 'tomorrow', label: 'Tomorrow' },
          { value: 'custom', label: 'Custom Date' }
        ]);
        
        setSelectedDateOption(defaultDateOption);
        setAutoDate(defaultDate);
        setReminderDate(defaultDate);
      }
    };

    calculateDefaultDate();
  }, [mealType, mealTiming, timingType, mealTimesFromData]);

  useEffect(() => {
    if (mealTimesFromData.length > 0) {
      const defaultMeal = mealTimesFromData[0].name;
      setMealType(defaultMeal);
      // Initialize reminder time with first meal's time
      const initialTime = parseMealTime(mealTimesFromData[0].time);
      setReminderTime(initialTime);
    }
  }, [mealTimesFromData]); // Reset when mealTimes update

  useEffect(() => {
    const calculateReminderTime = () => {
      const currentSchedule = schedules[0];
      
      // Find matching meal time
      const selectedMeal = mealTimesFromData.find(meal => 
        meal.name.toLowerCase() === currentSchedule.timeLabel
      );
      
      if (selectedMeal) {
        let baseTime = parseMealTime(selectedMeal.time);
        
        // Apply offsets based on meal relation
        if (currentSchedule.mealRelation === 'before') {
          baseTime.setMinutes(baseTime.getMinutes() - 15); // 15 mins before meal
        } else {
          baseTime.setMinutes(baseTime.getMinutes() + 30); // 30 mins after meal
        }
        
        // Preserve existing date components
        const newTime = new Date(reminderDate);
        newTime.setHours(baseTime.getHours(), baseTime.getMinutes());
        
        setReminderTime(newTime);
      }
    };

    calculateReminderTime();
  }, [schedules, mealTimesFromData]);

  const handleDateOptionChange = (option) => {
    setSelectedDateOption(option);
    let newDate = new Date();

    switch(option) {
      case 'today':
        newDate = autoDate;
        break;
      case 'tomorrow':
        newDate = dayjs(autoDate).add(1, 'day').toDate();
        break;
      case 'custom':
        setShowDatePicker(true);
        return;
    }
    
    // Preserve time components when changing dates
    newDate.setHours(reminderDate.getHours());
    newDate.setMinutes(reminderDate.getMinutes());
    setReminderDate(newDate);
  };

  const handleDatePickerChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
        setReminderDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime, index) => {
    setShowTimePicker(null);
    const newTime = selectedTime || schedules[index].timeValue || new Date();
    
    const updatedSchedules = [...schedules];
    updatedSchedules[index].timeValue = newTime;
    setSchedules(updatedSchedules);
  };

  const parseMealTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Create Date object with today's date
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date;
  };

  const handleMealTypeChange = (itemValue) => {
    setMealType(itemValue);
    const selectedMeal = mealTimesFromData.find((meal) => meal.name === itemValue);
    if (selectedMeal) {
      const mealTime = parseMealTime(selectedMeal.time);
      setReminderDateTime(mealTime); // Update reminderTime with the parsed meal time
    }
  };
  
  const parseTimeString = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return { hours: parseInt(hours), minutes: parseInt(minutes) };
  };

  const calculateReminderTime = (mealTimes = [], timeLabel, mealRelation) => {
    if (!timeLabel) {
      console.error('Missing timeLabel');
      return '08:30 AM';
    }
    
    try {
      // Find matching meal time
      const mealConfig = (mealTimes || []).find(m => 
        m.name.toLowerCase() === timeLabel.toLowerCase()
      );
      
      if (!mealConfig) {
        console.error('No meal time found for:', timeLabel);
        return '08:30 AM'; // Fallback
      }

      // Parse meal time to Date object
      const baseTime = parseMealTime(mealConfig.time);
      
      // Clone the Date object to avoid mutation issues
      const reminderTime = new Date(baseTime);

      // Apply offsets
      if (mealRelation === 'before') {
        reminderTime.setMinutes(reminderTime.getMinutes() - 15);
      } else {
        reminderTime.setMinutes(reminderTime.getMinutes() + 15);
      }

      // Handle date rollover
      const now = new Date();
      if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      // Format to AM/PM
      let hours = reminderTime.getHours();
      const minutes = reminderTime.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert to 12-hour format

      return `${hours}:${minutes} ${period}`;

    } catch (error) {
      console.error('Time calculation error:', error);
      return '08:30 AM'; // Fallback
    }
  };

  const findMealTime = (timeLabel) => {
    // Normalize both values to lowercase for comparison
    const normalizedLabel = (timeLabel || 'morning').toLowerCase().trim();
    
    const mealTime = mealTimesFromData.find(m => 
      m.name.toLowerCase() === normalizedLabel
    );

    if (!mealTime) {
      throw new Error(`No meal time configured for ${timeLabel}`);
    }
    return mealTime;
  };

  const getAdjustedDate = (baseDate, days = 0) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  

  const calculateTargetTime = (timeLabel, mealRelation, baseDate) => {
    const timeMap = {
      morning: { hour: 8, minute: 0 },
      afternoon: { hour: 12, minute: 0 },
      evening: { hour: 18, minute: 0 }
    };

    const date = new Date(baseDate);
    const { hour, minute } = timeMap[timeLabel.toLowerCase()] || timeMap.morning;
    
    // Set base time
    date.setHours(hour);
    date.setMinutes(minute + (mealRelation === 'before' ? -15 : 30));
    date.setSeconds(0);

    // Handle past times
    const now = new Date();
    if (date < now) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  };

  const getHardcodedTime = (timeLabel, mealRelation) => {
    console.log('[DEBUG] Input values:', { 
      timeLabel, 
      mealRelation 
    });

    const timeMap = {
      morning: {
        before: '8:15 AM',
        after: '8:45 AM'
      },
      afternoon: {
        before: '12:15 PM',
        after: '12:45 PM'
      },
      evening: {
        before: '7:45 PM',
        after: '8:15 PM'
      }
    };

    const normalizedLabel = (timeLabel || 'morning').toLowerCase().trim();
    const normalizedRelation = (mealRelation || 'before').toLowerCase().trim();
    
    console.log('[DEBUG] Normalized values:', {
      normalizedLabel,
      normalizedRelation
    });

    const result = timeMap[normalizedLabel]?.[normalizedRelation] || '8:15 AM';
    console.log('[DEBUG] Calculated time:', result);
    
    return result;
  };

  const convertToISO = (timeStr) => {
    console.log('[CONVERT] Input time:', timeStr);
    
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    console.log('[CONVERT] Parsed:', { hours, minutes, period });

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    console.log('[CONVERT] Initial date:', date.toISOString());

    if (date < new Date()) {
      console.log('[CONVERT] Time in past, adding 1 day');
      date.setDate(date.getDate() + 1);
    }
    
    console.log('[CONVERT] Final ISO date:', date.toISOString());
    return date.toISOString();
  };

  const handleSave = async () => {
    try {
      const validSchedules = schedules.filter(schedule => {
        const isValid = parseInt(schedule.pills) > 0;
        if (!isValid) console.warn('[SAVE] Invalid schedule:', schedule);
        return isValid;
      });
      
      if (validSchedules.length === 0) {
        throw new Error('Please add at least 1 pill to each schedule');
      }

      console.log('[SAVE] Starting save process with schedules:', schedules);
      
      const reminders = schedules.map((schedule, index) => {
        const reminderTime = getHardcodedTime(
          schedule.timeLabel, 
          schedule.mealRelation
        );

        // Add this line to create reminderDate
        // Alternative version with Day.js validation
        const a = convertToISO(reminderTime)
        const reminderDate = dayjs(a).format('YYYY-MM-DD');
      
        
        console.log(`[SAVE] Schedule ${index + 1}:`, {
          timeLabel: schedule.timeLabel,
          mealRelation: schedule.mealRelation,
          calculatedTime: reminderTime
        });

        return {
          medicineName: medicineName || 'Medication',
          timeLabel: schedule.timeLabel,
          pills: schedule.pills,
          mealRelation: schedule.mealRelation,
          reminderTime,
          reminderDate,
          scheduledTime: convertToISO(reminderTime),
          status: 'active'
        };
      });

      console.log('[SAVE] Final reminders to save:', reminders);
      await Promise.all(reminders.map(reminder => 
        saveReminder(userId, reminder)
      ));
      
      Alert.alert('Success', 'Reminders saved');
      navigation.goBack();
    } catch (error) {
      console.error('[ERROR] Save failed:', error);
      Alert.alert('Error', `Save failed: ${error.message}`);
    }
  };

  const updateSchedule = (index, field, value) => {
    console.log('[SCHEDULE UPDATE]', { index, field, value });
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const addSchedule = () => {
    setSchedules([...schedules, {
      timeLabel: mealTimesFromData[0]?.name || 'Morning',
      pills: '1',
      mealRelation: 'before',
      timingType: 'meal'
    }]);
  };

  const removeSchedule = (index) => {
    if (schedules.length > 1) {
      const newSchedules = schedules.filter((_, i) => i !== index);
      setSchedules(newSchedules);
    }
  };

  const adjustPills = (index, delta) => {
    const currentValue = parseInt(schedules[index].pills) || 0;
    const newValue = Math.max(1, currentValue + delta); // Minimum 1 pill
    console.log('[PILLS] Adjusting:', { index, currentValue, delta, newValue });
    updateSchedule(index, 'pills', newValue.toString());
  };

  // Meal time calculation from old implementation
  const calculateMealTime = () => {
    const selectedMeal = mealTimesFromData.find(meal => meal.name === mealType);
    if (!selectedMeal) return new Date();

    let mealTime = parseMealTime(selectedMeal.time);
    // Apply offsets
    if (mealTiming === "before") {
      mealTime.setMinutes(mealTime.getMinutes() - 5);
    } else if (mealTiming === "after") {
      mealTime.setMinutes(mealTime.getMinutes() + 15);
    }
    return mealTime;
  };

  // Smart date display component
  const DateSelector = ({ options, selected, onSelect }) => (
    <View style={styles.dateOptionContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => !option.disabled && onSelect(option.value)}
          style={[
            styles.dateOptionButton,
            selected === option.value && styles.activeDateOption,
            option.disabled && styles.disabledOption
          ]}
          disabled={option.disabled}
        >
          <Text style={[
            styles.dateOptionText,
            option.disabled && styles.disabledText
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const parseTimeLabel = (ocrTime) => {
    const mappings = {
      'noon': 'afternoon',
      'night': 'evening',
      'dinner': 'evening'
    };
    return mappings[ocrTime.toLowerCase()] || ocrTime.toLowerCase();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add Reminder</Text>
        
        {/* Medicine Name Input */}
        <TextInput
          style={styles.input}
          placeholder="Medicine Name"
          placeholderTextColor="#666"
          value={medicineName}
          onChangeText={setMedicineName}
          defaultValue="Medicine A"
        />
        
        {ocrResults?.schedule && (
          <View style={styles.schedulePreview}>
            <Text style={styles.ocrNotice}>Detected Schedule:</Text>
            {ocrResults.schedule.map((entry, index) => (
              <Text key={index} style={styles.scheduleText}>
                {entry.time}: {entry.pills} pills
              </Text>
            ))}
            <Text style={styles.scheduleText}>
              Take medication: {ocrResults.meal_relation || 'before'} meal
            </Text>
          </View>
        )}

        {schedules
          .filter(schedule => parseInt(schedule.pills) > 0)
          .map((schedule, index) => (
            <View key={index} style={styles.scheduleCard}>
              <TouchableOpacity 
                onPress={() => removeSchedule(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
              
              <Text style={styles.scheduleTitle}>{schedule.timeLabel} Schedule</Text>
              
              <Text style={styles.label}>Time of Day</Text>
              <ToggleButtonGroup
                options={[
                  { label: 'Morning', value: 'morning' },
                  { label: 'Afternoon', value: 'afternoon' },
                  { label: 'Evening', value: 'evening' }
                ]}
                selected={schedule.timeLabel}
                onSelect={value => updateSchedule(index, 'timeLabel', value)}
                style={{ marginBottom: 15 }}
              />

              <Text style={styles.label}>Timing Type</Text>
              <ToggleButtonGroup
                options={[
                  { label: 'Meal-based', value: 'meal' },
                  { label: 'Custom Time', value: 'custom' }
                ]}
                selected={timingType}
                onSelect={setTimingType}
                style={{ marginBottom: 15 }}
              />

              <View style={styles.section}>
                <Text style={styles.label}>Reminder Date:</Text>
                <DateSelector 
                  options={dateOptions}
                  selected={selectedDateOption}
                  onSelect={handleDateOptionChange}
                />
                
                {selectedDateOption === 'custom' && (
                  <View>
                    <TouchableOpacity 
                      onPress={() => setShowDatePicker(true)}
                      style={styles.timeInput}
                    >
                      <Text style={styles.timePickerText}>
                        {dayjs(reminderDate).format("MMM D, YYYY")}
                      </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={reminderDate}
                        mode="date"
                        minimumDate={new Date()}
                        onChange={(event, date) => {
                          setShowDatePicker(false);
                          if (date) {
                            setReminderDate(date);
                          }
                        }}
                      />
                    )}
                  </View>
                )}
              </View>

              {timingType === "custom" && (
                <View style={styles.section}>
                  <Text style={styles.label}>Custom Time:</Text>
                  <TouchableOpacity 
                    onPress={() => setShowTimePicker(true)}
                    style={styles.timeInput}
                  >
                    <Text style={styles.timePickerText}>
                      {dayjs(reminderTime).format("h:mm A")}
                    </Text>
                  </TouchableOpacity>
                  
                  {showTimePicker && (
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      onChange={(event, time) => {
                        setShowTimePicker(false);
                        if (time) {
                          setReminderTime(time);
                        }
                      }}
                    />
                  )}
                </View>
              )}

              {timingType === "meal" && (
                <View style={styles.section}>
                  <Text style={styles.label}>Meal Relation:</Text>
                  <ToggleButtonGroup
                    options={[
                      { label: 'Before Meal', value: 'before' },
                      { label: 'After Meal', value: 'after' }
                    ]}
                    selected={schedule.mealRelation}
                    onSelect={value => {
                      console.log('[UI] Meal relation changed:', { index, value });
                      updateSchedule(index, 'mealRelation', value);
                    }}
                  />
                </View>
              )}

              <Text style={styles.label}>Number of Pills</Text>
              <View style={styles.pillCounter}>
                <TouchableOpacity 
                  onPress={() => adjustPills(index, -1)}
                  style={styles.counterButton}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                
                <TextInput
                  value={schedule.pills}
                  onChangeText={text => updateSchedule(index, 'pills', text)}
                  style={styles.pillInput}
                  keyboardType="numeric"
                />
                
                <TouchableOpacity 
                  onPress={() => adjustPills(index, 1)}
                  style={styles.counterButton}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        <View style={styles.scheduleControls}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addSchedule}
          >
            <Text style={styles.addButtonText}>
              🗓️➕ Add New Schedule
            </Text>
          </TouchableOpacity>
          {schedules.length > 1 && (
            <Button
              title="Remove Last Schedule"
              onPress={removeSchedule}
              color="#FF5252"
            />
          )}
        </View>

        <View style={{ alignItems: "center", marginTop: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <Button
              title="➕ Add Reminder"
              onPress={handleSave}
              color="#4CAF50"
            />
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Add your styles here
const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, // Add space for keyboard
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FFFFFF",
  },
  ocrNotice: {
    color: '#4CAF50',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  schedulePreview: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  scheduleText: {
    color: '#FFFFFF',
    marginBottom: 5,
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
  timePickerContainer: {
    marginBottom: 20
  },
  timePickerButton: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 16
  },
  timePickerText: {
    color: '#4CAF50',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center'
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF",
  },
  timingContainer: {
    marginBottom: 20,
  },
  
    scheduleCard: {
      backgroundColor: '#1E1E1E',
      borderRadius: 10,
      padding: 15,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: '#333',
    },
    scheduleTitle: {
      color: '#4CAF50',
      fontSize: 16,
      fontWeight: '600',
    },
  
  scheduleControls: {
    gap: 10,
    marginBottom: 20
  },
  spacer: {
    height: 50 // Adds scrollable space at bottom
  },
  pillCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15
  },
  counterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pillInput: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    color: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    minWidth: 100
  },
  selectedToggle: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5
  },
  datetimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  disabledOption: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  disabledText: {
    color: '#666',
  },
  activeDateOption: {
    backgroundColor: '#4CAF50',
  },
  timeInput: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#ff4444',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5
  },
  section: {
    marginBottom: 20
  },
});
export default ManualEntry;
