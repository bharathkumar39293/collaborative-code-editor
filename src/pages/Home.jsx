import React, {useState} from 'react';
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';
import {Link, useNavigate} from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            {/* Hero Section */}
            <div className="heroSection">
                <div className="heroContent">
                    <div className="heroIcon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="heroTitle">Real-time Collaborative Code Editor</h1>
                    <p className="heroSubtitle">
                        Code together, build faster. Share your coding sessions with teammates in real-time.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="mainContent">
                <div className="formWrapper">
                    <div className="formHeader">
                        <h2 className="formTitle">Join or Create a Room</h2>
                        <p className="formDescription">Enter your details to start collaborating</p>
                    </div>

                    <div className="inputGroup">
                        <div className="inputField">
                            <label className="inputLabel">Room ID</label>
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="Enter room ID or create new one"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                            />
                        </div>
                        
                        <div className="inputField">
                            <label className="inputLabel">Your Name</label>
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="Enter your display name"
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                onKeyUp={handleInputEnter}
                            />
                        </div>

                        <button className="btn joinBtn" onClick={joinRoom}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Join Room
                        </button>

                        {roomId && (
                            <div className="shareActions">
                                <button
                                    className="btn copyBtn"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(roomId);
                                            toast.success('Room ID copied');
                                        } catch (e) {
                                            toast.error('Failed to copy');
                                        }
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    </svg>
                                    Copy Room ID
                                </button>
                                <button
                                    className="btn copyBtn"
                                    onClick={async () => {
                                        try {
                                            const link = `${window.location.origin}/editor/${roomId}`;
                                            await navigator.clipboard.writeText(link);
                                            toast.success('Invite link copied');
                                        } catch (e) {
                                            toast.error('Failed to copy');
                                        }
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.47L11.75 5.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M14 11C13.5705 10.4259 13.0226 9.95085 12.3934 9.60705C11.7643 9.26325 11.0685 9.05886 10.3533 9.00766C9.63816 8.95645 8.92037 9.05972 8.24861 9.31026C7.57686 9.5608 6.96688 9.953 6.46 10.46L3.46 13.46C2.54918 14.403 2.04519 15.6661 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3962 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Copy Invite Link
                                </button>
                            </div>
                        )}

                        <div className="createInfo">
                            <span>Don't have a room?</span>
                            <button
                                onClick={createNewRoom}
                                className="createNewBtn"
                            >
                                Create New Room
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="featuresSection">
                    <h3 className="featuresTitle">Why Choose Our Editor?</h3>
                    <div className="featuresGrid">
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0413 20.9999 15.5767 20.2 15.38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h4>Real-time Collaboration</h4>
                            <p>See changes instantly as your teammates code alongside you</p>
                        </div>
                        
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22S2 18 2 12V5L12 2L22 5V12C22 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h4>Secure & Private</h4>
                            <p>Your code sessions are encrypted and only accessible with the room ID</p>
                        </div>
                        
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h4>Lightning Fast</h4>
                            <p>Optimized for speed with minimal latency for seamless coding</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="homeFooter">
                <p>
                    Built with ❤️ by{' '}
                    <a href="https://github.com/bharathkumar39293" target="_blank" rel="noopener noreferrer">
                        Bharath kumar
                    </a>
                </p>
            </footer>
        </div>
    );
};

export default Home;