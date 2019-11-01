import React from 'react';
import Header from './Header';
import ChatPane from './ChatPane';
import Footer from './Footer';
import './App.css';

const TEST_USER_ID = 'text-interface-test-user';
const TEST_SESSION_ID = TEST_USER_ID + new Date().toString();
const TEST_ENDPOINT = 'http://localhost:8080/sendMessage';

async function sendMessageAndGetReply(text) {
  const reqData = {
    userID: TEST_USER_ID,
    sessionID: TEST_SESSION_ID,
    message: text
  };

  const response = await fetch(TEST_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(reqData),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data;
}

function App() {
  const [state, setState] = React.useState({
    messages: [
      {
        outgoing: true,
        text: 'Hello'
      },
      {
        outgoing: false,
        text: 'Hi, how are you?'
      },
      {
        outgoing: true,
        text: 'Good thanks. How are you?'
      },
      {
        outgoing: false,
        text: 'Great, thanks for asking!'
      }
    ],
    suggestions: [
      'Hello',
      'How are you?',
      'ABC'
    ],
    isLoading: false,
  });

  const sendMessage = async (text) => {
    const newMsg = {
      outgoing: true,
      text
    };
    
    // Update displayed messages, empty suggestions locally.
    setState(oldState => ({
      ...oldState,
      messages: [
        ...oldState.messages,
        newMsg
      ],
      suggestions: [],
      isLoading: true
    }));

    // Send the message request
    try {
      const response = await sendMessageAndGetReply(text);
      if (!response) throw new Error();

      const {message, suggestions} = response;
      if (!message || !suggestions) throw new Error();
      
      const newReply = {
        outgoing: false,
        text: message
      };

      setState(oldState => ({
        ...oldState,
        messages: [
          ...oldState.messages,
          newReply
        ],
        suggestions,
        isLoading: false
      }));
    } catch (e) {
      console.error(e);
      alert('There was a connection problem. Please restart the app.');
      setState(oldState => ({
        ...oldState,
        isLoading: false
      }));
    }
  };

  return (
    <div className="root">
      <Header />
      <ChatPane messages={state.messages} />
      <Footer isLoading={state.isLoading} sendMessage={sendMessage} suggestions={state.suggestions} />
    </div>
  );
}

export default App;
