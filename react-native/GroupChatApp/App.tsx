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
import SocketIOClient from 'socket.io-client';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

const SIGNALING_SERVER = "http://ec2-54-164-202-125.compute-1.amazonaws.com:8080";
const USE_AUDIO = true;
const USE_VIDEO = false;
const DEFAULT_CHANNEL = 'main_support_channel';
const MUTE_AUDIO_BY_DEFAULT = false;

const ICE_SERVERS = [
    {urls:"stun:stun.l.google.com:19302"}
];

let signaling_socket = null;   /* our socket.io connection to our webserver */
let local_media_stream = null; /* our own microphone / webcam */
const peers = {};                /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
const peer_media_elements = {};  /* keep track of our <video>/<audio> tags, indexed by peer_id */



interface Props {}
interface State {
  connected: boolean;
}
export default class App extends Component<Props, State> {
  signaling_socket: SocketIOClient.Socket;
  state = {
    connected: false,
  };
  constructor(props: Props) {
    super(props);

    console.warn('Connecting?? :(');
    this.signaling_socket = SocketIOClient(SIGNALING_SERVER);
    this.signaling_socket.on('connect', () => {
      console.warn("Connected!");
      this.setState(state => ({
        ...state,
        connected: true
      }));
    });
    
    this.signaling_socket.on('disconnect', () => {
      console.warn("Disconnected!");
      this.setState(state => ({
        ...state,
        connected: false
      }));
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Chat app!</Text>
        <Text style={styles.instructions}>Socket connected?: {this.state.connected ? 'yes' : 'no'}</Text>
        <Text style={styles.instructions}>{instructions}</Text>
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