# MedBuddy Backend Server

This is the backend server for the MedBuddy application. It provides API endpoints for the mobile application to interact with.

## Prerequisites

Before running the server, make sure you have the following installed:
- Python 3.7 or higher
- pip (Python package manager)

## Setup Instructions

1. Clone the repository (if you haven't already)

2. Navigate to the backend directory:
   ``` cd backend ```

3. Install required dependencies:
   ```bash
     pip install flask flask-cors waitress requests pillow numpy opencv-python tensorflow
   ```
   
### Production Deployment

For production deployment, we use Waitress as a WSGI server:

1. Start the Waitress server:
   ```bash
     waitress-serve --port=5000 --url-scheme=http api_server:app
   ```

2. To make the server accessible over the internet using PageKite:
   ```bash
     python pagekite.py 5000 mymedbuddy.pagekite.me
   ```

Note: You'll need to sign up for a PageKite account and activate your kite the first time.

## API Endpoints

- `POST /upload`: Upload and process medication images
- `GET /health`: Health check endpoint

## Troubleshooting

- If you encounter issues with PageKite, ensure you've activated your account and kite name.
- For OCR issues, verify that Tesseract is properly installed and accessible in your PATH.
- If the server fails to start, check if port 5000 is already in use by another application.



