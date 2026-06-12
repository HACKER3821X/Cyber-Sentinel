import requests

def get_location(ip):
    if ip in ["127.0.0.1", "::1"] or ip.startswith("192.168.") or ip.startswith("10."):
        return {
            "country": "Local",
            "city": "Localhost",
            "lat": 0,
            "lon": 0,
            "isp": "Local Network"
        }

    try:
        res = requests.get(f"http://ip-api.com/json/{ip}", timeout=3)
        data = res.json()

        return {
            "country": data.get("country", "Unknown"),
            "city": data.get("city", "Unknown"),
            "lat": data.get("lat", 0),
            "lon": data.get("lon", 0),
            "isp": data.get("isp", "Unknown")
        }

    except Exception:
        return {
            "country": "Unknown",
            "city": "Unknown",
            "lat": 0,
            "lon": 0,
            "isp": "Unknown"
        }