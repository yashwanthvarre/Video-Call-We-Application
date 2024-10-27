"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3001");

export default function VideoCall() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [myStream, setMyStream] = useState(null);
  const myVideo = useRef();
  const peerVideo = useRef();
  const peerConnection = useRef(null);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection();

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        myVideo.current.srcObject = stream;
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
      });

    peerConnection.current.ontrack = (event) => {
      peerVideo.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", phoneNumber, event.candidate);
      }
    };

    socket.on("offer", async (offer) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", phoneNumber, answer);
    });

    socket.on("answer", async (answer) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", async (candidate) => {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });
  }, [phoneNumber]);

  const startCall = async () => {
    if (phoneNumber) {
      socket.emit("join-room", phoneNumber, socket.id);
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("offer", phoneNumber, offer);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        justifyContent: "center",
        background: "#f0f0f5",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number to call"
          style={{
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            transition: "border-color 0.3s",
          }}
        />
        <button
          onClick={startCall}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            border: "none",
            backgroundColor: "#0070f3",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.3s, transform 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#005bb5")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#0070f3")
          }
        >
          Call
        </button>
      </div>
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <video
          ref={myVideo}
          autoPlay
          muted
          style={{
            width: "300px",
            height: "200px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "box-shadow 0.3s, transform 0.2s",
          }}
        />
        <video
          ref={peerVideo}
          autoPlay
          style={{
            width: "300px",
            height: "200px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "box-shadow 0.3s, transform 0.2s",
          }}
        />
      </div>
    </div>
  );
}
