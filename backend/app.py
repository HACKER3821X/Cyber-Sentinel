from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask_socketio import SocketIO
import redis
import pickle
import datetime
import bcrypt
import jwt
from urllib.parse import unquote
from services.geo_services import get_location

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["security"]
collection = db["logs"]
users_collection = db["users"]
SECRET_KEY = "sentinelx_secret_key"


# Redis optional
try:
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)
    r.ping()
    print("[INFO] Redis connected")
except Exception:
    r = None
    print("[WARN] Redis not running - IP blocking disabled")

# Load AI model
try:
    with open("model.pkl", "rb") as file:
        vectorizer, model = pickle.load(file)
    print("[INFO] AI model loaded")
except Exception as e:
    vectorizer = None
    model = None
    print("[WARN] AI model not loaded:", e)


def classify_attack(data):
    data = data.lower()

    sql_patterns = [
        "or 1=1",
        "union select",
        "drop table",
        "information_schema",
        "select * from",
        "' or 1=1 --",
        "admin'--",
        "admin' or '1'='1",
    ]

    xss_patterns = [
        "<script>",
        "alert(",
        "onerror=",
        "javascript:",
        "document.cookie",
    ]

    path_patterns = [
        "../",
        "..\\",
        "/etc/passwd",
        "boot.ini",
    ]

    cmd_patterns = [
        "; ls",
        "; cat",
        "&&",
        "| whoami",
        "cmd.exe",
        "powershell",
        "wget",
        "curl",
    ]

    scanner_patterns = [
        "sqlmap",
        "nmap",
        "nikto",
        "acunetix",
        "burpsuite",
    ]

    for pattern in sql_patterns:
        if pattern in data:
            return "SQL Injection", "CRITICAL"

    for pattern in xss_patterns:
        if pattern in data:
            return "XSS Attack", "HIGH"

    for pattern in path_patterns:
        if pattern in data:
            return "Path Traversal", "HIGH"

    for pattern in cmd_patterns:
        if pattern in data:
            return "Command Injection", "CRITICAL"

    for pattern in scanner_patterns:
        if pattern in data:
            return "Scanner/Bot Activity", "MEDIUM"


# AI fallback detection
    if vectorizer is not None and model is not None:
        try:
            transformed_data = vectorizer.transform([data])
            # If no vocabulary words are present in the request, default to safe (0)
            if transformed_data.sum() == 0:
                prediction = 0
            else:
                prediction = model.predict(transformed_data)[0]

            if prediction == 1 or prediction == "attack":
                return "Suspicious Traffic (AI Flagged)", "HIGH"

        except Exception as e:
            print("AI prediction error:", e)
        
        
    return "Normal Traffic", "SAFE"

@app.before_request
def security():
    ip = request.remote_addr or "Unknown"

    # Skip routes that should not be scanned
    if request.path == "/":
        return None

    if request.path.startswith("/api"):
        return None

    if request.path.startswith("/static"):
        return None

    if request.path.startswith("/socket.io"):
        return None

    if request.path == "/favicon.ico":
        return None

    # Check blocked IP only if Redis is available
    if r and r.get(f"block:{ip}"):
        return "🚫 Your IP is Blocked", 403

    data = unquote(request.full_path.lower())

    location = get_location(ip)

    attack_type, severity = classify_attack(data)
    attack_detected = attack_type != "Normal Traffic"

    log = {
        "country": location.get("country", "Unknown"),
        "city": location.get("city", "Unknown"),
        "isp": location.get("isp", "Unknown"),
        "lat": location.get("lat", 0),
        "lon": location.get("lon", 0),
        "time": str(datetime.datetime.now()),
        "ip": ip,
        "url": request.url,
        "data": data,
        "attack": attack_detected,
        "attack_type": attack_type,
        "severity": severity,
    }

    inserted = collection.insert_one(log)
    log["_id"] = str(inserted.inserted_id)

    socketio.emit("new_log", log)

    if attack_detected:
        if r:
            redis_key = f"block:{ip}"
            r.set(redis_key, attack_type, ex=20)
            print("BLOCKED IP SAVED:", redis_key, "TTL:", r.ttl(redis_key))
        else:
            print("REDIS NOT AVAILABLE - IP NOT BLOCKED")

        return "🚨 Attack Detected", 403

    return None


@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "message": "SentinelX Backend Active"
    })


@app.route("/api/logs")
def get_logs():
    logs = list(collection.find({}, {"_id": 0}))
    logs.reverse()

    return jsonify({
        "logs": logs,
        "total": len(logs)
    })
    
@app.route("/api/stats")
def get_stats():
    logs = list(collection.find({}, {"_id": 0}))

    total = len(logs)
    attacks = sum(1 for log in logs if log.get("attack") == True)
    safe = total - attacks

    critical = sum(1 for log in logs if log.get("severity") == "CRITICAL")
    high = sum(1 for log in logs if log.get("severity") == "HIGH")
    medium = sum(1 for log in logs if log.get("severity") == "MEDIUM")

    unique_ips = len(set(log.get("ip") for log in logs if log.get("ip")))

    return jsonify({
        "total": total,
        "attacks": attacks,
        "safe": safe,
        "critical": critical,
        "high": high,
        "medium": medium,
        "unique_ips": unique_ips
    })


@app.route("/api/blocked-ips")
def get_blocked_ips():
    blocked = []

    if not r:
        return jsonify({
            "blocked": [],
            "total": 0,
            "redis": "not connected"
        })

    keys = r.keys("block:*")
    print("REDIS BLOCK KEYS:", keys)

    for key in keys:
        blocked.append({
            "ip": key.replace("block:", ""),
            "reason": r.get(key),
            "ttl": r.ttl(key)
        })

    return jsonify({
        "blocked": blocked,
        "total": len(blocked),
        "redis": "connected"
    })
    
    
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    existing_user = users_collection.find_one({"email": email})

    if existing_user:
        return jsonify({"message": "User already exists"}), 409

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users_collection.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": str(datetime.datetime.now())
    })

    return jsonify({"message": "Account created successfully"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    token = jwt.encode({
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }), 200    
    
    
@app.route("/api/users")
def get_users():
    users = list(users_collection.find({}, {"password": 0}))

    for user in users:
        user["_id"] = str(user["_id"])

    return jsonify(users)


@app.route("/dashboard")
def dashboard():
    logs = list(collection.find({}, {"_id": 0}))
    logs.reverse()

    total = len(logs)
    attacks = sum(1 for log in logs if log.get("attack"))
    safe = total - attacks

    blocked = []

    if r:
        for key in r.keys("block:*"):
            blocked.append(key.replace("block:", ""))

    return render_template(
        "dashboard.html",
        logs=logs,
        total=total,
        attacks=attacks,
        safe=safe,
        blocked=blocked
    )


if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True
    )