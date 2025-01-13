go thorugh all the codes files and understand the working and work flow of this project and also read reamde.md to understand more 
folders to go throough:-
1. app.js file
2. screens folder
3. mealtime folder
4. components folder
5. future.md
6. refer.md 
7. roadmap.md

{{ ... }}
# MedBuddy Project Changes Summary

## Key Changes Made During This Session
1. **HomeScreen.js Updates**:
   - Added loading state to manage fetching reminders.
   - Implemented `cancelAllReminders` function to cancel all active reminders and refresh the list.
   - Added confirmation alert when editing meal times to inform users that all reminders will be cancelled.
   - Updated the button to navigate to the `MealTimeEdit` screen.

2. **Firebase Service Updates**:
   - Updated the `saveUserData` function to check if `mealTimes` is defined and is an array before saving.

## Important Functions
- **fetchReminders**: Fetches active reminders from Firestore and updates the state.
- **cancelReminder**: Cancels a specific reminder by updating its status in Firestore.
- **cancelAllReminders**: Cancels all active reminders for the user.
- **handleMealDataUpdate**: Handles the logic for updating meal data and saving it to Firestore.

## Project Structure
- **app.js**: Main entry point for the application.
- **screens/**: Contains all screen components.
- **mealtime/**: Contains logic related to meal times.
- **components/**: Contains reusable components used throughout the app.

## Next Steps
- Continue testing the functionality of the reminders and meal times.
- Implement any additional features as needed.