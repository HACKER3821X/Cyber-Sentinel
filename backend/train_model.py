from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
import pickle

# Training data
data = [
    "normal request",
    "home page",
    "login page",
    "<script>alert(1)</script>",
    "SELECT * FROM users",
    "' OR 1=1 --",
    "../../etc/passwd",
    "DROP TABLE users",
    "UNION SELECT password",
    "safe request"
]

# Labels
labels = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0]

# Vectorizer
vectorizer = CountVectorizer()

X = vectorizer.fit_transform(data)

# Train model
model = MultinomialNB()

model.fit(X, labels)

# Save model properly
with open("model.pkl", "wb") as f:
    pickle.dump((vectorizer, model), f)

print("✅ Model Created Successfully")
