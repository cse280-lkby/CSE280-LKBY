import React from 'react';

function ChatPane() {
  return (
    <div className="ChatPane">
      {
        Array(100).fill(<p>Chat Message</p>)
      }
    </div>
  );
}

export default ChatPane;
