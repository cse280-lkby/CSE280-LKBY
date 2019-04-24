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
import {Platform, StyleSheet, Text, View} from 'react-native';
import Chat from './Chat';
import NotificationHandler from './NotificationHandler';

interface Props {}
interface State {}
export default class App extends Component<Props, State> {
  state = {};
  notificationHandler = new NotificationHandler();
  render() {
    return (
      <Chat />
      // <View style={styles.container}>
      //   <Text style={styles.welcome}>Chat app!</Text>
      //   <Text style={styles.instructions}>Socket connected?: {this.state.connected ? 'yes' : 'no'}</Text>
      //   <Text style={styles.instructions}>{instructions}</Text>
      // </View>
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