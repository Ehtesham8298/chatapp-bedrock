import './Sidebar.css';

function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, isOpen, onToggle }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNew}>
          + New Chat
        </button>
        <button className="collapse-btn" onClick={onToggle}>
          ✕
        </button>
      </div>
      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <span className="conversation-title">{conv.title}</span>
            <button
              className="delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
