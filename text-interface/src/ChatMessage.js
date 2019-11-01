import React from 'react';

function ChatMessage(props) {
  return (
    <div className={`ChatMessage ${props.outgoing ? 'Outgoing' : 'Incoming'}`}>
        {props.text}
    </div>
  );
}

export default ChatMessage;
