import React from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ roomId, connected, onCopyRoomId, onCopyInviteLink }) => {
  const navigate = useNavigate();

  return (
    <header className="appHeader">
      <div className="appHeader__left">
        <div className="brand">
          <span className="brand__dot" />
          <span className="brand__name">LiveCode</span>
        </div>
        <div className={`connBadge ${connected ? "ok" : "down"}`}>
          {connected ? "Connected" : "Offline"}
        </div>
      </div>
      <div className="appHeader__right">
        <button className="btn ghostBtn" onClick={onCopyRoomId}>
          Room: {roomId?.slice(0, 6)}…
        </button>
        <button className="btn primaryBtn" onClick={onCopyInviteLink}>
          Invite
        </button>
        <button
          className="btn dangerBtn"
          onClick={() => navigate("/")}
          title="Leave room"
        >
          Leave
        </button>
      </div>
    </header>
  );
};

export default Header;


