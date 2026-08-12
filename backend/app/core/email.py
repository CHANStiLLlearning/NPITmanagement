import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_alert_email(to_email: str, subject: str, body: str):
    if not SMTP_HOST or not SMTP_USER:
        logger.warning(f"Simulating email to {to_email} (SMTP not configured). Subject: {subject}")
        print(f"--- EMAIL SIMULATION ---")
        print(f"To: {to_email}\nSubject: {subject}\nBody: {body}")
        print(f"------------------------")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Alert email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
