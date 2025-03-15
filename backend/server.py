from ultralytics import YOLO
import cv2
import numpy as np
import os
from together import Together
import base64
import json
import re

# Configuration
API_KEY = "901c53bb2baeb54599058304e1d92ec44d905c479d0320df53af360ab1bc6692"
DETECTION_MODEL_PATH = 'best.pt'
STICKER_OUTPUT_DIR = "detected_stickers"
JSON_OUTPUT_DIR = "json_results"

def process_image_pipeline(input_image_path):
    # Initialize models
    detection_model = YOLO(DETECTION_MODEL_PATH)
    together_client = Together(api_key=API_KEY)

    # Create output directories
    os.makedirs(STICKER_OUTPUT_DIR, exist_ok=True)
    os.makedirs(JSON_OUTPUT_DIR, exist_ok=True)

    
    # Load the image
    image = cv2.imread(input_image_path)
    if image is None:
        raise ValueError("Could not read image file")

    # Perform detection
    results = detection_model.predict(image, conf=0.5, verbose=False)
        
    all_results = []
    json_result = None

    for result in results:
        if result.masks is not None:
            for i, mask in enumerate(result.masks.xy):
                # Image processing for sticker extraction
                polygon = mask.astype(np.int32)
                original_height, original_width = image.shape[:2]
                blank = np.zeros((original_height, original_width), dtype=np.uint8)
                cv2.fillPoly(blank, [polygon], color=255)
                masked_image = cv2.bitwise_and(image, image, mask=blank)
                x, y, w, h = cv2.boundingRect(polygon)
                cropped_sticker = masked_image[y:y+h, x:x+w]

                # Save sticker
                sticker_path = os.path.join(STICKER_OUTPUT_DIR, f"sticker_{i+1}.png")
                cv2.imwrite(sticker_path, cropped_sticker)

                # Process sticker through medical schedule parser
                json_result = process_med_schedule(sticker_path, together_client)
                if json_result:
                    # Save JSON output
                    json_path = os.path.join(JSON_OUTPUT_DIR, f"result_{i+1}.json")
                    with open(json_path, 'w') as f:
                        json.dump(json_result, f, indent=2)
                    all_results.append(json_result)

    if not json_result:
        json_result = {
            "schedule": [
                {"time": "morning", "pills": 0},
                {"time": "noon", "pills": 0},
                {"time": "evening", "pills": 0}
            ],
            "meal_relation": "before",
            "detection_status": "no_schedule_detected"
        }
                    
    return json_result

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return f"data:image/png;base64,{base64.b64encode(image_file.read()).decode('utf-8')}"

def extract_json_from_response(text):
    code_block_match = re.search(r'```(?:json)?\s*({.*?})\s*```', text, re.DOTALL)
    if code_block_match:
        text = code_block_match.group(1)
    
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if not json_match:
        return None
    
    json_str = json_match.group(0)
    json_str = json_str.replace("'", '"')
    json_str = re.sub(r'/\*.*?\*/', '', json_str)
    json_str = re.sub(r'//.*', '', json_str)
    json_str = json_str.strip(' \n\t\r')
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        try:
            json_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
            json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
            return json.loads(json_str)
        except json.JSONDecodeError:
            return None

def validate_schema(parsed):
    if not isinstance(parsed, dict):
        return False
    if "schedule" not in parsed or "meal_relation" not in parsed:
        return False
    if not isinstance(parsed["schedule"], list) or len(parsed["schedule"]) != 3:
        return False
    for entry in parsed["schedule"]:
        if "time" not in entry or "pills" not in entry:
            return False
        if entry["time"] not in ["morning", "noon", "evening"]:
            return False
        if not isinstance(entry["pills"], int) or entry["pills"] < 0 or entry["pills"] > 4:
            return False
    if parsed["meal_relation"] not in ["before", "after", "before_and_after"]:
        return False
    return True

def process_med_schedule(image_path, client):
    base64_image = encode_image(image_path)

    messages = [
        {
            "role": "system",
            "content": """You are a medical data extraction system.see there is a prescription sticker image which i am givng as input the only thing you give me as ouput should be the text, numbers,and which check boxes are checked from sticker itself and not a single word text or explanation of your own i have to perform some operations on output your are  going to give me.first check if the prescription sticker is horizontal or vertical or at an angle if it is at an angle or horizontal then rotate it to be vertical, then once the image is vertical then divide the image in 5 rows and take the first 3 rows and then check in each row if there is a number in box front of that text ( texts are morning,noon,evening) if there is blank box then assign 0 number of pills to thtat repective text in that row and after this first section of 3 rows , go for 2nd section of 2 rows that contains check box and a text(texts are "Before Meal" and "After Meal") if checkbox is checked for before meal row then assign meal_relation as "before" and if checkbox is checked for after meal row then assign meal_relation as "after" if both checkboxes are checked then assign meal_relation as "before_and_after",and if the box in front of Before Meal is blank i.e. unchecked and box in front of After meal is checked then assign meal_relation as "after" and after all this steps go for giving output. Analyze the prescription sticker image and return ONLY a JSON object with the medication schedule. Follow this exact format:
{
    "schedule": [
        {"time": "morning", "pills": 0-11},
        {"time": "noon", "pills": 0-11},
        {"time": "evening", "pills": 0-11}
    ],
    "meal_relation": "before|after|before_and_after"
}
Numbers must be 0-11. Meal relation must be one of the specified options. Return ONLY the JSON, no other text."""
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract medication schedule from this image"},
                {"type": "image_url", "image_url": {"url": base64_image}}
            ]
        }
    ]

    try:
        response = client.chat.completions.create(
            model="meta-llama/Llama-Vision-Free",
            messages=messages,
            temperature=0.1,
            max_tokens=500
        )

        raw_response = response.choices[0].message.content
        parsed = extract_json_from_response(raw_response)
        
        if not parsed or not validate_schema(parsed):
            return None

        return parsed

    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")
        return None

if __name__ == "__main__":
    import sys
    # if len(sys.argv) != 2:
    #     print("Usage: python pipeline.py <input_image_path>")
    #     sys.exit(1)
    
    # input_image = sys.argv[1]
    input_image = "6.jpg"
    results = process_image_pipeline(input_image)
    
    if results:
        
        print(json.dumps(results, indent=2))
    else:
        print("No valid prescriptions processed")