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
import {Platform, StyleSheet, Text, View, Button, TextInput} from 'react-native';
import Login from './Login'
import Chat from './Chat'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

interface Props {}
interface State {
  username: string,
  isLoggedIn: boolean
}
export default class App extends Component<Props, State> {
  state = {
    username: '',
    isLoggedIn: false
  };

  setTrueIsLoggedIn () {
    this.setState({ isLoggedIn: true })
  }

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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});