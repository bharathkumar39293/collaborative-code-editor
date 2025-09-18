import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from 'socket.io';
import ACTIONS from './src/actions/Actions.js';
import helmet from 'helmet';
import compression from 'compression';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

// Accept comma-separated allowed origins via env; default to localhost:5173 for dev
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const io = new Server(server, {
  cors: {
    // Allow dynamic origin during development if CLIENT_ORIGIN is not provided
    origin: (origin, callback) => {
      // No origin (e.g., mobile apps, curl) -> allow
      if (!origin) return callback(null, true);

      // If explicit list provided, enforce it
      if (process.env.CLIENT_ORIGIN) {
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      }

      // No env set -> allow the requesting origin (useful for Vite dev and same-origin prod)
      return callback(null, true);
    },
    methods: ['GET', 'POST'],
  },
});

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());

// Healthcheck for uptime monitors and container orchestrators
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Debug endpoint to check available runtimes
app.get('/api/runtimes', async (req, res) => {
  try {
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      const mod = await import('node-fetch');
      fetchFn = mod.default || mod;
    }
    const runtimes = await getAvailableRuntimes(fetchFn);
    res.json(runtimes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lightweight CORS for API routes (matches socket origins)
app.use('/api', (req, res, next) => {
  const reqOrigin = req.headers.origin;
  let allow = false;
  if (!process.env.CLIENT_ORIGIN) {
    allow = true; // dev: allow any
  } else if (reqOrigin && allowedOrigins.includes(reqOrigin)) {
    allow = true;
  }
  if (allow) {
    res.header('Access-Control-Allow-Origin', reqOrigin || '*');
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Cache for available runtimes
let runtimesCache = null;
let runtimesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get available runtimes from Piston
async function getAvailableRuntimes(fetchFn) {
  const now = Date.now();
  if (runtimesCache && (now - runtimesCacheTime) < CACHE_DURATION) {
    return runtimesCache;
  }

  try {
    const response = await fetchFn('https://emkc.org/api/v2/piston/runtimes');
    if (!response.ok) {
      throw new Error(`Failed to fetch runtimes: ${response.status}`);
    }
    const runtimes = await response.json();
    runtimesCache = runtimes;
    runtimesCacheTime = now;
    return runtimes;
  } catch (error) {
    console.error('Failed to fetch runtimes:', error.message);
    // Return default versions if fetch fails
    return [
      { language: 'c', version: '10.2.0' },
      { language: 'cpp', version: '10.2.0' }
    ];
  }
}

// Execute code (C/C++) via multiple execution services
app.use(express.json({ limit: '200kb' }));
app.post('/api/run', async (req, res) => {
  try {
    const { language, code } = req.body || {};
    if (!language || !code) {
      return res.status(400).json({ error: 'language and code are required' });
    }

    // Map our frontend mode names to language identifiers
    let langId;
    let fileName;
    if (language === 'text/x-c++src') {
      langId = 'cpp';
      fileName = 'main.cpp';
    } else if (language === 'c' || language === 'text/x-csrc') {
      langId = 'c';
      fileName = 'main.c';
    } else if (language === 'text/x-java') {
      langId = 'java';
      fileName = 'Main.java';
    } else {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    console.log(`Executing ${langId} code via execution service...`);

    // Try multiple execution services in order of preference
    const executionServices = [];
    
    // Only add local execution on Unix-like systems (not Windows)
    if (process.platform !== 'win32') {
      executionServices.push({
        name: 'Local',
        url: 'local',
        transformRequest: async (lang, code, fetchFn) => ({ lang, code }),
        transformResponse: async (data, fetchFn) => {
          // Local execution using system compiler
          const { lang, code } = data;
          const tempDir = tmpdir();
          const filePath = join(tempDir, fileName);
          const execPath = join(tempDir, `exec_${Date.now()}`);
          
          try {
            // Write code to temporary file
            await writeFile(filePath, code);
            
            // Compile and execute
            const compiler = lang === 'cpp' ? 'g++' : 'gcc';
            const compileCmd = `${compiler} -o "${execPath}" "${filePath}" 2>&1`;
            
            try {
              const { stdout: compileOutput, stderr: compileError } = await execAsync(compileCmd);
              
              if (compileError) {
                return {
                  stdout: '',
                  stderr: `Compilation Error:\n${compileError}`,
                  exitCode: 1,
                };
              }
            } catch (compileErr) {
              // Check if compiler is not installed
              if (compileErr.message.includes('not found') || compileErr.message.includes('command not found')) {
                throw new Error(`${compiler} compiler is not installed on this system. Please install ${compiler} to use local execution.`);
              }
              throw compileErr;
            }
            
            // Execute the compiled program
            const { stdout: runOutput, stderr: runError } = await execAsync(`"${execPath}" 2>&1`);
            
            return {
              stdout: runOutput || '',
              stderr: runError || '',
              exitCode: 0,
            };
            
          } catch (error) {
            return {
              stdout: '',
              stderr: `Execution Error: ${error.message}`,
              exitCode: 1,
            };
          } finally {
            // Clean up temporary files
            try {
              await unlink(filePath);
              await unlink(execPath);
            } catch (cleanupError) {
              console.warn('Failed to clean up temp files:', cleanupError.message);
            }
          }
        },
      });
    }
    
    // Add remote services
    executionServices.push(
      {
        name: 'Piston',
        url: 'https://emkc.org/api/v2/piston/execute',
        transformRequest: async (lang, code, fetchFn) => {
          const runtimes = await getAvailableRuntimes(fetchFn);
          console.log('Available runtimes:', JSON.stringify(runtimes, null, 2));
          
          // Find the runtime for the specific language
          const langRuntime = runtimes.find(r => r.language === lang);
          const version = langRuntime ? langRuntime.version : '10.2.0';
          
          console.log(`Using version ${version} for language ${lang}`);
          
          return {
            language: lang,
            version: version,
            files: [{ name: fileName, content: code }],
            stdin: '',
            args: [],
            compile_timeout: 10000,
            run_timeout: 3000,
            compile_memory_limit: -1,
            run_memory_limit: -1
          };
        },
        transformResponse: (data) => ({
          stdout: data?.run?.stdout || '',
          stderr: data?.run?.stderr || '',
          exitCode: data?.run?.code || 0,
        }),
      },
      {
        name: 'Judge0',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        transformRequest: async (lang, code, fetchFn) => ({
          language_id: langId === 'cpp' ? 54 : 50, // C++: 54, C: 50
          source_code: code,
        }),
        transformResponse: async (data, fetchFn) => {
          // Judge0 requires a second request to get results
          const token = data.token;
          if (!token) throw new Error('No token received from Judge0');
          
          // Wait a bit and then fetch results
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const resultResponse = await fetchFn(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key',
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
          });
          
          if (!resultResponse.ok) {
            throw new Error(`Judge0 result fetch failed: ${resultResponse.status}`);
          }
          
          const resultData = await resultResponse.json();
          return {
            stdout: resultData.stdout || '',
            stderr: resultData.stderr || '',
            exitCode: resultData.status?.id || 0,
          };
        },
      }
    );

    // Use global fetch if present; else fallback to node-fetch dynamically
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      const mod = await import('node-fetch');
      fetchFn = mod.default || mod;
    }

    let lastError = null;
    
    for (const service of executionServices) {
      try {
        console.log(`Trying ${service.name} execution service...`);
        
        const requestBody = await service.transformRequest(langId, code, fetchFn);
        
        // Handle local execution differently
        if (service.name === 'Local') {
          const result = await service.transformResponse(requestBody, fetchFn);
          console.log(`${service.name} execution successful`);
          return res.json(result);
        }
        
        // Handle remote services
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        };

        // Add special headers for Judge0
        if (service.name === 'Judge0') {
          requestOptions.headers['X-RapidAPI-Key'] = process.env.RAPIDAPI_KEY || 'demo-key';
          requestOptions.headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
        }

        const response = await fetchFn(service.url, requestOptions);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${service.name} service failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const result = await service.transformResponse(data, fetchFn);
        
        console.log(`${service.name} execution successful`);
        return res.json(result);
        
      } catch (error) {
        console.error(`${service.name} execution failed:`, error.message);
        lastError = error;
        continue; // Try next service
      }
    }

    // If all services failed, return a helpful error message
    console.error('All execution services failed');
    return res.status(502).json({ 
      error: 'All execution services are currently unavailable',
      detail: lastError?.message || 'Unknown error',
      suggestion: 'Please try again later or check your internet connection'
    });

  } catch (e) {
    console.error('Run API error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      detail: String(e?.message || e),
      suggestion: 'Please check the server logs for more details'
    });
  }
});

// Serve Vite build output from dist
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));
app.use((req, res, next) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const userSocketMap = {};
function getAllConnectedClients(roomId) {
  // For every socket in a room, get its username
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
    return {
      socketId,
      username: userSocketMap[socketId] || "Anonymous", // fallback to avoid undefined
    };
  });
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    // Prevent empty username; fallback/debug
    if (!username || username.trim() === "") {
      console.log(`[WARN] Empty username received for socketId ${socket.id}`);
      userSocketMap[socket.id] = "Anonymous";
    } else {
      userSocketMap[socket.id] = username;
    }
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    console.log('[JOINED EMIT]:', clients);

    // Send joined event to everyone in the room (including joiner)
    io.to(roomId).emit(ACTIONS.JOINED, {
      clients,
      username: userSocketMap[socket.id],
      socketId: socket.id,
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });
});

app.get('/', (req, res) => {
  const htmlContent = '<h1>Welcome to the code editor server</h1>';
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

const PORT = process.env.SERVER_PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
