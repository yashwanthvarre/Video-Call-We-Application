"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Box, VStack } from "@chakra-ui/react";

const socket = io.connect("http://localhost:3001");

export default function VideoCall() {
  const [myStream, setMyStream] = useState(null);
  const myVideo = useRef();

  useEffect(() => {
    const peerConnections = {}; // Track peer connections

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        myVideo.current.srcObject = stream;

        socket.emit("join-room", "roomId", socket.id);

        socket.on("user-connected", (userId) => {
          const peerConnection = createPeerConnection(userId);
          peerConnections[userId] = peerConnection;

          // Create an offer and send it to the new user
          peerConnection.createOffer().then((offer) => {
            peerConnection.setLocalDescription(offer);
            socket.emit("offer", "roomId", offer, userId);
          });
        });

        socket.on("all-users", (users) => {
          users.forEach((userId) => {
            const peerConnection = createPeerConnection(userId);
            peerConnections[userId] = peerConnection;

            peerConnection.createOffer().then((offer) => {
              peerConnection.setLocalDescription(offer);
              socket.emit("offer", "roomId", offer, userId);
            });
          });
        });

        socket.on("offer", (offer, userId) => {
          const peerConnection = createPeerConnection(userId);
          peerConnections[userId] = peerConnection;

          peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          peerConnection.createAnswer().then((answer) => {
            peerConnection.setLocalDescription(answer);
            socket.emit("answer", "roomId", answer, userId);
          });
        });

        socket.on("answer", (answer, userId) => {
          const peerConnection = peerConnections[userId];
          peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        });

        socket.on("ice-candidate", (candidate, userId) => {
          const peerConnection = peerConnections[userId];
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("user-disconnected", (userId) => {
          if (peerConnections[userId]) {
            peerConnections[userId].close();
            delete peerConnections[userId];
            const videoElement = document.getElementById(userId);
            if (videoElement) videoElement.remove();
          }
        });

        function createPeerConnection(userId) {
          const peerConnection = new RTCPeerConnection();
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("ice-candidate", "roomId", event.candidate, userId);
            }
          };

          peerConnection.ontrack = (event) => {
            const videoElement = document.createElement("video");
            videoElement.srcObject = event.streams[0];
            videoElement.id = userId; // Set unique ID for easy removal
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            document.getElementById("video-grid").appendChild(videoElement);
          };

          // Add tracks to the connection
          myStream
            .getTracks()
            .forEach((track) => peerConnection.addTrack(track, myStream));
          return peerConnection;
        }
      });

    return () => {
      Object.values(peerConnections).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, []);

  return (
    <VStack>
      <Box id="video-grid" display="flex" flexWrap="wrap"></Box>
      <video
        ref={myVideo}
        autoPlay
        playsInline
        muted
        style={{ width: "300px" }}
      />
    </VStack>
  );
}
