/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * 
 * Generated with the TypeScript template
 * https://github.com/emin93/react-native-template-typescript
 * 
 * @format
 */

import React, {Component} from 'react';
import {View} from 'react-native';
import Chat from './Chat'
import Login from './Login'
import NotificationHandler from './NotificationHandler';

interface Props {}
interface State {
  username: string,
  isLoggedIn: boolean
}
export default class App extends Component<Props, State> {
  notificationHandler = new NotificationHandler();
  
  state = {
    username: '',
    isLoggedIn: false
  };

  render() {
    const isLoggedIn = this.state.isLoggedIn;
    return (
      <View>
        {
          isLoggedIn
            ? <Chat username={this.state.username}/>
            : <Login onSetName={newName => this.setState(state => ({...state, username: newName, isLoggedIn: true}))} />
        }
      </View>
    );
  }
}