import random
import csv
import os

# Word pools for each emotion
word_pools = {
    "Happy": {
        "subjects": ["I", "She", "He", "They", "We"],
        "verbs": ["feel", "look", "seem", "are"],
        "adjectives": ["happy", "cheerful", "joyful", "excited", "glad"],
        "extras": ["today", "inside", "with friends", "this morning", "right now"]
    },
    "Sad": {
        "subjects": ["I", "She", "He", "They", "We"],
        "verbs": ["feel", "look", "seem", "are"],
        "adjectives": ["sad", "unhappy", "upset", "down", "miserable"],
        "extras": ["today", "tonight", "at home", "inside", "this evening"]
    },
    "Angry": {
        "subjects": ["I", "She", "He", "They"],
        "verbs": ["feel", "look", "are", "seem"],
        "adjectives": ["angry", "mad", "furious", "upset", "annoyed"],
        "extras": ["right now", "today", "this morning", "again", "tonight"]
    },
    "Surprised": {
        "subjects": ["I", "She", "He", "They", "We"],
        "verbs": ["am", "is", "looks", "feels"],
        "adjectives": ["surprised", "shocked", "stunned", "amazed", "speechless"],
        "extras": ["today", "suddenly", "this time", "again", "tonight"]
    },
    "Neutral": {
        "subjects": ["I", "She", "He", "They", "We"],
        "verbs": ["feel", "look", "are", "stay"],
        "adjectives": ["neutral", "calm", "plain", "normal", "quiet"],
        "extras": ["today", "as usual", "again", "this time", "right now"]
    },
    "Fear": {
        "subjects": ["I", "She", "He", "They"],
        "verbs": ["feel", "look", "seem", "am"],
        "adjectives": ["scared", "afraid", "fearful", "nervous", "terrified"],
        "extras": ["at night", "now", "today", "inside", "outside"]
    },
    "Disgust": {
        "subjects": ["I", "She", "He", "They"],
        "verbs": ["feel", "look", "seem", "am"],
        "adjectives": ["disgusted", "grossed", "nauseated", "sickened", "repulsed"],
        "extras": ["by food", "right now", "today", "again", "this morning"]
    }
}

def generate_emotion_sentences():
    """Generate 60,000 varied emotional sentences"""
    sentences = []
    per_emotion = 60000 // len(word_pools)
    
    # Generate sentences
    for emotion, words in word_pools.items():
        for _ in range(per_emotion):
            subject = random.choice(words["subjects"])
            verb = random.choice(words["verbs"])
            adjective = random.choice(words["adjectives"])
            extra = random.choice(words["extras"])
            sentence = f"{subject} {verb} {adjective} {extra}"
            sentences.append([emotion, sentence])
    
    return sentences

def save_sentences_to_csv(sentences, filename="emotion_sentences.csv"):
    """Save sentences to CSV file"""
    # Create directory if it doesn't exist
    output_dir = os.path.join("data")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    file_path = os.path.join(output_dir, filename)
    
    # Save to CSV
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Emotion", "Sentence"])  # header
        writer.writerows(sentences)
    
    print(f"✅ {len(sentences)} varied sentences generated and saved to {file_path}")
    return file_path

def main():
    """Main function to generate and save emotion sentences"""
    print("Generating 60,000 varied emotional sentences...")
    sentences = generate_emotion_sentences()
    file_path = save_sentences_to_csv(sentences)
    print(f"Dataset saved to: {file_path}")
    
    # Print sample sentences for each emotion
    print("\nSample sentences:")
    for emotion in word_pools.keys():
        emotion_sentences = [s for s in sentences if s[0] == emotion]
        if emotion_sentences:
            sample = random.choice(emotion_sentences)
            print(f"{emotion}: {sample[1]}")

if __name__ == "__main__":
    main()