import React from 'react';

// Parse out SSML style <break/>s into separate lines of text
function withBreaks(text) {
  return text.split(/<break [^>]+>/);
}

function ChatMessage(props) {
  return (
    props.msg.type === 'system'
      ? (
        <div className="SystemMessage">
          {props.msg.text}
        </div>
      )
      : (
        <div className={`ChatMessage ${props.msg.type === 'outgoing' ? 'Outgoing' : 'Incoming'}`}>
          {withBreaks(props.msg.text).map(line => <div>{line}</div>)}
        </div>
      )
  );
}

export default ChatMessage;
