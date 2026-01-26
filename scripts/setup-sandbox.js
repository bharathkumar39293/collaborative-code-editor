import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupSandbox() {
    console.log('🏗️  Setting up Code Execution Sandbox...');

    try {
        // Check if Docker is running
        await execAsync('docker info');
        console.log('✅ Docker is running.');

        // Build the image
        console.log('📦 Building "code-sandbox" image (this may take a minute)...');
        await execAsync('docker build -t code-sandbox -f Dockerfile.sandbox .');

        console.log('✨ Sandbox image built successfully!');
        console.log('   Image Name: code-sandbox');

    } catch (error) {
        console.error('❌ Failed to setup sandbox.');
        if (error.message.includes('docker info')) {
            console.error('   Error: Docker is not running or not installed.');
        } else {
            console.error('   Error:', error.message);
        }
        process.exit(1);
    }
}

setupSandbox();
