import { Component } from "react";
import { View, Text } from "react-native";
import React from "react";
import { RTCView } from 'react-native-webrtc';

export interface Peer {
    id: string;
    streamUrl: string | null;
    userdata: UserData | null;
}

export interface UserData {
    username: string | null;
}

interface Props {
    peer: Peer;
}

export default class PeerView extends Component<Props> {
    render() {
        const {peer} = this.props;
        console.warn(peer);
        const {userdata, streamUrl} = peer;
        const username = userdata && userdata.username || 'N/A';
        return (
            <View style={{marginBottom: 20}}>
                <Text>{username}</Text>
                <RTCView streamUrl={streamUrl} />
            </View>
        );
    }
}

