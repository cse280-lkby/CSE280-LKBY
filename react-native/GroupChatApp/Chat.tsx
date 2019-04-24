import SocketIOClient from 'socket.io-client';
import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import {
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCView,
    mediaDevices 
} from 'react-native-webrtc';

const SIGNALING_SERVER = "http://ec2-54-164-202-125.compute-1.amazonaws.com:8080";
const DEFAULT_CHANNEL = 'some-global-channel-name';

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" }
];

interface Props { }
interface State {
    connectedToServer: boolean;
    streamsToRender: Array<any>;
}
export default class Chat extends Component<Props, State> {
    localMediaStream: any;
    peerConnections = {};
    peerStreams = {};
    signaling_socket: SocketIOClient.Socket;
    state = {
        connectedToServer: false,
        streamsToRender: [],
    };
    constructor(props: Props) {
        super(props);
        this.signaling_socket = SocketIOClient(SIGNALING_SERVER, {
            rejectUnauthorized: false,
            transports: ['websocket']
        });

        this.signaling_socket.on('connect', () => {
            console.warn("Connected to signaling server!");
            this.setState(state => ({
                ...state,
                connectedToServer: true
            }));

            this._setupLocalMedia().then(() => {
                this.signaling_socket.emit('join', { "channel": DEFAULT_CHANNEL, "userdata": '' }); //get username data from App
            }); // TODO handle error (probably permission denied)
        });

        this.signaling_socket.on('connect_error', (err: any) => {
            console.error("Connect error! " + err);
        });

        this.signaling_socket.on('disconnect', () => {
            console.warn("Disconnected from signaling server!");
            this.setState(state => ({
                ...state,
                connectedToServer: false,
                streamsToRender: [],
            }));

            for (let peer_id in this.peerConnections) {
                this.peerConnections[peer_id].close();
            }

            this.peerConnections = {};
            this.peerStreams = {};
        });

        this.signaling_socket.on('addPeer', this._onAddPeer);
        this.signaling_socket.on('sessionDescription', this._onSessionDescription);
        this.signaling_socket.on('iceCandidate', this._onIceCandidate);
        this.signaling_socket.on('removePeer', this._onRemovePeer);
    }
    _onAddPeer = (config: any) => {
        console.warn("Adding peer: ", config);
        const { peer_id } = config;
        if (peer_id in this.peerConnections) {
            return;
        }

        const peer_connection = new RTCPeerConnection(
            { iceServers: ICE_SERVERS },
            { optional: [{ DtlsSrtpKeyAgreement: true }] }
        );

        this.peerConnections[peer_id] = peer_connection;

        peer_connection.onicecandidate = (event: any) => {
            if (event.candidate) {
                console.warn('pc.onicecandidate, relaying: ', JSON.stringify(event.candidate));
                this.signaling_socket.emit('relayICECandidate', {
                    'peer_id': peer_id, 
                    'ice_candidate': {
                        'sdpMLineIndex': event.candidate.sdpMLineIndex,
                        'candidate': event.candidate.candidate
                    }
                });
            }
        }
        peer_connection.onaddstream = (event: any) => {
            console.warn("pc.onaddstream, peer_id:", peer_id, "event:", event);
            const {stream} = event;
            this.peerStreams[peer_id] = stream;
            this._updateRenderedStreams();
        }

        /* Add our local stream */
        peer_connection.addStream(this.localMediaStream);

        /* Only one side of the peer connection should create the
         * offer, the signaling server picks one to be the offerer. 
         * The other user will get a 'sessionDescription' event and will
         * create an offer, then send back an answer 'sessionDescription' to us
         */
        if (config.should_create_offer) {
            console.warn("Creating RTC offer to ", peer_id);
            peer_connection.createOffer()
                .then((local_description: any) => { 
                    console.warn("Local offer description is: ", local_description);
                    peer_connection.setLocalDescription(local_description)
                        .then(() => {
                            this.signaling_socket.emit('relaySessionDescription', 
                                {'peer_id': peer_id, 'session_description': local_description});
                            console.warn("Offer setLocalDescription succeeded"); 
                        })
                        .catch(() => {
                            console.error("Offer setLocalDescription failed!");
                        });
                })
                .catch((error: any) => {
                    console.error("Error sending offer: ", error);
                });
        }
    }
    _onIceCandidate = (config: any) => {
        console.warn("SS sent ice candidate for ", config.peer_id);
        const peer = this.peerConnections[config.peer_id];
        const ice_candidate = {...config.ice_candidate, sdpMid: config.ice_candidate.sdpMid || 'video'};
        peer.addIceCandidate(new RTCIceCandidate(ice_candidate))
            .then((result: any) => {
                console.warn('Successfully added ice candidate');
            }).catch((error: any) => {
                console.warn('Failed adding ice candidate!', error, ice_candidate);
            });
    }
    _onRemovePeer = (config: any) => {
        console.warn('SS said to remove peer:', config);
        const peer_id = config.peer_id;
        if (peer_id in this.peerConnections) {
            this.peerConnections[peer_id].close();
        }

        delete this.peerConnections[peer_id];
        delete this.peerStreams[config.peer_id];

        this._updateRenderedStreams();
    }
    _onSessionDescription = (config: any) => {
        console.warn('SS sent remote description for: ', config.peer_id);
        const {peer_id} = config;
        const peer = this.peerConnections[peer_id];
        const remote_description = config.session_description;

        const desc = new RTCSessionDescription(remote_description);
        peer.setRemoteDescription(desc)
            .then(() => {
                console.warn("setRemoteDescription succeeded");
                if (remote_description.type === "offer") {
                    console.warn("Creating answer");
                    peer.createAnswer()
                        .then((local_description: any) => {
                            console.warn("Answer description is: ", local_description);
                            peer.setLocalDescription(local_description)
                                .then(() => { 
                                    this.signaling_socket.emit('relaySessionDescription', 
                                        {peer_id, session_description: local_description});
                                    console.warn("Answer setLocalDescription succeeded");
                                })
                                .catch(() => {
                                    console.error("Answer setLocalDescription failed!"); 
                                });
                        })
                        .catch((error: any) => {
                            console.error("Error creating answer: ", error, peer);
                        });
                }
            })
            .catch((error: any) => {
                console.error("setRemoteDescription error: ", error);
            });
        console.warn("Description Object: ", desc);
    }
    _setupLocalMedia = () => {
        return new Promise((resolve, reject) => {
            console.warn('Requesting access to user media');
            mediaDevices.getUserMedia({audio: true, video: false}).then((stream: any) => {
                console.warn("Access granted to local stream:", stream);
                this.localMediaStream = stream;
                resolve(stream);
            }, (error: any) => {
                console.error("Failed to get user media", error);
                reject();
            });
        });
    }
    _updateRenderedStreams = () => {
        // TODO handle muting
        this.setState((state: State) => {
            return {
                ...state,
                streamsToRender: Object.values(this.peerStreams)
            };
        });
    }
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>Health Group Session</Text>
                <Text style={styles.instructions}>Connection status: {this.state.connectedToServer ? 'Success!' : 'Failed :('}</Text>
                <Text style={styles.instructions}>Number of other people in chat: {this.state.streamsToRender.length}</Text>
                <Text style={styles.instructions}>Members: {this.peerConnections} </Text>
                {this.state.streamsToRender.map(stream => stream.toURL()).map(url => 
                    <RTCView key={url} streamURL={url} />
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
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