# LiveCode

**Real-time Collaborative Code Editor**

![React](https://img.shields.io/badge/React-18.2.0-blue) ![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-green) ![Status](https://img.shields.io/badge/Status-Prototype-yellow)

A lightweight collaborative code editor engineered to demonstrate real-time synchronization, experimental code execution strategies, and modular state management. This project serves as a reference implementation for WebSocket-based collaboration patterns, while explicitly highlighting the trade-offs between simplicity and consistency guarantees.

## 🏗 Architecture & Trade-offs

### Real-time Synchronization
The application uses **Event Broadcasting** via Socket.io rather than Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs).

*   **Approach**: `CODE_CHANGE` events are broadcast to all other clients in the room.
*   **Concurrency Model**: **Last-Write-Wins (LWW)**.
*   **Trade-off**: This approach drastically reduces implementation complexity and backend CPU load compared to OT/CRDT. However, it provides **weaker consistency guarantees**. In high-latency scenarios with concurrent edits, temporary divergence or overwrites may occur.
*   **Note**: For production-grade text collaboration requiring eventual consistency under partition, a migration to CRDTs (e.g., Yjs) is recommended (see Roadmap).

### Failure Modes
*   **Late Join**: New users receive the last known document snapshot emitted by an active peer upon joining a room.
*   **Disconnects**: If a user disconnects, their presence is removed immediately. No offline support is currently implemented; changes made while disconnected are not queued.
*   **Server Restart**: The backend is **stateless**. If the server restarts, all active rooms and document states are lost. This design simplifies horizontal scaling but requires an external persistence layer (e.g., Redis/Postgres) for production use.

### Explicit Non-Guarantees
*   **No Offline Support**: Edits made while disconnected are not queued and will be lost.
*   **No Strong Consistency**: Concurrent edits are not guaranteed to converge (LWW).
*   **No Malicious User Protection**: The current architecture does not rate-limit or authenticate socket connections.

## 🛠 Technology Choices

### Frontend
*   **React 18 + Vite**: Chosen for high-performance rendering and rapid development cycle.
*   **Recoil**: Used for **atomic state management**. We selected Recoil over Redux to minimize boilerplate and ensure granular re-renders during high-frequency typing events. *Note: This choice will be revisited if the collaboration logic migrates to a CRDT-based shared state library like Yjs.*
*   **CodeMirror v5**: Integrated for its mature ecosystem and stability. While v6 offers better accessibility and mobile support, v5 provides a battle-tested API for this specific prototype scope.

### Code Execution
*   **Python**: Executed client-side via **Pyodide** (WASM), ensuring zero backend overhead and browser-level isolation.
*   **C/C++/Java**: Executed via remote APIs (Piston/Judge0) or local child processes.

## 🔒 Security Considerations

> [!WARNING]
> **Remote Code Execution (RCE) Risk**

*   **Local Execution**: The optional local execution feature (via `child_process.exec`) runs code directly on the host machine.
    *   **Status**: **DISABLED BY DEFAULT** in production configuration.
    *   **Risk**: This permits arbitrary code execution. It is intended **strictly for local development** or trusted private environments.
*   **Sandboxing**: The current implementation does not utilize container isolation (like Docker siblings) or microVMs per request. For a public-facing deployment, execution **must** be offloaded to a hardened sandbox environment (e.g., gVisor, Firecracker, or a dedicated execution SaaS).

## 🚀 Getting Started

### Prerequisites
*   Node.js v16+
*   npm or yarn

### Local Development

1.  **Clone & Install**
    ```bash
    git clone https://github.com/bharathkumar39293/collaborative-code-editor.git
    cd collaborative-code-editor
    npm install
    ```

2.  **Environment Setup**
    ```bash
    cp example.env .env
    # Edit .env to configure VITE_SOCKET_SERVER_URL and CLIENT_ORIGIN
    ```

3.  **Run Application**
    ```bash
    # Terminal 1: Start Backend
    npm start
    
    # Terminal 2: Start Frontend
    npm run dev
    ```

## 🔮 Future Roadmap

This project is an evolving engineering artifact. Planned improvements include:

*   **Consistency**: Migration to **Yjs** to implement CRDTs, ensuring eventual consistency and offline support.
*   **Editor Upgrade**: Transition to **CodeMirror v6** for improved mobile interaction and accessibility.
*   **Sandboxing**: Integrate **gVisor** or **Firecracker** for secure, multi-tenant code execution.
*   **Persistence & Auth**: Implementation of PostgreSQL for document storage and OAuth for user identity.
*   **Observability**: Adding OpenTelemetry instrumentation for monitoring WebSocket latency and error rates.

---
**License**: MIT
