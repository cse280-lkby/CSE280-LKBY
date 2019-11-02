import React from 'react';

// Parse out SSML style <break/>s into separate lines of text
function withBreaks(text) {
  return text.split(/<break [^>]+>/);
}

function ChatMessage(props) {
  return (
    <div className={`ChatMessage ${props.msg.outgoing ? 'Outgoing' : 'Incoming'}`}>
      {withBreaks(props.msg.text).map(line => <div>{line}</div>)}
    </div>
  );
}

export default ChatMessage;
