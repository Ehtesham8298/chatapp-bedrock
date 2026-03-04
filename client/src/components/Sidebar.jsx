import { useState, useMemo } from 'react';
import './Sidebar.css';

function getDateGroup(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && now.getDate() === date.getDate()) return 'Today';
  if (diffDays <= 1 && now.getDate() - date.getDate() === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  if (diffDays <= 30) return 'Previous 30 Days';
  return 'Older';
}

function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, isOpen, onToggle, username, onLogout }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(conv => {
      const group = getDateGroup(conv.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    });
    return groups;
  }, [filtered]);

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
        <button className="collapse-btn" onClick={onToggle} title="Close sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="11 17 6 12 11 7" />
            <line x1="18" y1="12" x2="6" y2="12" />
          </svg>
        </button>
      </div>

      {conversations.length > 3 && (
        <div className="sidebar-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="conversation-list">
        {filtered.length === 0 && (
          <div className="no-conversations">
            <p>{search ? 'No matching chats' : 'No conversations yet'}</p>
          </div>
        )}
        {groupOrder.map(group => {
          const items = grouped[group];
          if (!items || items.length === 0) return null;
          return (
            <div key={group} className="conversation-group">
              <div className="group-label">{group}</div>
              {items.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
                  onClick={() => onSelect(conv.id)}
                >
                  <svg className="chat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <span className="conversation-title">{conv.title}</span>
                  <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {username?.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{username}</span>
          <button className="logout-btn" onClick={onLogout} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
        <div className="footer-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>Powered by AWS Bedrock</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
