import React from 'react';

function Suggestion(props) {
  return (
    <button className="Suggestion">
      {props.name}
    </button>
  );
}

export default Suggestion;
