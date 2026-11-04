
from getpass import getpass

def main():
    print("GROWW READ-ONLY CONNECTION TEST")
    print("--------------------------------")

    token = getpass("Enter Groww access token (input hidden): ").strip()

    if not token:
        print("ERROR: No token entered.")
        return

    try:
        from growwapi import GrowwAPI

        print("\nConnecting to Groww...")
        groww = GrowwAPI(token)

        print("Requesting user profile...")
        response = groww.get_user_profile()

        if not response:
            print("FAILED: Empty response.")
            return

        print("\nCONNECTION SUCCESSFUL")
        print("Response type:", type(response).__name__)
        print("Read-only profile request completed.")

    except Exception as error:
        print("\nCONNECTION TEST FAILED")
        print("Error type:", type(error).__name__)
        print("Error:", str(error))
        print("Do not share your API token.")

if __name__ == "__main__":
    main()
