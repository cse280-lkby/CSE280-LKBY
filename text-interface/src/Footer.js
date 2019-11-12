import React from 'react';
import Suggestion from './Suggestion';

function Footer(props) {
  const textBoxRef = React.useRef();
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

  React.useEffect(() => {
    if (!props.isLoading && textBoxRef.current) {
      textBoxRef.current.focus();
    }
  }, [props.isLoading]);

  return (
    <div className="Footer">
      {props.suggestions && props.suggestions.length > 0 &&
        <div className="Top">
          {props.suggestions.map(text => <Suggestion key={text} onClick={sendSuggestion} text={text} />)}
        </div>
      }
      <div className="Bottom">
        <input
          className="TextBox"
          // Not disabling this anymore because keyboard flickering on mobile
          // disabled={props.isLoading}
          onChange={evt => setDraft(evt.target.value)}
          onKeyPress={evt => {
            if (evt.key === 'Enter' && !props.isLoading) {
              handleSend();
            }
          }}
          placeholder="Write a message..."
          ref={textBoxRef}
          type="text"
          value={draft}
        />
        <button className="SendButton" disabled={props.isLoading} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Footer;
