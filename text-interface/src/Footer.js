import React from 'react';

function Footer() {
  return (
    <div className="Footer">
      {/* <div className="Top">
        Suggestions will go here
      </div> */}
      <div className="Bottom">
        <input className="TextBox" type="text" placeholder="Write a message..."></input>
        <button className="SendButton">Send</button>
      </div>
    </div>
  );
}

export default Footer;
