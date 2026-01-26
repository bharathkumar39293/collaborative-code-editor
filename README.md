# LiveCode

**Real-time Collaborative Engineering IDE**

![React](https://img.shields.io/badge/React-18.2.0-blue) ![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange) ![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-green) ![Docker](https://img.shields.io/badge/Docker-Sandbox-blue)

A professional-grade collaborative code editor engineered for high-concurrency synchronization, hybrid code execution, and premium developer experience. This project implements **CRDTs (Conflict-free Replicated Data Types)** to ensure guaranteed eventual consistency across distributed clients.

## ✨ Key Features

- **Conflict-Free Collaboration**: Powered by **Yjs**, ensuring seamless, wait-free editing without merge conflicts or data loss.
- **Hybrid Execution Engine**: Multi-tier execution system supporting:
  - **Docker Containers**: Secure, local sandboxing for C, C++, and Java.
  - **WebAssembly (Pyodide)**: Direct in-browser Python execution with zero backend overhead.
  - **Piston API**: Global cloud fallback for high availability.
- **Real-Time Presence**: Synchronization of **multi-color cursors**, active selections, and user metadata (sub-50ms latency).
- **Premium Design System**: Cyberpunk/Modern UI built with **Glassmorphism**, smooth transitions, and a custom CSS variable system.
- **Syntax Highlighting**: Support for 15+ themes and multiple languages including C, C++, Java, and Python.

## 🏗 Architecture

### Real-Time Synchronization
The core of LiveCode is built on **Yjs**, a high-performance CRDT framework.
- **Mechanism**: Every change is represented as a unique, idempotent operation that converges and merges automatically across all peers.
- **Awareness**: The `y-protocols/awareness` protocol is used to broadcast transient user state like cursor positions and "Currently Typing" badges.
- **Transport**: WebSockets (Socket.IO) act as the delivery layer, ensuring low-latency message propagation.

### Code Execution Guardrails
The backend implements a **Graceful Fallback Logic**:
1. **Tier 1 (Local)**: Attempts to spin up a Docker container on the host.
2. **Tier 2 (Client-Side)**: For Python, execution is offloaded to the browser via WASM.
3. **Tier 3 (Cloud)**: If local infrastructure is unavailable, requests are securely routed to the Piston execution service.

## 🛠 Technology Stack

- **Frontend**: React 18, Recoil, CodeMirror v5, Yjs, Vite, Vanilla CSS.
- **Backend**: Node.js, Express, Socket.IO, y-websocket.
- **Execution**: Docker, WebAssembly (Pyodide), Piston API.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v16 or higher
- **Docker**: (Optional) For local code execution sandboxing.

### Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/bharathkumar39293/collaborative-code-editor.git
    cd collaborative-code-editor
    npm install
    ```

2.  **Environment Setup**
    ```bash
    cp example.env .env
    # Configure your VITE_SOCKET_SERVER_URL (default: http://localhost:5000)
    ```

3.  **Run Application**
    ```bash
    # Start the backend server
    npm start

    # In a new terminal, start the frontend
    npm run dev
    ```

4.  **Docker Setup (Optional)**
    ```bash
    # Build the execution sandbox
    npm run setup:sandbox
    ```

## 🔒 Security

- Isolated code execution via Docker containers with CPU/Memory limits.
- Sub-process management with strict timeouts.
- Helmet.js and CORS protection for API endpoints.

---
**License**: MIT  
**Author**: [Bharath Kumar](https://github.com/bharathkumar39293)
