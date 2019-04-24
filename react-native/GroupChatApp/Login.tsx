import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import App from './App'

interface Props { }
interface State { 
    username: string
}
export default class Login extends Component<Props, State> {
    state = {
        username: ''
    }

    constructor(props: Props) {
        super(props)
    }

    handleChangeUsername (text: string) {
        this.setState({ username: text })
    }

    render() {
        const { username } = this.state
        return (  
            <View style={styles.container}>
                /*Input to get the value from the user*/
                <TextInput
                    onChangeText={this.handleChangeUsername}
                    value={username}
                    
                    placeholder={'Enter your username'}
                    style={styles.input}
                />
                /*Button to go to the next activity*/
                <Button
                    title="Next"
                    onPress={<App isLoggedIn={ true }/>} //How do I pass this info?
                />
        </View>
        );
      }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
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
    },
  });