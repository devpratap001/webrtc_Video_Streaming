const socket = io();
const myVideo = document.querySelector(".outgoing");
const remoteVideo = document.querySelector(".incoming");
const message = document.querySelector(".message");

const mediaDevices = navigator.mediaDevices;
var videoStreams;
mediaDevices.getUserMedia({ audio: true, video: true }).then(str => {
    videoStreams = str;
    myVideo.srcObject = videoStreams
})

const configuration = {
    iceServers: [
        {url:'stun:stunserver.org'}
    ],
}

document.querySelector(".call").addEventListener("click", () => {
    const peer = new RTCPeerConnection(configuration);
    const dc = peer.createDataChannel("channel");

    dc.onopen = () => console.log("connection open!");
    dc.onmessage = (e) => console.log(e.data);

    peer.onicecandidateerror = (e) => console.log(e)

    videoStreams.getTracks().forEach(element => {
        peer.addTrack(element, videoStreams);
    });
    peer.ontrack = e => {
        remoteVideo.srcObject = e.streams[0]
    }
    peer.createOffer().then(o => {
        peer.setLocalDescription(o)
        return o
    }).then(o => socket.emit("local-offer", o)).then(console.log("created offer"))

    peer.onicecandidate= e => {
        socket.emit("send-ice-candidate", e.candidate)
    }
    socket.on("send-ice-candidate-remote-server", data => {
        peer.addIceCandidate(data)
    })

    socket.on("local-answer-server", answer => {
        peer.setRemoteDescription(answer)
        console.log("accepted answer")
    })
    message.addEventListener("click", () => {
        dc.send("hii user")
    })
})

socket.on("local-offer-server", offer => {
    const offerObj = offer;
    var remoteDC;
    document.querySelector(".answer").addEventListener("click", () => {
        const remotePeer = new RTCPeerConnection(configuration);

        remotePeer.addEventListener("datachannel", e => {
            console.log("datachannel received")
            remoteDC = e.channel;
            remoteDC.onopen = () => console.log("connection open!")
            remoteDC.onmessage = e => console.log(e.data)
        })
        remotePeer.onicecandidateerror = e => console.log(e)

        videoStreams.getTracks().forEach(element => {
            remotePeer.addTrack(element, videoStreams);
        });

        remotePeer.ontrack = e => {
            remoteVideo.srcObject = e.streams[0]
        }
        remotePeer.setRemoteDescription(offerObj).then(() => {
            console.log("accepted offer")

            remotePeer.createAnswer().then(a => {
                remotePeer.setLocalDescription(a)
                return a
            }).then(a => {
                socket.emit("local-answer", a)
            }).then(console.log("created answer"))

            remotePeer.onicecandidate= e => {
                socket.emit("send-ice-candidate-remote", e.candidate)
            }
            socket.on("send-ice-candidate-server", data => {
                remotePeer.addIceCandidate(data)
            })

            message.addEventListener("click", () => {
                remoteDC.send("hii user")
            })
        })
    })
})