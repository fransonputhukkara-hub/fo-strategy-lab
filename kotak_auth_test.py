
from getpass import getpass
from neo_api_client import NeoAPI


def has_error(response):
    return not isinstance(response, dict) or "error" in response or "Error" in response


def main():
    print("\n=== KOTAK NEO READ-ONLY AUTHENTICATION TEST ===")
    print("No trading or order functions will be called.\n")

    consumer_key = getpass("Consumer Key (hidden): ").strip()
    mobile = input("Registered mobile number (with country code): ").strip()
    ucc = input("Kotak UCC: ").strip()
    totp = getpass("Current 6-digit TOTP (hidden): ").strip()

    if not all([consumer_key, mobile, ucc, totp]):
        print("ERROR: Required input is missing.")
        return

    try:
        client = NeoAPI(
            environment="prod",
            access_token=None,
            neo_fin_key=None,
            consumer_key=consumer_key
        )

        print("\nStep 1: Verifying TOTP...")
        login_response = client.totp_login(
            mobile_number=mobile,
            ucc=ucc,
            totp=totp
        )

        if has_error(login_response):
            print("TOTP LOGIN FAILED. Check the details and try again.")
            print("Response fields:", list(login_response.keys())
                  if isinstance(login_response, dict) else "Unexpected response")
            return

        print("TOTP LOGIN SUCCESSFUL.")

        mpin = getpass("Kotak MPIN (hidden): ").strip()
        if not mpin:
            print("ERROR: MPIN was not entered.")
            return

        print("\nStep 2: Validating MPIN...")
        validate_response = client.totp_validate(mpin=mpin)

        if has_error(validate_response):
            print("MPIN VALIDATION FAILED.")
            print("Response fields:", list(validate_response.keys())
                  if isinstance(validate_response, dict) else "Unexpected response")
            return

        print("\nAUTHENTICATION SUCCESSFUL.")
        print("Kotak Neo session established.")
        print("Response fields:", list(validate_response.keys()))
        print("No orders were placed, modified or cancelled.")

    except Exception as exc:
        print("\nAUTHENTICATION TEST FAILED.")
        print("Error type:", type(exc).__name__)
        print("Check the official Kotak API status and credentials.")
        print("Do not share credentials or authentication responses.")

    finally:
        consumer_key = mobile = ucc = totp = mpin = None


if __name__ == "__main__":
    main()
