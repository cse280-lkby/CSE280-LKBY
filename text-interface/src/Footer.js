import React from 'react';
import Suggestion from './Suggestion';

function Footer(props) {
  const [draft, setDraft] = React.useState('');
  const handleSend = () => {
    if (draft.trim().length === 0) {
      return;
    }
    props.sendMessage(draft);
    setDraft('');
  };
  const sendSuggestion = (text) => {
    props.sendMessage(text);
  };

  return (
    <div className="Footer">
      <div className="Top">
        {props.suggestions.map(text => <Suggestion key={text} onClick={sendSuggestion} text={text} />)}
      </div>
      <div className="Bottom">
        <input
          className="TextBox"
          onChange={evt => setDraft(evt.target.value)}
          onKeyPress={evt => {
            if (evt.key === 'Enter') {
              handleSend();
            }
          }}
          placeholder="Write a message..."
          type="text"
          value={draft}
        />
        <button className="SendButton" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Footer;
