import React from 'react';
import Header from './Header';
import ChatPane from './ChatPane';
import Footer from './Footer';
import './App.css';

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
    ]
  });

  const sendMessage = (text) => {
    setState(oldState => ({
      ...oldState,
      messages: [
        ...oldState.messages,
        {
          outgoing: true,
          text
        }
      ],
      suggestions: []
    }));
  };

  return (
    <div className="root">
      <Header />
      <ChatPane messages={state.messages} />
      <Footer sendMessage={sendMessage} suggestions={state.suggestions} />
    </div>
  );
}

export default App;
