
from getpass import getpass
from neo_api_client import NeoAPI

print("=== KOTAK NEO READ-ONLY DATA TEST ===")
print("No orders will be placed, modified or cancelled.")

secrets = []

def safe(value):
    text = str(value)
    for item in secrets:
        if item:
            text = text.replace(item, "[HIDDEN]")
    return text[:1000]

try:
    # Dashboard API Access Token, NOT Consumer Key
    access_token = getpass("Default Application TOKEN (hidden): ").strip()
    secrets.append(access_token)

    mobile = input("Registered mobile number with country code: ").strip()
    secrets.append(mobile)

    ucc = input("Kotak UCC (hidden): ").strip()
    secrets.append(ucc)

    totp = getpass("Fresh authenticator TOTP (hidden): ").strip()
    secrets.append(totp)

    if not all([access_token, mobile, ucc, totp]):
        raise ValueError("Required details are missing.")

    client = NeoAPI(
        environment="prod",
        access_token=None,
        neo_fin_key=None,
        consumer_key=access_token
    )

    print("\nStep 1: TOTP login...")
    login = client.totp_login(
        mobile_number=mobile,
        ucc=ucc,
        totp=totp
    )

    if not isinstance(login, dict) or "error" in login or "Error" in login:
        print("TOTP LOGIN FAILED:", safe(login))
        raise SystemExit(1)

    print("TOTP LOGIN SUCCESSFUL.")

    mpin = getpass("Kotak MPIN (hidden): ").strip()
    secrets.append(mpin)

    print("\nStep 2: MPIN validation...")
    validation = client.totp_validate(mpin=mpin)

    if not isinstance(validation, dict) or "error" in validation or "Error" in validation:
        print("MPIN VALIDATION FAILED:", safe(validation))
        raise SystemExit(1)

    print("AUTHENTICATION SUCCESSFUL.")
    print("Dynamic base URL:", client.configuration.base_url)

    # The dashboard Access Token is sent as plain Authorization.
    # No session Auth, SID or neo-fin-key for this endpoint.
    print("\nStep 3: Requesting NSE F&O instrument master...")

    import requests

    url = (
        client.configuration.base_url.rstrip("/")
        + "/script-details/1.0/masterscrip/file-paths"
    )

    response = requests.get(
        url,
        headers={
            "Authorization": access_token,
            "Content-Type": "application/json"
        },
        timeout=30
    )

    print("HTTP status:", response.status_code)

    try:
        data = response.json()
    except ValueError:
        data = response.text[:1000]

    if response.status_code == 200:
        print("SCRIP MASTER REQUEST SUCCESSFUL.")
        print("Response type:", type(data).__name__)

        if isinstance(data, dict):
            print("Response fields:", list(data.keys()))
            print("Response preview:", safe(data))
        elif isinstance(data, list):
            print("Records:", len(data))
            print("Sample:", safe(data[0]) if data else "Empty")
        else:
            print("Response:", safe(data))
    else:
        print("SCRIP MASTER REQUEST FAILED.")
        print("Response:", safe(data))

    print("\nNo trading or order requests were made.")

except SystemExit:
    pass
except Exception as exc:
    print("TEST FAILED:", type(exc).__name__, safe(exc))
finally:
    access_token = mobile = ucc = totp = mpin = None
    secrets.clear()
