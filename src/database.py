import os
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
from datetime import datetime

class Database:
    def __init__(self):
        # MongoDB connection string - replace with your MongoDB URI
        # For MongoDB Atlas, use your cluster connection string
        # Example: mongodb+srv://<username>:<password>@cluster0.mongodb.net/EmotionSense
        self.connection_string = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        try:
            self.client = MongoClient(self.connection_string)
            # Test the connection
            self.client.admin.command('ping')
            print("MongoDB connection successful")
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
            print("Please ensure MongoDB is running locally or set MONGODB_URI environment variable for MongoDB Atlas")
            # Fallback to local connection
            self.client = MongoClient('mongodb://localhost:27017/')
        
        self.db = self.client['EmotionSense']
        self.users = self.db['users']
        self.sessions = self.db['sessions']
        
        # Create indexes for better performance
        try:
            self.users.create_index('email', unique=True)
            self.users.create_index('username', unique=True)
        except Exception as e:
            print(f"Warning: Could not create indexes: {e}")
        
    def create_user(self, username, email, password):
        """Create a new user with hashed password"""
        try:
            # Check if user already exists
            if self.users.find_one({'$or': [{'email': email}, {'username': username}]}):
                return {'success': False, 'message': 'User already exists with this email or username'}
            
            # Hash the password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            # Create user document
            user = {
                'username': username,
                'email': email,
                'password': hashed_password,
                'created_at': datetime.utcnow(),
                'last_login': None
            }
            
            # Insert user into database
            result = self.users.insert_one(user)
            user['_id'] = str(result.inserted_id)
            user.pop('password')  # Remove password from response
            
            return {'success': True, 'user': user, 'message': 'User created successfully'}
        except Exception as e:
            return {'success': False, 'message': f'Error creating user: {str(e)}'}
    
    def authenticate_user(self, email, password):
        """Authenticate user with email and password"""
        try:
            # Find user by email
            user = self.users.find_one({'email': email})
            if not user:
                return {'success': False, 'message': 'User not found'}
            
            # Check password
            if bcrypt.checkpw(password.encode('utf-8'), user['password']):
                # Update last login time
                self.users.update_one(
                    {'_id': user['_id']}, 
                    {'$set': {'last_login': datetime.utcnow()}}
                )
                
                # Remove password from response
                user['_id'] = str(user['_id'])
                user.pop('password')
                
                return {'success': True, 'user': user, 'message': 'Authentication successful'}
            else:
                return {'success': False, 'message': 'Invalid password'}
        except Exception as e:
            return {'success': False, 'message': f'Error authenticating user: {str(e)}'}
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            user = self.users.find_one({'_id': ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                user.pop('password')
                return {'success': True, 'user': user}
            else:
                return {'success': False, 'message': 'User not found'}
        except Exception as e:
            return {'success': False, 'message': f'Error retrieving user: {str(e)}'}
    
    def create_session(self, user_id):
        """Create a new session for user"""
        try:
            session = {
                'user_id': user_id,
                'created_at': datetime.utcnow(),
                'expires_at': datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)  # 30 days
            }
            
            result = self.sessions.insert_one(session)
            return str(result.inserted_id)
        except Exception as e:
            print(f'Error creating session: {str(e)}')
            return None
    
    def validate_session(self, session_id):
        """Validate if session is still active"""
        try:
            session = self.sessions.find_one({'_id': ObjectId(session_id)})
            if session and session['expires_at'] > datetime.utcnow().timestamp():
                return True
            return False
        except Exception as e:
            print(f'Error validating session: {str(e)}')
            return False
    
    def delete_session(self, session_id):
        """Delete a session"""
        try:
            self.sessions.delete_one({'_id': ObjectId(session_id)})
            return True
        except Exception as e:
            print(f'Error deleting session: {str(e)}')
            return False
    
    def update_user_profile(self, user_id, updates):
        """Update user profile information"""
        try:
            # Remove password from updates if present
            if 'password' in updates:
                # Hash the new password
                updates['password'] = bcrypt.hashpw(updates['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Update user document
            result = self.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': updates}
            )
            
            if result.modified_count > 0:
                # Return updated user (without password)
                user = self.users.find_one({'_id': ObjectId(user_id)})
                if user:
                    user['_id'] = str(user['_id'])
                    user.pop('password', None)
                    return {'success': True, 'user': user, 'message': 'Profile updated successfully'}
            
            return {'success': False, 'message': 'No changes made to profile'}
        except Exception as e:
            return {'success': False, 'message': f'Error updating profile: {str(e)}'}

# Create a global database instance
db = Database()