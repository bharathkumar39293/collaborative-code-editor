import React from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ roomId, connected, onCopyRoomId, onCopyInviteLink }) => {
  const navigate = useNavigate();

  return (
    <header className="glass-panel" style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid var(--border-light)',
      borderRadius: '0',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'var(--primary)',
            boxShadow: 'var(--shadow-glow)'
          }} />
          <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>LiveCode</span>
        </div>

        <div className={`badge ${connected ? 'badge-success' : 'badge-warning'}`}>
          {connected ? '● Live' : '○ Offline'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-ghost" onClick={onCopyRoomId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Room:</span>
          <span style={{ fontFamily: 'monospace' }}>{roomId?.slice(0, 8)}</span>
        </button>

        <button className="btn-primary" onClick={onCopyInviteLink}>
          Invite
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 8px' }} />

        <button className="btn-danger" onClick={() => navigate('/')}>
          Leave
        </button>
      </div>
    </header>
  );
};

export default Header;


