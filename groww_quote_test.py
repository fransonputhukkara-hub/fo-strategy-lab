
from getpass import getpass

def main():
    print("GROWW READ-ONLY MARKET QUOTE TEST")
    print("---------------------------------")

    token = getpass("Enter Groww access token (hidden): ").strip()

    if not token:
        print("ERROR: No token entered.")
        return

    try:
        from growwapi import GrowwAPI

        groww = GrowwAPI(token)

        print("\nRequesting NIFTY quote...")

        response = groww.get_quote(
            exchange=groww.EXCHANGE_NSE,
            segment=groww.SEGMENT_CASH,
            trading_symbol="NIFTY"
        )

        if not response:
            print("FAILED: Empty response from Groww.")
            return

        print("\nSUCCESS: MARKET DATA RECEIVED")
        print("Instrument: NIFTY")
        print("Response:", response)
        print("No orders were placed.")

    except Exception as error:
        print("\nMARKET QUOTE TEST FAILED")
        print("Error type:", type(error).__name__)
        print("Error:", str(error))
        print("No orders were placed.")

if __name__ == "__main__":
    main()
