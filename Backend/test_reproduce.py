import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

# 1. Sign up / Login a new user
r = requests.post('http://127.0.0.1:8000/auth/signup', json={
    'email': 'brand_new_user@example.com',
    'password': 'password123',
    'full_name': 'Brand New User'
})
print('Signup status:', r.status_code)
if r.status_code == 200:
    token = r.json()['access_token']
else:
    r2 = requests.post('http://127.0.0.1:8000/auth/login', json={
        'email': 'brand_new_user@example.com',
        'password': 'password123'
    })
    token = r2.json()['access_token']

# 2. Test 'hi'
print("\n--- Testing 'hi' on Brand New User ---")
chat = requests.post('http://127.0.0.1:8000/ai/chat', headers={'Authorization': f'Bearer {token}'}, json={'message': 'hi'})
print('Chat hi status:', chat.status_code)
if chat.status_code != 200:
    print('Chat error text:', chat.text)
else:
    print('Chat reply:\n', chat.json().get('reply'))

# 3. Test queries
queries = [
    'hi',
    'hello',
    'hey',
    'How much did I spend this month?',
    'What is my Needs vs Wants breakdown?',
    'Do I have any unusual expenses?',
    'What is my predicted expense for next month?',
    'How are my savings goals progressing?',
    'How can I improve my savings rate?'
]

for q in queries:
    c = requests.post('http://127.0.0.1:8000/ai/chat', headers={'Authorization': f'Bearer {token}'}, json={'message': q})
    print(f"Query '{q}' -> Status: {c.status_code}")
    if c.status_code != 200:
        print('  ERROR:', c.text)
