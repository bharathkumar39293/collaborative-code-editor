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
            <div className="formWrapper">
                <img
                    className="homePageLogo"
                    src="/logo.png"
                    alt="code-sync-logo"
                />
                <h4 className="mainLabel">Generate new room or paste invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>
                        Join
                    </button>
                    <div className="shareActions" style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <button
                            className="btn copyBtn"
                            onClick={async () => {
                                if (!roomId) {
                                    toast.error('Create or paste a ROOM ID first');
                                    return;
                                }
                                try {
                                    await navigator.clipboard.writeText(roomId);
                                    toast.success('Room ID copied');
                                } catch (e) {
                                    toast.error('Failed to copy');
                                }
                            }}
                        >
                            Copy Room ID
                        </button>
                        <button
                            className="btn copyBtn"
                            onClick={async () => {
                                if (!roomId) {
                                    toast.error('Create or paste a ROOM ID first');
                                    return;
                                }
                                try {
                                    const link = `${window.location.origin}/editor/${roomId}`;
                                    await navigator.clipboard.writeText(link);
                                    toast.success('Invite link copied');
                                } catch (e) {
                                    toast.error('Failed to copy');
                                }
                            }}
                        >
                            Copy Invite Link
                        </button>
                    </div>
                    <span className="createInfo">
                        If you don't have an invite then create &nbsp;
                        <Link
                            to="#"
                            onClick={createNewRoom}
                            className="createNewBtn"
                        >
                            new room
                        </Link>
                    </span>
                </div>
            </div>
            <footer>
                <h4>
                    Build by &nbsp;
                    <a href="https://github.com/Mohitur669" target="_blank" rel="noopener noreferrer">Mohd Mohitur Rahaman</a>
                </h4>
            </footer>
        </div>
    );
};

export default Home;