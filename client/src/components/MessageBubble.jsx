import MarkdownRenderer from './MarkdownRenderer';
import './MessageBubble.css';

function MessageBubble({ role, content, isStreaming }) {
  // Extract text and images from content
  const isMultimodal = Array.isArray(content);
  const textContent = isMultimodal
    ? content.find(b => b.type === 'text')?.text || ''
    : content;
  const images = isMultimodal
    ? content.filter(b => b.type === 'image')
    : [];

  return (
    <div className={`message ${role}`}>
      <div className={`message-avatar ${role}`}>
        {role === 'user' ? 'U' : 'AI'}
      </div>
      <div className="message-content">
        {role === 'assistant' ? (
          <>
            <MarkdownRenderer content={content} />
            {isStreaming && content.length === 0 && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
            {isStreaming && content.length > 0 && (
              <span className="cursor-blink">|</span>
            )}
          </>
        ) : (
          <>
            {images.length > 0 && (
              <div className="message-images">
                {images.map((img, i) => (
                  <img key={i} src={img.preview} alt="Uploaded" className="message-image" />
                ))}
              </div>
            )}
            {textContent && <p>{textContent}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
