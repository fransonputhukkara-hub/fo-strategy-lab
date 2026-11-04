
import json
from getpass import getpass
from neo_api_client import NeoAPI

print("KOTAK NEO - READ ONLY LIVE QUOTE TEST")
print("--------------------------------------")

consumer_key = getpass("Consumer Key: ")
mobile = input("Registered mobile number: ").strip()
ucc = input("UCC: ").strip()
totp = getpass("Current TOTP code: ")
mpin = getpass("MPIN: ")

client = NeoAPI(
    environment="prod",
    access_token=None,
    neo_fin_key=None,
    consumer_key=consumer_key
)

try:
    print("\nStep 1: Authenticating...")
    login = client.totp_login(
        mobile_number=mobile,
        ucc=ucc,
        totp=totp
    )

    if isinstance(login, dict) and login.get("error"):
        print("TOTP login failed:", login.get("error"))
        raise SystemExit(1)

    print("TOTP login completed.")

    print("\nStep 2: Validating MPIN...")
    validation = client.totp_validate(mpin=mpin)

    if isinstance(validation, dict) and validation.get("error"):
        print("MPIN validation failed:", validation.get("error"))
        raise SystemExit(1)

    print("Authentication completed.")

    print("\nStep 3: Requesting NIFTY option quote...")

    result = client.quotes(
        instrument_tokens=[
            {
                "exchange_segment": "nse_fo",
                "instrument_token": "39914"
            }
        ],
        quote_type="all"
    )

    print("\nQUOTE RESPONSE:")
    print(json.dumps(result, indent=2, default=str))

    if isinstance(result, dict) and (
        result.get("Error") or result.get("error")
    ):
        print("\nQUOTE REQUEST NEEDS INVESTIGATION.")
    else:
        print("\nQUOTE REQUEST RETURNED A RESPONSE.")
        print("We must inspect its fields to confirm usable live prices.")

    print("\nNo orders were placed, modified or cancelled.")

except SystemExit:
    raise
except Exception as exc:
    print("\nTEST FAILED:")
    print(type(exc).__name__, str(exc))
    print("Do not share credentials or authentication tokens.")
