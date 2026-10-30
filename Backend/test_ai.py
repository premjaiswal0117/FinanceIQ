
import os
import sys
import requests
from pathlib import Path

# Reconfigure stdout to UTF-8 for Windows shells
sys.stdout.reconfigure(encoding="utf-8")

# Load environment variables from the project root .env file
env_path = Path(__file__).resolve().parents[1] / ".env"

if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(
                key.strip(),
                value.strip().strip('"').strip("'")
            )

# Read demo credentials from environment variables
demo_email = os.getenv("FINANCEIQ_DEMO_EMAIL")
demo_password = os.getenv("FINANCEIQ_DEMO_PASSWORD")

if not demo_email or not demo_password:
    raise RuntimeError(
        "Demo credentials are missing from the .env file."
    )

print("Authenticating demo account...")

token_res = requests.post(
    "http://127.0.0.1:8000/auth/login",
    json={
        "email": demo_email,
        "password": demo_password
    }
)

assert token_res.status_code == 200, (
    f"Login failed: {token_res.status_code}"
)

token = token_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n--- Testing /ai/status ---")

status_res = requests.get(
    "http://127.0.0.1:8000/ai/status",
    headers=headers
)

print("Status code:", status_res.status_code)
status_data = status_res.json()
print("Status body:", status_data)

assert status_res.status_code == 200
assert "provider" in status_data
assert "configured" in status_data

queries = [
    "hi",
    "hello",
    "How much did I spend this month?",
    "What is my Needs vs Wants breakdown?",
    "Do I have any unusual expenses?",
    "What is my predicted expense for next month?",
    "How are my savings goals progressing?",
    "How can I improve my savings rate?"
]

for q in queries:
    print("\n==============================")
    print(f"QUERY: {q}")
    print("==============================")

    resp = requests.post(
        "http://127.0.0.1:8000/ai/chat",
        headers=headers,
        json={"message": q}
    )

    print(f"HTTP Status: {resp.status_code}")

    assert resp.status_code == 200, (
        f"Query '{q}' returned status {resp.status_code}: {resp.text}"
    )

    data = resp.json()

    print("Provider:", data.get("provider"))
    print("Provider Label:", data.get("provider_label"))
    print("Configured:", data.get("configured"))
    print("Reply:")
    print(data.get("reply"))

print("\nAll AI queries verified successfully!")
