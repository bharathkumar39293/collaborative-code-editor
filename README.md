# LiveCode - Real-time Collaborative Code Editor

A modern, real-time collaborative code editor built with React, Socket.io, and CodeMirror. Multiple users can code together in real-time, see each other's changes instantly, and execute code in multiple programming languages.

![LiveCode](https://img.shields.io/badge/LiveCode-Collaborative-blue) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-green)

## ✨ Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously with live synchronization
- **Multi-language Support**: 
  - JavaScript (Browser execution)
  - Python (Pyodide - WASM in-browser)
  - Java (Remote compilation)
  - C/C++ (Local/Remote compilation)
  - Plain Text
- **Code Execution**: Run code directly in the browser or via remote compilation services
- **Multiple Themes**: Choose from 13+ beautiful editor themes (Monokai, Material, Dracula, Nord, and more)
- **User Presence**: See who's connected to the room with user avatars
- **Room Management**: Create or join rooms with unique room IDs
- **Invite System**: Share room links or room IDs to invite collaborators
- **Optimized UI**: Compact, responsive design that fits on screen without scrolling
- **Secure**: Built with security best practices using Helmet and CORS protection

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bharathkumar39293/collaborative-code-editor.git
cd collaborative-code-editor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, for custom configuration):
```bash
cp example.env .env
```

Edit `.env` if needed:
```
VITE_SOCKET_SERVER_URL=http://localhost:5000
VITE_SERVER_PORT=5000
```

4. Start the development server:
```bash
# Start the backend server
npm start

# In a new terminal, start the frontend dev server
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📦 Building for Production

```bash
# Build the frontend
npm run build

# The built files will be in the `dist` directory
# The server will automatically serve these files in production mode
```

## 🐳 Docker Deployment

The project includes Docker support for easy deployment:

```bash
# Build and run with docker-compose
docker-compose up -d
```

Make sure to update the `docker-compose.yml` file with your Docker username if needed.

## 🏗️ Project Structure

```
realtime-collaborative-code-editor/
├── src/
│   ├── actions/          # Socket.io action definitions
│   ├── components/       # React components
│   │   ├── Client.jsx    # User avatar component
│   │   ├── Editor.jsx    # CodeMirror editor wrapper
│   │   └── Header.jsx    # App header with room info
│   ├── pages/            # Page components
│   │   ├── Home.jsx      # Landing page
│   │   └── EditorPage.jsx # Main editor page
│   ├── atoms.js          # Recoil state management
│   ├── socket.js         # Socket.io client setup
│   └── App.jsx           # Main app component
├── server.js             # Express + Socket.io server
├── docker-compose.yml    # Docker configuration
└── package.json          # Dependencies
```

## 🛠️ Technologies Used

- **Frontend**:
  - React 18.2.0
  - Vite 7.1.2
  - CodeMirror 5.65.20
  - Recoil (State management)
  - React Router DOM 7.8.2
  - React Hot Toast (Notifications)
  - React Avatar (User avatars)

- **Backend**:
  - Express 4.21.2
  - Socket.io 4.8.1
  - Helmet (Security)
  - Compression (Performance)

- **Code Execution**:
  - Pyodide (Python in-browser)
  - Remote compilation services (Java, C/C++)

## 🎨 Available Themes

- Monokai
- Material
- Material Darker
- Material Palenight
- Dracula
- Twilight
- Cobalt
- Eclipse
- Blackboard
- Neo
- Nord
- Seti
- Ruby Blue
- Midnight

## 🔒 Security Features

- Helmet.js for security headers
- CORS protection with configurable allowed origins
- Input validation and sanitization
- Secure code execution sandboxing

## 📝 Usage

1. **Create a Room**: Enter your username and click "Create Room"
2. **Join a Room**: Enter your username and a room ID, then click "Join Room"
3. **Invite Others**: Use the "Copy Room ID" or "Copy Invite Link" buttons in the sidebar
4. **Code Together**: Start typing - changes sync in real-time to all connected users
5. **Run Code**: Click the "▶ Run Code" button to execute your code
6. **Change Language**: Select a programming language from the dropdown
7. **Change Theme**: Choose your preferred editor theme

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Bharath Kumar**

- GitHub: [@bharathkumar39293](https://github.com/bharathkumar39293)

## 🙏 Acknowledgments

- CodeMirror for the excellent code editor
- Socket.io for real-time communication
- Pyodide for in-browser Python execution
- All the amazing open-source contributors

---

Made with ❤️ using React and Socket.io
