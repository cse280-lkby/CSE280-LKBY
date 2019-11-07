import React from 'react';
import ChatMessage from './ChatMessage';

function ChatPane(props) {
  const paneRef = React.useRef();

  // Autoscroll when messages arrive
  React.useEffect(() => {
    if (!paneRef.current) return;
    paneRef.current.scrollTop = paneRef.current.scrollHeight;
  }, [props.messages.length]);

  return (
    <div className="ChatPane" ref={paneRef}>
      {
        props.messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)
      }
    </div>
  );
}

export default ChatPane;
