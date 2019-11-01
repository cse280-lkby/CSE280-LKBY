import React from 'react';

function ChatMessage(props) {
  return (
    <div className={`ChatMessage ${props.msg.outgoing ? 'Outgoing' : 'Incoming'}`}>
      {props.msg.text}
    </div>
  );
}

export default ChatMessage;
