import React from 'react';
import Header from './Header';
import ChatPane from './ChatPane';
import Footer from './Footer';
import Login from './Login';
import Div100vh from 'react-div-100vh'
import './App.css';

const TEST_ENDPOINT = '/sendMessage';
const INITIAL_SUGGESTIONS = [
  'Talk to My College Buddy'
];

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
      suggestions: INITIAL_SUGGESTIONS
    }));
  }

  const sendMessage = async (text) => {
    const newMsg = {
      type: 'outgoing',
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

      const { message, suggestions, finished } = response;
      if (!message || !suggestions) throw new Error();

      const newMessages = [
        {
          type: 'incoming',
          text: message
        },
        finished && {
          type: 'system',
          text: 'My College Buddy ended the conversation'
        }
      ].filter(Boolean);

      setState(oldState => ({
        ...oldState,
        messages: [
          ...oldState.messages,
          ...newMessages
        ],
        suggestions: finished ? INITIAL_SUGGESTIONS : suggestions,
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
    <Div100vh className="root">
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
    </Div100vh>
  );
}

export default App;
