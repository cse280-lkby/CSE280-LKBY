import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import App from './App'
import { genericTypeAnnotation } from '@babel/types';

interface Props {
    onSetName(newName: string): void
}
interface State { 
    username: string
}
export default class Login extends Component<Props, State> {
    state = {
        username: ''
    }

    constructor(props: Props) {
        super(props)
        console.warn("Starting Login!");
    }

    handleChangeUsername (text: string) {
        this.setState(state => ({...state, username: text}))
    }

    render() {
        return (  
            <View style={styles.container}>
                <TextInput
                    value={this.state.username}
                    placeholder={'Enter your username'}
                    style={styles.input}
                    onChangeText={(username) => this.setState({username})}
                />
                <Button
                    color="#841584"
                    title="Next"
                    onPress={() => this.props.onSetName(this.state.username)}
                />
            </View>
        );
      }
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      alignItems: 'center',
      padding: 16,
    },
    input: {
      width: 200,
      height: 44,
      padding: 10,
      marginBottom: 10,
      backgroundColor: '#DBDBD6',
    }
  });