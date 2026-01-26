import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
        navigate(`/editor/${roomId}`, { state: { username } });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') joinRoom();
    };

    return (
        <div className="animate-fade" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accents */}
            <div style={{
                position: 'absolute',
                top: '-15%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'var(--primary-glow)',
                filter: 'blur(120px)',
                borderRadius: '50%',
                opacity: 0.2,
                animation: 'pulse 10s infinite alternate'
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-5%',
                width: '500px',
                height: '500px',
                background: 'var(--secondary)',
                filter: 'blur(140px)',
                borderRadius: '50%',
                opacity: 0.1,
                animation: 'pulse 12s infinite alternate-reverse'
            }}></div>

            <div className="glass-panel animate-slide-up" style={{
                padding: '48px',
                width: '480px',
                maxWidth: '90%',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), var(--shadow-glow)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        borderRadius: '18px',
                        margin: '0 auto 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.4)'
                    }}>
                        <img src="/code-sync.png" alt="Logo" style={{ height: '40px' }} />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>LiveCode</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0, fontWeight: '500' }}>
                        Seamless real-time collaboration for developers.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="flex-col gap-2">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room ID</label>
                        <input
                            type="text"
                            placeholder="Enter or generate a Room ID"
                            onChange={(e) => setRoomId(e.target.value)}
                            value={roomId}
                            onKeyUp={handleInputEnter}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: 'var(--text-main)',
                                outline: 'none',
                                fontSize: '15px',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                        />
                    </div>
                    <div className="flex-col gap-2">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</label>
                        <input
                            type="text"
                            placeholder="How should others see you?"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            onKeyUp={handleInputEnter}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: 'var(--text-main)',
                                outline: 'none',
                                fontSize: '15px',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                        />
                    </div>

                    <button className="btn-primary" onClick={joinRoom} style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
                        Join Space
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Don't have an ID? &nbsp;
                            <button
                                onClick={createNewRoom}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: '14px',
                                    textDecoration: 'underline'
                                }}>
                                Generate Room
                            </button>
                        </span>
                    </div>
                </div>
            </div>

            <footer style={{ position: 'absolute', bottom: '32px', color: 'var(--text-dim)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Built for professional teams</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-light)' }} />
                <a href="https://github.com/bharathkumar39293" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600' }}>
                    GitHub
                </a>
            </footer>
        </div>
    );
};

export default Home;
