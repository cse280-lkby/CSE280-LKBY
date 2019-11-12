import React from 'react';
import Header from './Header';
import ChatPane from './ChatPane';
import Footer from './Footer';
import Login from './Login';
import './App.css';

const TEST_ENDPOINT = '/sendMessage';

async function sendMessageAndGetReply(session, text) {
  const reqData = {
    userID: session.userID,
    sessionID: session.sessionID,
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
    session: null,
    messages: [],
    suggestions: [],
    isLoading: false,
  });

  const setUserID = userID => {
    setState(oldState => ({
      ...oldState,
      session: {
        userID,
        sessionID: userID + '-' + (new Date()).toString()
      },
      suggestions: [
        'Hello'
      ]
    }));
  }

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
      const response = await sendMessageAndGetReply(state.session, text);
      if (!response) throw new Error();

      const { message, suggestions } = response;
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
      {state.session == null
        ? <Login setUserID={setUserID} />
        : (
          <>
            <Header />
            <ChatPane messages={state.messages} />
            <Footer
              isLoading={state.isLoading}
              sendMessage={sendMessage}
              suggestions={state.suggestions}
            />
          </>
        )}
    </div>
  );
}

export default App;
