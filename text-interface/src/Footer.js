import React from 'react';
import Suggestion from './Suggestion';

function Footer(props) {
  return (
    <div className="Footer">
      <div className="Top">
        {props.suggestions.map(name => <Suggestion name={name} />)}
      </div>
      <div className="Bottom">
        <input className="TextBox" type="text" placeholder="Write a message..."></input>
        <button className="SendButton">Send</button>
      </div>
    </div>
  );
}

export default Footer;
