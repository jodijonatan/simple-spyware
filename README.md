# Simple Spyware - Remote Administration Tool

A modern Command & Control (C2) framework for remote system management and monitoring. This project provides a sleek web-based dashboard to manage connected agents, execute remote commands, and monitor system activities in real-time.

## ⚠️ Important Disclaimer

> **This software is intended for educational purposes and legitimate IT administration only.**  
> Unauthorized access to computer systems and networks is illegal. This tool should only be used on systems you own or have explicit written permission to manage. The developers assume no liability for any misuse of this software.

---

## Features

### 🖥️ Web-Based Control Panel

- Modern, dark-themed dashboard built with Next.js 16 and React 19
- Real-time agent monitoring with status indicators
- Responsive design with smooth animations using Framer Motion

### 🔄 Agent Management

- Automatic agent registration and heartbeat monitoring
- Real-time connection status tracking
- Multi-agent support with easy selection

### 💻 Remote Command Execution

- Reverse shell functionality from the web dashboard
- Send commands to connected agents
- View command results in real-time

### 📊 Activity Monitoring

- Clipboard monitoring and exfiltration
- System performance tracking (CPU/RAM usage)
- Activity logs with timestamps

### 📺 Live Screen Streaming

- Real-time screen capture streaming via TCP
- MJPEG streaming to web dashboard
- Visual monitoring of remote systems

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │────▶│   Fastify API   │◀────│   Agent (Python)│
│   (Next.js)     │     │   (Backend)     │     │   (Victim)      │
│   Port: 3000    │     │   Port: 8000    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  TCP Stream      │
                        │  Port: 9999      │
                        └─────────────────┘
```

### Components

| Component | Technology                         | Port | Description      |
| --------- | ---------------------------------- | ---- | ---------------- |
| Frontend  | Next.js 16, React 19, Tailwind CSS | 3000 | Web dashboard UI |
| Backend   | Fastify, better-sqlite3            | 8000 | REST API server  |
| Database  | SQLite (Prisma)                    | -    | Data storage     |
| Agent     | Python 3, requests, psutil         | -    | Remote client    |
| Stream    | Python, OpenCV, TCP                | 9999 | Screen capture   |

---

## Prerequisites

- **Node.js** 18+
- **Python** 3.8+
- **npm** or **yarn**

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jodijonatan/simple-spyware.git
cd simple-spyware
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install
```

### 3. Frontend Setup

```bash
# Return to root directory
cd ..

# Install frontend dependencies
npm install
```

### 4. Agent Setup

```bash
# Navigate to agent directory
cd agent

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

---

## Configuration

### 1. Backend Environment

Create a `.env` file in the `backend` directory (optional - defaults are provided):

```env
PORT=8000
HOST=0.0.0.0
```

### 2. Agent Configuration

Create a `.env` file in the `agent` directory:

```env
# C2 Server URL
C2_URL=http://localhost:8000

# Screen streaming server
SERVER_IP=YOUR_SERVER_IP
SERVER_PORT=9999
```

> **Note:** Replace `YOUR_SERVER_IP` with the actual server IP address for screen streaming.

---

## Usage

### 1. Start the Backend Server

```bash
cd backend
node server.js
```

The API server will start on `http://localhost:8000`.

### 2. Start the Frontend Dashboard

```bash
# In a new terminal
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### 3. Deploy the Agent

On the target machine, run:

```bash
cd agent
python agent.py
```

The agent will register itself with the C2 server and begin sending heartbeats.

### 4. Screen Streaming Server (Optional)

For live screen streaming functionality:

```bash
cd agent
python server.py
```

---

## API Endpoints

| Method | Endpoint                  | Description                 |
| ------ | ------------------------- | --------------------------- |
| POST   | `/register`               | Register a new agent        |
| POST   | `/exfiltrate`             | Receive exfiltrated data    |
| GET    | `/agents`                 | Get all registered agents   |
| GET    | `/logs/:hostname`         | Get logs for specific agent |
| POST   | `/command/send`           | Send command to agent       |
| GET    | `/command/next/:hostname` | Agent polls for commands    |
| POST   | `/command/result`         | Submit command result       |
| GET    | `/stream/live`            | MJPEG screen stream         |

---

## Dashboard Features

### Sidebar

- Agent list with connection status
- Online/offline indicators
- Quick agent selection

### Main Panel

- **Live Stream**: Real-time screen capture viewing
- **Quick Stats**: CPU load, memory usage, privilege level
- **Reverse Shell**: Terminal for command execution
- **Activity Stream**: Clipboard and heartbeat logs

---

## Security Considerations

1. **Network Security**: This tool transmits data without encryption. Do not use over untrusted networks.
2. **Authentication**: Currently, no authentication is implemented. Add authentication before production use.
3. **Firewall**: Ensure proper firewall rules are configured.
4. **Legal Compliance**: Only use on systems you own or have explicit permission to manage.

---

## Tech Stack

### Frontend

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- Lucide React

### Backend

- Fastify
- better-sqlite3
- Prisma
- @fastify/cors

### Agent

- Python 3
- requests
- psutil
- pyperclip
- opencv-python

---

## License

This project is provided for educational purposes only. Use at your own risk.

---

## Acknowledgments

- Built with modern web technologies
- Inspired by C2 frameworks and red team tools
- Designed for learning about command & control infrastructure
