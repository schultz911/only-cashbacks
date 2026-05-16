import urllib.request
import json

req = urllib.request.Request(
    "http://localhost:8000/v1/chat/completions",
    data=json.dumps({"tools": [{"name": "submit", "description": "Submits PR."}]}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
