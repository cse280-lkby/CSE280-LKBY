import React from 'react';

function Login(props) {
  const [userID, setUserID] = React.useState('');

  const onSubmit = () => {
    props.setUserID(userID);
  };



  return (
    <div className="LoginContainer">
        <div className="Login">
            <h3>Welcome to My College Buddy</h3>
            <div className="LoginStrip">
                <input
                    className="TextBox"
                    name="userID"
                    onChange={evt => setUserID(evt.target.value)}
                    onKeyPress={evt => {
                        if (evt.key === 'Enter') {
                            onSubmit();
                        }
                    }}
                    placeholder="User ID"
                    type="text"
                    value={userID} />
                <button className="SubmitButton" onClick={onSubmit}>Submit</button>
            </div>
        </div>
    </div>
  );
}

export default Login;
