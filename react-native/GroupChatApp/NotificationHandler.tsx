import firebase from 'react-native-firebase';
import { Clipboard } from 'react-native';

export default class NotificationHandler {
    fcmToken: string | null = null;
    hasPermission: boolean = false;
    constructor() {
        // Get current firebase token
        firebase.messaging().getToken()
            .then(token => {
                if (token) {
                    this.fcmToken = token;
                    console.warn('Got fcm token:', token);
                    Clipboard.setString(token);
                } else {
                    console.error('No fcm token yet.');
                }
            });
        
        // Setup cloud message permissions
        firebase.messaging().hasPermission()
            .then(hasPermission => {
                if (hasPermission) {
                    this.hasPermission = true;
                    console.warn('User previously granted fcm permissions');
                } else {
                    firebase.messaging().requestPermission()
                        .then(() => {
                            this.hasPermission = true;
                            console.warn('User just granted fcm permissions');
                        })
                        .catch(() => {
                            console.warn('User rejected fcm permissions');
                        });
                }
            });
    }
}
