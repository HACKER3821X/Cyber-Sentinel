from flask_cors import CORS
from flask import jsonify
from flask import Flask, request, render_template
from pymongo import MongoClient
from flask_socketio import SocketIO
import requests
import redis
import pickle
import datetime
import re

# =========================
# FLASK APP
# =========================
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# =========================
# MONGODB CONNECTION
# =========================
client = MongoClient("mongodb://localhost:27017/")
db = client["security"]
collection = db["logs"]

# =========================
# REDIS CONNECTION
# =========================
r = redis.Redis(host="localhost", port=6379, decode_responses=True)

# =========================
# LOAD AI MODEL
# =========================
with open("model.pkl", "rb") as file:
    vectorizer, model = pickle.load(file)
# =========================
# FEATURE EXTRACTION
# =========================
def features(data):

    suspicious = [
        "<script>",
        "select",
        "union",
        "drop",
        "alert",
        "--",
        "or 1=1",
        "../",
        "cmd",
        "wget",
        "curl",
        "onerror",
        "javascript:",
        "document.cookie"
    ]

    score = 0

    data = data.lower()

    for word in suspicious:
        if word in data:
            score += 1

    return [score]

# =========================
# REMOVE YOUR PERSONAL BLOCKED IP
# =========================
r.delete("block:127.0.0.1", "block:192.168.254.129")

# =========================
# SECURITY ENGINE
# ========================

def classify_attack(data):

    data = data.lower()

    # SQL Injection
    sql_patterns = [
        "or 1=1",
        "'--",
        "union select",
        "drop table",
        "information_schema",
    ]

    # XSS
    xss_patterns = [
        "<script>",
        "alert(",
        "onerror=",
        "javascript:",
    ]

    # Path Traversal
    path_patterns = [
        "../",
        "..\\",
        "/etc/passwd",
        "boot.ini",
    ]

    # Command Injection
    cmd_patterns = [
        "; ls",
        "; cat",
        "&&",
        "| whoami",
        "cmd.exe",
    ]

    # Scanner/Bot
    scanner_patterns = [
        "sqlmap",
        "nmap",
        "nikto",
        "acunetix",
    ]

    # SQLi
    for pattern in sql_patterns:

        if pattern in data:

            return "SQL Injection", "CRITICAL"

    # XSS
    for pattern in xss_patterns:

        if pattern in data:

            return "XSS Attack", "HIGH"

    # Path Traversal
    for pattern in path_patterns:

        if pattern in data:

            return "Path Traversal", "HIGH"

    # Command Injection
    for pattern in cmd_patterns:

        if pattern in data:

            return "Command Injection", "CRITICAL"

    # Scanner
    for pattern in scanner_patterns:

        if pattern in data:

            return "Scanner/Bot Activity", "MEDIUM"

    return "Normal Traffic", "SAFE"


def get_location(ip):


    # Local testing IP
    if ip in ["127.0.0.1", "::1"] or ip.startswith("192.168"):

        return {

            "country": "India",

            "city": "Indore",

            "lat": 22.7196,

            "lon": 75.8577,

            "isp": "Localhost"

        }

    try:

        response = requests.get(
            f"http://ip-api.com/json/{ip}"
        ).json()

        return {

            "country": response.get("country", "Unknown"),

            "city": response.get("city", "Unknown"),

            "lat": response.get("lat", 0),

            "lon": response.get("lon", 0),

            "isp": response.get("isp", "Unknown"),

        }

    except:

        return {

            "country": "Unknown",

            "city": "Unknown",

            "lat": 0,

            "lon": 0,

            "isp": "Unknown",

        }
@app.before_request

def security():

    ip = request.remote_addr

    # Skip frontend/static
    if request.path.startswith("/static"):
        return None

    if request.path.startswith("/api"):
        return None

    # Skip localhost blocking
    if ip == "127.0.0.1":
        pass

    # Check blocked IP
    if r.get(f"block:{ip}"):

        return "🚫 Your IP is Blocked", 403

    # Request data
    data = request.full_path.lower()

    location = get_location(ip)   

    attack_type, severity = classify_attack(data)

    # Mark attack true/false
    is_attack = attack_type != "Normal Traffic"

    # Attack patterns
    attacks = [
        "<script>",
        "alert(",
        "' or 1=1",
        "../",
        "union select",
        "drop table",
        "--",
    ]

    attack_detected = False

    for pattern in attacks:

        if pattern in data:

            attack_detected = True
            break

    # Save logs
    log = {
        "country": location["country"],
        "city": location["city"],
        "isp": location["isp"],
        "lat": location["lat"],
        "lon": location["lon"],
        "time": str(datetime.datetime.now()),
        "ip": ip,
        "url": request.url,
        "data": data,
        "attack": attack_detected,
        "attack_type": attack_type,
        "severity": severity
    }

    inserted = collection.insert_one(log)

    log["_id"] = str(inserted.inserted_id)

    socketio.emit("new_log", log)    

    # Block attack IP
    if attack_detected:

        r.set(f"block:{ip}", "1", ex=300)

        return "🚨 Attack Detected", 403


@app.route("/api/logs")
def get_logs():

    logs = list(collection.find({}, {"_id": 0}))

    logs.reverse()

    return jsonify(logs)

@app.route("/dashboard")

@app.route("/")
def home():

    return {
        "status": "running",
        "message": "SentinelX Backend Active"
    }


if __name__ == "__main__":

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True
    )

def dashboard():

    logs = list(collection.find({}, {"_id": 0}))

    logs.reverse()

    total = len(logs)

    attacks = sum(1 for log in logs if log["attack"])

    safe = total - attacks

    blocked = []

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

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
   socketio.run(
    app,
    host="0.0.0.0",
    port=5000,
    debug=True
)
