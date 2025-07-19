import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def generate_token():
    flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
    creds = flow.run_local_server(port=55432)  # Changed port
    with open("token.json", "w") as token_file:
        token_file.write(creds.to_json())
    print("Token saved to token.json")

if __name__ == "__main__":
    generate_token()
