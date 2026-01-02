import urllib.request
import json
import ssl

# Ignore SSL certificate errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

api_key = "YOUR_BAIDU_API_KEY_HERE"
secret_key_l = "YOUR_BAIDU_SECRET_KEY_HERE" # lowercase l
secret_key_I = "YOUR_BAIDU_SECRET_KEY_HERE" # uppercase I

def test_token(ak, sk, label):
    url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={ak}&client_secret={sk}"
    try:
        response = urllib.request.urlopen(url, context=ctx)
        data = json.loads(response.read().decode('utf-8'))
        print(f"Testing {label}: {data}")
    except Exception as e:
        print(f"Testing {label} Failed: {e}")

print("--- Starting Token Test ---")
test_token(api_key, secret_key_l, "Lowercase l")
test_token(api_key, secret_key_I, "Uppercase I")
print("--- End Token Test ---")
