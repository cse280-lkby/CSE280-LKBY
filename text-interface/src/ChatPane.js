import React from 'react';
import ChatMessage from './ChatMessage';

function scrollToBottom(paneRef) {
  if (!paneRef.current) return;
  paneRef.current.scrollTop = paneRef.current.scrollHeight;
}

function ChatPane(props) {
  const paneRef = React.useRef();

  // Autoscroll when messages arrive
  React.useEffect(() => {
    scrollToBottom(paneRef);
  }, [props.messages.length]);

  // Autoscroll when window resizes
  React.useEffect(() => {
    const eventListener = () => {
      scrollToBottom(paneRef);
    };

    window.addEventListener('resize', eventListener);

    return () => {
      window.removeEventListener('resize', eventListener);
    }
  }, []);

  return (
    <div className="ChatPane" ref={paneRef}>
      {
        props.messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)
      }
    </div>
  );
}

export default ChatPane;
