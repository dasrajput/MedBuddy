# Future Enhancements for MedBuddy Application

## Medication Reminder Feature

### Overview
- A manual entry form for users to input medication details, including:
  - Medicine Name
  - Number of Pills
  - Timing (Before/After Meal)
  - Meal Selection (Morning/Afternoon/Evening)
  - Reminder Time (with a time picker)

### User Experience
- **Validation**: Ensure all fields are filled out correctly before submission.
- **Confirmation**: Display a success message after setting a reminder.
- **History Page**: A dedicated page to show:
  - History of medications taken (name, number of pills, date, time).
  - Options to delete entries.
  - Accessed from a bottom navigation panel for easy switching between Home and History.
- **Local Notifications**: Set reminders that notify the user at the specified time, with options to:
  - Mark the medicine as taken.
  - Reschedule the reminder (e.g., remind in 5 minutes).

### Integration with OCR Scanning
- The form will be a separate page that can be accessed after scanning a prescription sticker.
- Extracted data from the sticker will auto-fill the form fields, allowing the user to review and set the reminder with a single click.

### Technical Implementation
- **Frontend**: Continue using React Native for the UI.
- **State Management**: Use React's `useState` and `useEffect` for managing form states and side effects.
- **Backend**: Store medication history in Firebase Firestore.
- **Notifications**: Use `expo-notifications` for local reminders.

## User Interface Enhancements

### Active Reminders Section
- **Overview**: Display active reminders on the home screen.
- **Components**:
  - **Upload Image Button**: Allows users to upload an image of their medication.
  - **Manual Entry Button**: Redirects to the manual entry form.
  - **Active Reminders List**: Shows currently set reminders with options to manage them.

### Animation Feature
- **Image Upload Animation**: Show an animation when an image is uploaded successfully.
- **Redirect**: After the upload, redirect users to the set reminder page.

### Navigation
- **Bottom Navigation Panel**: Include easy access to the History page and Home screen.

---

This document serves as a roadmap for future enhancements and features to be integrated into the MedBuddy application.

---

This section outlines the user interface enhancements for better navigation and user experience.
