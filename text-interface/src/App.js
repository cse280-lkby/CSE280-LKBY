import React from 'react';
import Header from './Header';
import ChatPane from './ChatPane';
import Footer from './Footer';
import './App.css';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 'none' }}>
        <Header />
      </div>
      <div style={{ flex: 'auto' }}>
        <ChatPane />
      </div>
      <div style={{ flex: 'none' }}>
        <Footer />
      </div>
    </div>
  );
}

export default App;
