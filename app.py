from flask import Flask, render_template, Response, request, jsonify, session
import cv2
import numpy as np
import tensorflow as tf
import os
import base64
import json
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
from src.database import db
from bson.objectid import ObjectId
import pandas as pd
from werkzeug.utils import secure_filename

# Conditional imports for text analysis
try:
    from src.text_analysis import get_text_analyzer, get_emotion_analyzer, TextAnalyzer
    TEXT_ANALYSIS_IMPORT_SUCCESS = True
except ImportError as e:
    print(f"Failed to import text analysis module: {e}")
    TEXT_ANALYSIS_IMPORT_SUCCESS = False

# Enable text analysis import
TEXT_ANALYSIS_AVAILABLE = TEXT_ANALYSIS_IMPORT_SUCCESS
if TEXT_ANALYSIS_AVAILABLE:
    print("Text analysis module enabled")
else:
    print("Text analysis module disabled")

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'sentimentai-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours
jwt = JWTManager(app)
# Updated CORS configuration to include port 3006 (Vite dev server) and other common ports
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003", "http://localhost:3004", "http://127.0.0.1:3004", "http://localhost:3005", "http://127.0.0.1:3005", "http://localhost:3006", "http://127.0.0.1:3006", "http://localhost:3007", "http://127.0.0.1:3007", "http://localhost:3009", "http://127.0.0.1:3009", "http://localhost:5000", "http://127.0.0.1:5000"])

# Emotion labels (should match the order used during training)
# Updated to match the training script labels
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

# For display purposes, we'll capitalize the first letter
DISPLAY_EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# Global variables
camera = None
model = None
text_analyzer = None
emotion_analyzer = None
latest_emotion_data = None

def load_model():
    """Load the trained emotion detection model"""
    global model
    try:
        print("Attempting to load model...")
        
        # List all possible model paths
        model_paths = [
            os.path.join("models", "emotion_model.h5"),
            os.path.join("model.h5"),
            os.path.join("models", "emotion_model.keras")
        ]
        
        # Check which paths exist
        existing_paths = [path for path in model_paths if os.path.exists(path)]
        print(f"Existing model paths: {existing_paths}")
        
        # Try loading from each existing path
        for model_path in existing_paths:
            try:
                print(f"Attempting to load model from: {model_path}")
                model = tf.keras.models.load_model(model_path)
                print(f"Model loaded successfully from: {model_path}")
                print(f"Model input shape: {model.input_shape}")
                print(f"Model output shape: {model.output_shape}")
                return
            except Exception as e:
                print(f"Error loading model from {model_path}: {e}")
                import traceback
                traceback.print_exc()
        
        print("Model not found or could not be loaded. Please train the model first.")
        model = None
    except Exception as e:
        print(f"Error in load_model function: {e}")
        import traceback
        traceback.print_exc()
        model = None

def load_text_analyzer():
    """Load the text analyzer"""
    global text_analyzer
    if TEXT_ANALYSIS_AVAILABLE and TEXT_ANALYSIS_IMPORT_SUCCESS:
        try:
            text_analyzer = get_text_analyzer()
            print("Text analyzer loaded successfully")
        except Exception as e:
            print(f"Error loading text analyzer: {e}")
            text_analyzer = None
    else:
        text_analyzer = None
        if not TEXT_ANALYSIS_IMPORT_SUCCESS:
            print("Text analysis module not available due to import failure")

def load_emotion_analyzer():
    """Load the emotion analyzer"""
    global emotion_analyzer
    if TEXT_ANALYSIS_AVAILABLE and TEXT_ANALYSIS_IMPORT_SUCCESS:
        try:
            emotion_analyzer = get_emotion_analyzer()
            print("Emotion analyzer loaded successfully")
        except Exception as e:
            print(f"Error loading emotion analyzer: {e}")
            emotion_analyzer = None
    else:
        emotion_analyzer = None
        if not TEXT_ANALYSIS_IMPORT_SUCCESS:
            print("Emotion analysis module not available due to import failure")

def preprocess_face(face):
    """Preprocess the face image for emotion detection"""
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        # Resize to 48x48
        resized = cv2.resize(gray, (48, 48))
        # Normalize pixel values
        normalized = resized / 255.0
        # Reshape for model input
        reshaped = normalized.reshape(1, 48, 48, 1)
        return reshaped
    except Exception as e:
        print(f"Error preprocessing face: {e}")
        # Return a default array if preprocessing fails
        return np.zeros((1, 48, 48, 1))

def detect_emotion(face):
    """Detect emotion from face image"""
    global model, latest_emotion_data
    if model is None:
        return "No Model", 0.0
    
    try:
        processed_face = preprocess_face(face)
        predictions = model.predict(processed_face, verbose=0)  # verbose=0 to reduce output
        emotion_idx = np.argmax(predictions)
        confidence = float(predictions[0][emotion_idx])
        # Use DISPLAY_EMOTIONS for showing to user
        emotion = DISPLAY_EMOTIONS[emotion_idx]
        
        # Store the latest emotion data
        latest_emotion_data = {
            "emotions": DISPLAY_EMOTIONS,
            "predictions": [float(p) for p in predictions[0]],
            "dominant_emotion": emotion,
            "confidence": confidence
        }
        
        return emotion, confidence
    except Exception as e:
        print(f"Error detecting emotion: {e}")
        return "Error", 0.0

def generate_frames():
    """Generate video frames with emotion detection"""
    global camera
    if camera is None or not camera.isOpened():
        print("Camera is not opened")
        # Return a single frame with error message
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(frame, "Camera not available", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        return

    # Load Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    while True:
        try:
            success, frame = camera.read()
            if not success or frame is None:
                print("Failed to read frame from camera")
                break
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            # Process each detected face
            for (x, y, w, h) in faces:
                # Extract face region
                face = frame[y:y+h, x:x+w]
                
                # Detect emotion
                emotion, confidence = detect_emotion(face)
                
                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # Display emotion and confidence
                text = f"{emotion}: {confidence:.2f}"
                cv2.putText(frame, text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                print("Failed to encode frame")
                continue
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except Exception as e:
            print(f"Error in generate_frames: {e}")
            # Return a single frame with error message
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, f"Error: {str(e)}", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            break

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"}), 200

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', 
                         text_analysis_available=TEXT_ANALYSIS_AVAILABLE)

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    global camera
    print("Video feed endpoint accessed")
    if camera is None or not camera.isOpened():
        print("Camera not available for video feed")
        # Return a single error frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(frame, "Camera not available", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        if ret:
            frame_bytes = buffer.tobytes()
            return Response(b'--frame\r\n'
                          b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n',
                          mimetype='multipart/x-mixed-replace; boundary=frame')
        else:
            return "Failed to encode error frame", 500
    
    print("Starting video stream")
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_camera')
def start_camera():
    """Start the camera"""
    global camera
    try:
        print("Attempting to start camera...")
        if camera is None or not camera.isOpened():
            print("Initializing new camera object...")
            # Try different camera indices and configurations
            camera_indices = [0, 1, 2]  # Try multiple camera indices
            backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]  # Try different backends
            
            camera_started = False
            for idx in camera_indices:
                if camera_started:
                    break
                for backend in backends:
                    if camera_started:
                        break
                    try:
                        print(f"Trying camera index {idx} with backend {backend}...")
                        temp_camera = cv2.VideoCapture(idx, backend)
                        if temp_camera.isOpened():
                            # Try to read a test frame
                            print("Camera object created, attempting to read test frame...")
                            ret, frame = temp_camera.read()
                            if ret and frame is not None:
                                print(f"Camera started successfully with index {idx} and backend {backend}. Test frame shape: {frame.shape}")
                                camera = temp_camera
                                camera_started = True
                                break
                            else:
                                print(f"Camera {idx} with backend {backend} opened but failed to read frame")
                                temp_camera.release()
                        else:
                            print(f"Failed to open camera {idx} with backend {backend}")
                            temp_camera.release()
                    except Exception as backend_err:
                        print(f"Error with camera {idx} and backend {backend}: {backend_err}")
                        if 'temp_camera' in locals():
                            temp_camera.release()
            
            if not camera_started:
                print("Failed to start any camera")
                return "Failed to start camera - no working camera found. Please check that your webcam is connected and not in use by another application."
            else:
                return "Camera started"
        else:
            print("Camera already running")
            return "Camera already running"
    except Exception as e:
        print(f"Error starting camera: {e}")
        import traceback
        traceback.print_exc()
        return f"Error starting camera: {e}"

@app.route('/stop_camera')
def stop_camera():
    """Stop the camera"""
    global camera
    try:
        if camera is not None and camera.isOpened():
            camera.release()
            camera = None
            print("Camera stopped")
            return "Camera stopped"
        return "Camera already stopped"
    except Exception as e:
        print(f"Error stopping camera: {e}")
        return f"Error stopping camera: {e}"

@app.route('/emotion_data')
def get_emotion_data():
    """Get the latest emotion data"""
    global latest_emotion_data
    if latest_emotion_data is None:
        return jsonify({"error": "No emotion data available"}), 404
    return jsonify(latest_emotion_data), 200

# Authentication routes
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not username or not email or not password:
            return jsonify({
                "success": False,
                "message": "Username, email, and password are required"
            }), 400
        
        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters long"
            }), 400
        
        # Create user in database
        result = db.create_user(username, email, password)
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error registering user: {str(e)}"
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required"
            }), 400
        
        # Authenticate user
        result = db.authenticate_user(email, password)
        if result['success']:
            # Create JWT token
            access_token = create_access_token(identity=result['user']['_id'])
            result['access_token'] = access_token
            return jsonify(result), 200
        else:
            return jsonify(result), 401
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error logging in: {str(e)}"
        }), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        current_user_id = get_jwt_identity()
        user_result = db.get_user_by_id(current_user_id)
        if user_result['success']:
            return jsonify({
                "success": True,
                "user": user_result['user']
            }), 200
        else:
            return jsonify(user_result), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving profile: {str(e)}"
        }), 500

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Remove fields that shouldn't be updated
        data.pop('_id', None)
        data.pop('email', None)  # Don't allow email changes for now
        
        # Update user profile in database
        result = db.update_user_profile(current_user_id, data)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error updating profile: {str(e)}"
        }), 500

@app.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({
                "success": False,
                "message": "Current password and new password are required"
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                "success": False,
                "message": "New password must be at least 6 characters long"
            }), 400
        
        # Verify current password
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user['password']):
            return jsonify({
                "success": False,
                "message": "Current password is incorrect"
            }), 401
        
        # Update password
        result = db.update_user_profile(current_user_id, {'password': new_password})
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error changing password: {str(e)}"
        }), 500

@app.route('/analyze_text', methods=['POST'])
def analyze_text():
    """Analyze sentiment of text"""
    global text_analyzer
    try:
        if not TEXT_ANALYSIS_AVAILABLE or text_analyzer is None:
            return jsonify({
                "sentiment": "neutral",
                "confidence": 0.5,
                "message": "Text analysis not available"
            }), 503
        
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                "sentiment": "neutral",
                "confidence": 0.5,
                "message": "No text provided"
            }), 400
        
        # Analyze sentiment
        result = text_analyzer.analyze_sentiment(text)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "sentiment": "neutral",
            "confidence": 0.5,
            "message": f"Error analyzing text: {str(e)}"
        }), 500

@app.route('/analyze_voice_emotion', methods=['POST'])
def analyze_voice_emotion():
    """Analyze emotion from voice-transcribed text"""
    global emotion_analyzer
    try:
        if not TEXT_ANALYSIS_AVAILABLE or emotion_analyzer is None:
            return jsonify({
                "emotion": "neutral",
                "confidence": 0.5,
                "message": "Emotion analysis not available"
            }), 503
        
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                "emotion": "neutral",
                "confidence": 0.5,
                "message": "No text provided"
            }), 400
        
        # Analyze emotion
        result = emotion_analyzer.analyze_emotion(text)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "emotion": "neutral",
            "confidence": 0.5,
            "message": f"Error analyzing voice emotion: {str(e)}"
        }), 500

@app.route('/upload_voice_dataset', methods=['POST'])
def upload_voice_dataset():
    """Upload and process voice emotion dataset"""
    try:
        if 'dataset' not in request.files:
            return jsonify({
                "success": False,
                "message": "No dataset file provided"
            }), 400
        
        file = request.files['dataset']
        
        if file.filename == '':
            return jsonify({
                "success": False,
                "message": "No file selected"
            }), 400
        
        if file and file.filename.endswith('.csv'):
            # Save the file to the data directory with a specific name
            filename = "voice_emotion_dataset.csv"
            save_path = os.path.join("data", filename)
            
            # If file already exists, remove it first
            if os.path.exists(save_path):
                os.remove(save_path)
                
            file.save(save_path)
            
            # Process the CSV file
            try:
                # Read the CSV file with proper encoding
                df = pd.read_csv(save_path, encoding='utf-8')
                
                # Validate required columns
                if 'Text' not in df.columns or 'Emotion' not in df.columns:
                    os.remove(save_path)  # Clean up temp file
                    return jsonify({
                        "success": False,
                        "message": "CSV file must contain 'Text' and 'Emotion' columns"
                    }), 400
                
                # Process the data (for now, just count rows)
                processed_rows = len(df)
                
                # Validate emotion labels
                valid_emotions = ['Happy', 'Sad', 'Angry', 'Fear', 'Disgust', 'Surprise', 'Neutral', 'Calm']
                invalid_emotions = df[~df['Emotion'].isin(valid_emotions)]
                
                if len(invalid_emotions) > 0:
                    print(f"Warning: Found {len(invalid_emotions)} rows with invalid emotion labels")
                
                # Preprocess text data
                text_analyzer_instance = TextAnalyzer()
                df['processed_text'] = df['Text'].apply(lambda x: text_analyzer_instance.preprocess_text(str(x)))
                
                # Save the preprocessed dataset
                processed_save_path = os.path.join("data", "voice_emotion_dataset_processed.csv")
                df.to_csv(processed_save_path, index=False)
                
                # Update the emotion analyzer to include this new dataset
                global emotion_analyzer
                if emotion_analyzer is not None:
                    # Re-train the emotion analyzer with the new dataset
                    dataset_paths = [
                        r"C:\Users\knile\Downloads\emotion_sentences\emotion_sentences.csv",
                        r"c:\Users\knile\OneDrive\Desktop\EmotionSense\data\emotion_sentences.csv",
                        save_path  # Include the newly uploaded dataset
                    ]
                    
                    print("Re-training emotion analysis model with updated datasets...")
                    if emotion_analyzer.train_emotion_model(dataset_paths):
                        print("Emotion analysis model re-trained successfully")
                    else:
                        print("Failed to re-train emotion analysis model")
                
                print(f"Processed voice emotion dataset with {processed_rows} rows")
                
                return jsonify({
                    "success": True,
                    "processed_rows": processed_rows,
                    "message": f"Successfully processed {processed_rows} rows and updated the model"
                }), 200
                
            except Exception as e:
                # Clean up temp file if it exists
                if os.path.exists(save_path):
                    os.remove(save_path)
                return jsonify({
                    "success": False,
                    "message": f"Error processing CSV file: {str(e)}"
                }), 500
        else:
            return jsonify({
                "success": False,
                "message": "Invalid file format. Please upload a CSV file."
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error uploading dataset: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Load model
    load_model()
    
    # Load text analyzer
    load_text_analyzer()
    
    # Load emotion analyzer
    load_emotion_analyzer()
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)