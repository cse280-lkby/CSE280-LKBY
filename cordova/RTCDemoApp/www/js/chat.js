/** CONFIG **/
const SIGNALING_SERVER = "http://ec2-54-164-202-125.compute-1.amazonaws.com:8080";
const USE_AUDIO = true;
const USE_VIDEO = false;
const DEFAULT_CHANNEL = 'some-global-channel-name';
const MUTE_AUDIO_BY_DEFAULT = false;

/** You should probably use a different stun server doing commercial stuff **/
/** Also see: https://gist.github.com/zziuni/3741933 **/
const ICE_SERVERS = [
    {urls:"stun:stun.l.google.com:19302"}
];

let signaling_socket = null;   /* our socket.io connection to our webserver */
let local_media_stream = null; /* our own microphone / webcam */
const peers = {};                /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
const peer_media_elements = {};  /* keep track of our <video>/<audio> tags, indexed by peer_id */

function setupChat() {
    alert("Setting up");
    console.log("Connecting to signaling server");
    signaling_socket = io(SIGNALING_SERVER, {
        rejectUnauthorized: false,
        transports: ['websocket']
    });

    signaling_socket.on('connect', function() {
        alert("Connected to signaling server");
        setup_local_media(function() {
            /* once the user has given us access to their
             * microphone/camcorder, join the channel and start peering up */
            join_chat_channel(DEFAULT_CHANNEL, {'whatever-you-want-here': 'stuff'});
        });
    });

    signaling_socket.on('disconnect', function() {
        alert("Disconnected from signaling server");
        /* Tear down all of our peer connections and remove all the
         * media divs when we disconnect */
        for (peer_id in peer_media_elements) {
            peer_media_elements[peer_id].remove();
        }
        for (peer_id in peers) {
            peers[peer_id].close();
        }

        peers = {};
        peer_media_elements = {};
    });

    signaling_socket.on('connect_error', function(error) {
        alert('Socket error: ' + error);
    })

    function join_chat_channel(channel, userdata) {
        signaling_socket.emit('join', {"channel": channel, "userdata": userdata});
    }
    function part_chat_channel(channel) {
        signaling_socket.emit('part', channel);
    }


    /** 
    * When we join a group, our signaling server will send out 'addPeer' events to each pair
    * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
    * in the channel you will connect directly to the other 5, so there will be a total of 15 
    * connections in the network). 
    */
    signaling_socket.on('addPeer', function(config) {
        console.log('Signaling server said to add peer:', config);
        const {peer_id} = config;
        if (peer_id in peers) {
            /* This could happen if the user joins multiple channels where the other peer is also in. */
            console.log("Already connected to peer ", peer_id);
            return;
        }
        const peer_connection = new RTCPeerConnection(
            {"iceServers": ICE_SERVERS},
            {"optional": [{"DtlsSrtpKeyAgreement": true}]} /* this will no longer be needed by chrome
                                                            * eventually (supposedly), but is necessary 
                                                            * for now to get firefox to talk to chrome */
        );
        peers[peer_id] = peer_connection;

        peer_connection.onicecandidate = function(event) {
            if (event.candidate) {
                signaling_socket.emit('relayICECandidate', {
                    'peer_id': peer_id, 
                    'ice_candidate': {
                        'sdpMLineIndex': event.candidate.sdpMLineIndex,
                        'candidate': event.candidate.candidate
                    }
                });
            }
        }
        peer_connection.onaddstream = function(event) {
            console.log("onAddStream", event);
            const remote_media = USE_VIDEO ? $("<video>") : $("<audio>");
            remote_media.attr("autoplay", "autoplay");
            if (MUTE_AUDIO_BY_DEFAULT) {
                remote_media.attr("muted", "true");
            }
            remote_media.attr("controls", "");
            peer_media_elements[peer_id] = remote_media;
            $('#media').append(remote_media);
            remote_media[0].srcObject = event.stream;
        }

        /* Add our local stream */
        peer_connection.addStream(local_media_stream);

        /* Only one side of the peer connection should create the
         * offer, the signaling server picks one to be the offerer. 
         * The other user will get a 'sessionDescription' event and will
         * create an offer, then send back an answer 'sessionDescription' to us
         */
        if (config.should_create_offer) {
            console.log("Creating RTC offer to ", peer_id);
            peer_connection.createOffer(
                function (local_description) { 
                    console.log("Local offer description is: ", local_description);
                    peer_connection.setLocalDescription(local_description,
                        function() { 
                            signaling_socket.emit('relaySessionDescription', 
                                {'peer_id': peer_id, 'session_description': local_description});
                            console.log("Offer setLocalDescription succeeded"); 
                        },
                        function() { alert("Offer setLocalDescription failed!"); }
                    );
                },
                function (error) {
                    console.log("Error sending offer: ", error);
                });
        }
    });


    /** 
     * Peers exchange session descriptions which contains information
     * about their audio / video settings and that sort of stuff. First
     * the 'offerer' sends a description to the 'answerer' (with type
     * "offer"), then the answerer sends one back (with type "answer").  
     */
    signaling_socket.on('sessionDescription', function(config) {
        console.log('Remote description received: ', config);
        const {peer_id} = config;
        const peer = peers[peer_id];
        const remote_description = config.session_description;
        console.log(config.session_description);

        const desc = new RTCSessionDescription(remote_description);
        peer.setRemoteDescription(desc, 
            function() {
                console.log("setRemoteDescription succeeded");
                if (remote_description.type === "offer") {
                    console.log("Creating answer");
                    peer.createAnswer(
                        function(local_description) {
                            console.log("Answer description is: ", local_description);
                            peer.setLocalDescription(local_description,
                                function() { 
                                    signaling_socket.emit('relaySessionDescription', 
                                        {peer_id, session_description: local_description});
                                    console.log("Answer setLocalDescription succeeded");
                                },
                                function() { alert("Answer setLocalDescription failed!"); }
                            );
                        },
                        function(error) {
                            console.log("Error creating answer: ", error);
                            console.log(peer);
                        });
                }
            },
            function(error) {
                console.log("setRemoteDescription error: ", error);
            }
        );
        console.log("Description Object: ", desc);
    });

    /**
     * The offerer will send a number of ICE Candidate blobs to the answerer so they 
     * can begin trying to find the best path to one another on the net.
     */
    signaling_socket.on('iceCandidate', function(config) {
        const peer = peers[config.peer_id];
        const {ice_candidate} = config;
        peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
    });


    /**
     * When a user leaves a channel (or is disconnected from the
     * signaling server) everyone will recieve a 'removePeer' message
     * telling them to trash the media channels they have open for those
     * that peer. If it was this client that left a channel, they'll also
     * receive the removePeers. If this client was disconnected, they
     * wont receive removePeers, but rather the
     * signaling_socket.on('disconnect') code will kick in and tear down
     * all the peer sessions.
     */
    signaling_socket.on('removePeer', function(config) {
        console.log('Signaling server said to remove peer:', config);
        const peer_id = config.peer_id;
        if (peer_id in peer_media_elements) {
            peer_media_elements[peer_id].remove();
        }
        if (peer_id in peers) {
            peers[peer_id].close();
        }

        delete peers[peer_id];
        delete peer_media_elements[config.peer_id];
    });
}

/***********************/
/** Local media stuff **/
/***********************/
function setup_local_media(callback, errorback, permissionGranted) {
    if (local_media_stream != null) {  /* ie, if we've already been initialized */
        if (callback) callback();
        return; 
    }
    /* Ask user for permission to use the computers microphone and/or camera, 
     * attach it to an <audio> or <video> tag if they give us access. */
    console.log("Requesting access to local audio / video inputs");

    if (device.platform === 'Android' && !permissionGranted) {
      const permissions = cordova.plugins.permissions;
      permissions.requestPermissions(
        [
          permissions.RECORD_AUDIO,
          permissions.MODIFY_AUDIO_SETTINGS
        ],
        status => {
          alert('Permission callback status: ' + status.hasPermission);
          setup_local_media(callback, errorback, true);
        },
        () => alert('Audio permissions denied or error occurred.'));
      return;
    }

    navigator.mediaDevices.getUserMedia({"audio":USE_AUDIO, "video":USE_VIDEO})
        .then(stream => {
            console.log("Access granted to audio/video");
            local_media_stream = stream;
            const local_media = USE_VIDEO ? $("<video>") : $("<audio>");
            local_media.attr("autoplay", "autoplay");
            local_media.prop("muted", true); /* always mute ourselves by default */
            local_media.attr("controls", "");
            $('#media').append(local_media);
            local_media[0].srcObject = stream;

            if (device.platform === 'Android') {
              alert('Stream is live')
            }
            if (callback) callback();
        })
        .catch(e => { /* user denied access to a/v */
            console.log("Access denied for audio/video: ", e);
            alert("You chose not to provide access to the camera/microphone, demo will not work.\n" + e);
            if (errorback) errorback();
        });
}