import React from 'react';
import Suggestion from './Suggestion';

function Footer() {
  return (
    <div className="Footer">
      <div className="Top">
        <Suggestion name="Hello" />
        <Suggestion name="Hello" />
        <Suggestion name="Hello" />
        <Suggestion name="Hello" />
      </div>
      <div className="Bottom">
        <input className="TextBox" type="text" placeholder="Write a message..."></input>
        <button className="SendButton">Send</button>
      </div>
    </div>
  );
}

export default Footer;
