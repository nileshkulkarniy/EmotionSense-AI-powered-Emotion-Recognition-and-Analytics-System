import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import os

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

class TextAnalyzer:
    def __init__(self, model_path=None):
        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        self.is_trained = False
        self.label_mapping = {'negative': 0, 'neutral': 1, 'positive': 2}
        self.reverse_label_mapping = {0: 'negative', 1: 'neutral', 2: 'positive'}
        # For emotion detection (face emotions)
        self.emotion_label_mapping = {
            'angry': 0, 'disgust': 1, 'fear': 2, 
            'happy': 3, 'neutral': 4, 'sad': 5, 
            'surprised': 6, 'surprise': 6,  # Handle both spellings
            'calm': 4  # Map calm to neutral
        }
        self.emotion_reverse_mapping = {
            0: 'angry', 1: 'disgust', 2: 'fear',
            3: 'happy', 4: 'neutral', 5: 'sad',
            6: 'surprise'
        }
        # Define negation words
        self.negation_words = {'not', 'no', 'never', 'nothing', 'nowhere', 'noone', 'none', 'nor', 'neither', 'n\'t'}
        # Load sentiment words dictionary
        self.sentiment_words = {}
        self.load_sentiment_words()
        
    def load_sentiment_words(self):
        """Load sentiment words dictionary for enhanced analysis"""
        try:
            sentiment_words_path = r"C:\Users\knile\Downloads\sentiment_words_10000.csv"
            if os.path.exists(sentiment_words_path):
                df = pd.read_csv(sentiment_words_path)
                # Convert to dictionary for faster lookup
                self.sentiment_words = dict(zip(df['word'], df['sentiment']))
                print(f"Loaded {len(self.sentiment_words)} sentiment words")
            else:
                print(f"Sentiment words file not found at {sentiment_words_path}")
        except Exception as e:
            print(f"Error loading sentiment words: {e}")
            self.sentiment_words = {}
    
    def preprocess_text(self, text):
        """Preprocess text for analysis"""
        # Convert to lowercase
        text = text.lower()
        # Handle negations by adding NOT_ prefix to words following negation words
        # First, tokenize to preserve word boundaries
        tokens = word_tokenize(text)
        processed_tokens = []
        negate = False
        for token in tokens:
            # Check if token is a negation word
            if token in self.negation_words:
                negate = True
                processed_tokens.append(token)
            elif negate and token.isalpha():  # Only negate actual words, not punctuation
                processed_tokens.append(f"NOT_{token}")
                negate = False  # Reset after negating one word
            else:
                processed_tokens.append(token)
                if token not in [',', '.', '!', '?', ';', ':']:  # Reset negate after punctuation
                    negate = False
        
        # Join tokens and then remove special characters and digits
        text = ' '.join(processed_tokens)
        text = re.sub(r'[^a-zA-Z\s_]', ' ', text)  # Replace special chars with spaces, but keep underscores
        text = re.sub(r'\s+', ' ', text).strip()  # Normalize whitespace
        
        # Remove stopwords (but keep NOT_ prefixed words)
        words = text.split()
        stop_words = set(stopwords.words('english'))
        words = [word for word in words if word not in stop_words or word.startswith('NOT_')]
        
        # Join words back to text
        return ' '.join(words)
    
    def get_sentiment_from_words(self, text):
        """Get sentiment based on sentiment words dictionary"""
        if not self.sentiment_words:
            return None
            
        # Preprocess the text first to handle negations
        processed_text = self.preprocess_text(text)
        words = processed_text.split()
        sentiment_scores = {'positive': 0, 'negative': 0, 'neutral': 0}
        
        for word in words:
            # Check for negated words
            if word.startswith('NOT_'):
                base_word = word[4:]  # Remove 'NOT_' prefix
                if base_word in self.sentiment_words:
                    # Flip the sentiment for negated words
                    original_sentiment = self.sentiment_words[base_word]
                    if original_sentiment == 'positive':
                        sentiment_scores['negative'] += 1
                    elif original_sentiment == 'negative':
                        sentiment_scores['positive'] += 1
                    else:
                        sentiment_scores['neutral'] += 1
            else:
                # Check regular words
                if word in self.sentiment_words:
                    sentiment = self.sentiment_words[word]
                    sentiment_scores[sentiment] += 1
        
        # Determine overall sentiment
        total_words = sum(sentiment_scores.values())
        if total_words == 0:
            return None
            
        # Find the dominant sentiment
        dominant_sentiment = max(sentiment_scores, key=sentiment_scores.get)
        confidence = sentiment_scores[dominant_sentiment] / total_words
        
        return {
            'sentiment': dominant_sentiment,
            'confidence': confidence
        }
    
    def load_dataset(self, file_path):
        """Load and preprocess the dataset"""
        try:
            df = pd.read_csv(file_path)
            print(f"Loaded dataset with shape: {df.shape}")
            print(f"Columns: {df.columns.tolist()}")
            
            # Check if it's an emotion dataset (Sentence, Emotion columns)
            if 'Sentence' in df.columns and 'Emotion' in df.columns:
                print("Processing emotion dataset format...")
                # This is an emotion dataset, convert it to sentiment format
                # Map emotion to sentiment (simplified mapping)
                emotion_to_sentiment = {
                    'Happy': 'positive',
                    'Sad': 'negative',
                    'Angry': 'negative',
                    'Fear': 'negative',
                    'Disgust': 'negative',
                    'Surprise': 'neutral',
                    'Neutral': 'neutral'
                }
                df['sentence'] = df['Sentence']
                df['sentiment'] = df['Emotion'].map(emotion_to_sentiment)
            # Check if it's the original dataset format (sentence, label) or new format (sentence, sentiment)
            elif 'label' in df.columns:
                # Handle the problematic format where sentence and label are combined
                # Try to separate them properly
                print("Processing dataset with 'label' column...")
                
                # Check if labels are numeric (0, 1) or text ("Positive", "Negative", etc.)
                if df['label'].dtype == 'object':
                    # Text labels - check unique values
                    unique_labels = df['label'].unique()
                    print(f"Unique labels: {unique_labels}")
                    
                    # Try to separate sentence and label if they're combined
                    if len(df.columns) == 2:
                        # Check if the first column contains both sentence and label
                        sample = df.iloc[0]['sentence']
                        if ' 1 ' in str(sample) or ' 0 ' in str(sample):
                            # Split the sentence and label
                            df[['sentence', 'temp_label']] = df['sentence'].str.rsplit(' ', n=1, expand=True)
                            df['label'] = df['temp_label']
                            df = df.drop('temp_label', axis=1)
                
                # Map labels to lowercase sentiment values
                label_mapping = {
                    1: 'positive',
                    0: 'negative',
                    'Positive': 'positive',
                    'Negative': 'negative',
                    'Neutral': 'neutral'
                }
                df['sentiment'] = df['label'].map(label_mapping)
            elif 'sentiment' in df.columns:
                # Already in correct format
                df['sentiment'] = df['sentiment'].str.lower()
            
            # Preprocess sentences
            df['processed_text'] = df['sentence'].apply(self.preprocess_text)
            # Map sentiments to numeric values
            df['sentiment_numeric'] = df['sentiment'].map(self.label_mapping)
            
            # Remove rows with unmapped sentiments
            df = df.dropna(subset=['sentiment_numeric'])
            print(f"Dataset after preprocessing: {df.shape}")
            
            return df
        except Exception as e:
            print(f"Error loading dataset from {file_path}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def load_emotion_dataset(self, file_path):
        """Load and preprocess the emotion dataset"""
        try:
            df = pd.read_csv(file_path)
            
            # Check if this is the voice emotion dataset (has Text, Emotion columns)
            if 'Text' in df.columns and 'Emotion' in df.columns:
                # Handle voice emotion dataset
                # Preprocess sentences
                df['processed_text'] = df['Text'].apply(self.preprocess_text)
                # Map emotions to numeric values
                df['emotion_numeric'] = df['Emotion'].str.lower().map(self.emotion_label_mapping)
            else:
                # Handle other emotion datasets (Sentence, Emotion columns)
                # Preprocess sentences
                df['processed_text'] = df['Sentence'].apply(self.preprocess_text)
                # Map emotions to numeric values
                df['emotion_numeric'] = df['Emotion'].str.lower().map(self.emotion_label_mapping)
            
            # Remove rows with unmapped emotions
            df = df.dropna(subset=['emotion_numeric'])
            # Convert to int
            df['emotion_numeric'] = df['emotion_numeric'].astype(int)
            return df
        except Exception as e:
            print(f"Error loading emotion dataset: {e}")
            return None
    
    def train(self, file_paths):
        """Train the text sentiment analysis model with multiple datasets"""
        try:
            all_data = []
            
            # Load all datasets
            for file_path in file_paths:
                if os.path.exists(file_path):
                    print(f"Loading dataset from: {file_path}")
                    df = self.load_dataset(file_path)
                    if df is not None and not df.empty:
                        all_data.append(df)
                        print(f"Successfully loaded {len(df)} samples")
                    else:
                        print(f"Failed to load dataset from: {file_path}")
                else:
                    print(f"Dataset file not found at: {file_path}")
            
            if not all_data:
                print("No datasets loaded successfully")
                return False
            
            # Combine all datasets
            combined_df = pd.concat(all_data, ignore_index=True)
            print(f"Combined dataset shape: {combined_df.shape}")
            
            # Check if we have enough data
            if len(combined_df) < 10:
                print("Not enough training data")
                return False
            
            # Split features and labels
            X = combined_df['processed_text']
            y = combined_df['sentiment_numeric']
            
            # Vectorize text
            X_vectorized = self.vectorizer.fit_transform(X)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_vectorized, y, test_size=0.2, random_state=42
            )
            
            # Train model
            self.model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            print(f"Model trained with accuracy: {accuracy:.4f}")
            
            self.is_trained = True
            return True
        except Exception as e:
            print(f"Error training model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def train_emotion_model(self, file_paths):
        """Train the emotion detection model with emotion datasets"""
        try:
            all_data = []
            
            # Load all emotion datasets
            for file_path in file_paths:
                if os.path.exists(file_path):
                    print(f"Loading emotion dataset from: {file_path}")
                    df = self.load_emotion_dataset(file_path)
                    if df is not None:
                        all_data.append(df)
                    else:
                        print(f"Failed to load emotion dataset from: {file_path}")
                else:
                    print(f"Emotion dataset file not found at: {file_path}")
            
            if not all_data:
                print("No emotion datasets loaded successfully")
                return False
            
            # Combine all datasets
            combined_df = pd.concat(all_data, ignore_index=True)
            print(f"Combined emotion dataset shape: {combined_df.shape}")
            
            # Split features and labels
            X = combined_df['processed_text']
            y = combined_df['emotion_numeric']
            
            # Vectorize text
            X_vectorized = self.vectorizer.fit_transform(X)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_vectorized, y, test_size=0.2, random_state=42
            )
            
            # Train model
            self.model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            print(f"Emotion model trained with accuracy: {accuracy:.4f}")
            
            self.is_trained = True
            return True
        except Exception as e:
            print(f"Error training emotion model: {e}")
            return False
    
    def analyze_sentiment(self, text):
        """Analyze sentiment of a given text using both ML model and sentiment words dictionary"""
        # First try to get sentiment from sentiment words dictionary
        word_sentiment = self.get_sentiment_from_words(text)
        
        # If we have a strong confidence from word analysis, use it
        if word_sentiment and word_sentiment['confidence'] > 0.6:
            return {
                "sentiment": word_sentiment['sentiment'],
                "confidence": word_sentiment['confidence'],
                "message": "Analysis completed using sentiment words dictionary"
            }
        
        # Otherwise, use the ML model
        if not self.is_trained:
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "message": "Model not trained yet"
            }
        
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Vectorize text
            text_vectorized = self.vectorizer.transform([processed_text])
            
            # Predict
            prediction = self.model.predict(text_vectorized)[0]
            probabilities = self.model.predict_proba(text_vectorized)[0]
            
            # Get confidence (probability of predicted class)
            confidence = float(np.max(probabilities))
            sentiment = self.reverse_label_mapping[prediction].lower()
            
            return {
                "sentiment": sentiment,
                "confidence": confidence,
                "message": "Analysis completed using ML model"
            }
        except Exception as e:
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "message": f"Error during analysis: {str(e)}"
            }
    
    def analyze_emotion(self, text):
        """Analyze emotion of a given text"""
        if not self.is_trained:
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "message": "Model not trained yet"
            }
        
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Vectorize text
            text_vectorized = self.vectorizer.transform([processed_text])
            
            # Predict
            prediction = self.model.predict(text_vectorized)[0]
            probabilities = self.model.predict_proba(text_vectorized)[0]
            
            # Get confidence (probability of predicted class)
            confidence = float(np.max(probabilities))
            emotion = self.emotion_reverse_mapping[prediction].capitalize()  # Capitalize first letter instead of lowercase
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "message": "Emotion analysis completed"
            }
        except Exception as e:
            return {
                "emotion": "Neutral",  # Capitalize default emotion
                "confidence": 0.5,
                "message": f"Error during emotion analysis: {str(e)}"
            }

def get_text_analyzer():
    """Factory function to create and train text analyzer"""
    analyzer = TextAnalyzer()
    
    # Paths to the dataset files
    dataset_paths = [
        r"C:\Users\knile\Downloads\sentiment_dataset_30000.csv",
        r"C:\Users\knile\Downloads\sentiment_sentences_30000.csv",
        r"c:\Users\knile\OneDrive\Desktop\EmotionSense\data\emotion_sentences.csv"  # Use emotion dataset as fallback
    ]
    
    print("Training text analysis model with multiple datasets...")
    if analyzer.train(dataset_paths):
        print("Text analysis model trained successfully")
    else:
        print("Failed to train text analysis model")
    
    return analyzer

def get_emotion_analyzer():
    """Factory function to create and train emotion analyzer"""
    analyzer = TextAnalyzer()
    
    # Paths to the emotion dataset files
    dataset_paths = [
        r"C:\Users\knile\Downloads\emotion_sentences\emotion_sentences.csv",
        r"c:\Users\knile\OneDrive\Desktop\EmotionSense\data\emotion_sentences.csv",
        r"c:\Users\knile\OneDrive\Desktop\EmotionSense\data\voice_emotion_dataset.csv"  # Add uploaded dataset
    ]
    
    print("Training emotion analysis model with emotion datasets...")
    if analyzer.train_emotion_model(dataset_paths):
        print("Emotion analysis model trained successfully")
    else:
        print("Failed to train emotion analysis model")
    
    return analyzer