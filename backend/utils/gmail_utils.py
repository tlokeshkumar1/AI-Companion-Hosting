import base64, os
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def get_gmail_service():
    creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    return build("gmail", "v1", credentials=creds)

def send_email(recipient, subject, body):
    message = MIMEText(body)
    message["to"] = recipient
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    service = get_gmail_service()
    service.users().messages().send(userId="me", body={"raw": raw}).execute()

async def send_welcome_email(to, name):
    body = f"Hi {name},\n\nWelcome to AI Companion! Your account has been created.\n\nThanks!"
    send_email(to, "Welcome to AI Companion!", body)

async def send_otp_email(to, otp):
    body = f"Your OTP for password reset is: {otp}\n\nValid for 10 minutes."
    send_email(to, "AI Companion - OTP", body)
