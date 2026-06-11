# services/geo_service.py

import requests

def get_location(ip):

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
            "isp": response.get("isp", "Unknown")
        }

    except:
        return {
            "country": "Unknown",
            "city": "Unknown",
            "lat": 0,
            "lon": 0,
            "isp": "Unknown"
        }