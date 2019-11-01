import React from 'react';
import ChatMessage from './ChatMessage';

function ChatPane(props) {
  return (
    <div className="ChatPane">
      {
        props.messages.map(msg => <ChatMessage msg={msg} />)
      }
    </div>
  );
}

export default ChatPane;
