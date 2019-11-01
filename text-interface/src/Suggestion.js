import React from 'react';

function Suggestion(props) {
  const handleClick = () => {
    props.onClick(props.text);
  }

  return (
    <button className="Suggestion" onClick={handleClick}>
      {props.text}
    </button>
  );
}

export default Suggestion;
