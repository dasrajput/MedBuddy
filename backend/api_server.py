import traceback
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import time
# Import your existing processing function
from server import process_image_pipeline
from flask_cors import CORS
from zeroconf import IPVersion, ServiceInfo, Zeroconf
import socket
import ifaddr 
from waitress import serve
from PIL import Image

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB limit

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload directory if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health')
def health_check():
    return jsonify(status="OK", message="Server ready"), 200


@app.route('/process', methods=['POST'])
def process_image():
    try:
        print("\n--- New Request ---")
        
        # Critical fix for form data parsing
        if not request.content_type.startswith('multipart/form-data'):
            return jsonify({'error': 'Invalid content type. Use form-data'}), 400

        if 'image' not in request.files:
            print("Error: No 'image' key in request.files")
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        print(f"Received file: {file.filename}")
        print(f"Form Data: {request.form}")  # This should now show actual data

        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Save file
        filename = secure_filename(f"{int(time.time())}_{file.filename}")
        filepath = os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        file.save(filepath)
        print(f"File saved to: {filepath}")

        # Process image
        try:
            with open(filepath, 'rb') as f:
                if f.read(1) == b'':  # Verify non-empty file
                    raise ValueError("Empty file uploaded")
            
            results = process_image_pipeline(filepath)
            print(f"Processing results: {results}")
            # Check if no schedule was detected
            if results.get('detection_status') == 'no_schedule_detected':
                print("No medication schedule detected in the image")

            # Ensure JSON serialization
            return jsonify({
                'schedule': results['schedule'],
            'meal_relation': results['meal_relation']
            })

        except Exception as processing_error:
            print(f"Processing failed: {str(processing_error)}")
            traceback.print_exc()
            return jsonify({'error': f'Processing error: {str(processing_error)}'}), 500

    except Exception as e:
        print(f"Server error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def advertise_service():
    service_type = "_medbuddy._tcp.local."
    service_name = "MedBuddy Server._medbuddy._tcp.local."
    port = 5000
    
    # Get IP address
    host_ip = socket.gethostbyname(socket.gethostname())
    
    service_info = ServiceInfo(
        service_type,
        service_name,
        addresses=[socket.inet_aton(host_ip)],
        port=port,
        properties={'version': '1.0'},
        server="medbuddy.local."
    )
    
    zeroconf = Zeroconf()
    zeroconf.register_service(service_info)
    return zeroconf


# Start advertising when server starts
if __name__ == "__main__":
    advertiser = advertise_service()
    try:
        print(f"Running on http://{socket.gethostbyname(socket.gethostname())}:5000")
        serve(app, host='0.0.0.0', port=5000, threads=4)
    finally:
        advertiser.unregister_all_services()


# waitress-serve --port=5000 --url-scheme=http api_server:app