// src/mealtime/MealTimeLogic.js
import { useState, useEffect } from 'react';
import { getUserData, saveUserData } from '../services/firebaseService'; // Ensure you have these functions

// Fetch meal data from Firebase
export const useMealData = (userId) => {
  const [totalMeals, setTotalMeals] = useState(2); // Default total meals (2)
  const [mealTimes, setMealTimes] = useState([
    { name: 'Morning', time: '08:30 AM' },
    { name: 'Afternoon', time: '12:30 PM' },
    { name: 'Evening', time: '08:00 PM' },
  ]);

  useEffect(() => {
    const loadMealData = async () => {
      const userDoc = await getUserData(userId);
      if (userDoc && userDoc.totalMeals !== undefined && userDoc.mealTimes) {
        setTotalMeals(userDoc.totalMeals);
        setMealTimes(userDoc.mealTimes);
      }
    };

    if (userId) {
      loadMealData();
    }
  }, [userId]);

  // Function to update meal data
  const updateMealData = async (newTotalMeals, newMealTimes) => {
    try {
      await saveUserData(userId, { totalMeals: newTotalMeals, mealTimes: newMealTimes });
      setTotalMeals(newTotalMeals);
      setMealTimes(newMealTimes);
    } catch (error) {
      console.error('Error saving meal data:', error);
      throw new Error('Failed to save meal data');
    }
  };

  return {
    totalMeals,
    mealTimes,
    updateMealData,
  };
};
