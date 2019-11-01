import React from 'react';
import ChatMessage from './ChatMessage';

function ChatPane() {
  return (
    <div className="ChatPane">
      {
        Array(30).fill('_').map(_ => <ChatMessage outgoing={Math.random() < 0.5} text="Hello" />)
      }
    </div>
  );
}

export default ChatPane;
