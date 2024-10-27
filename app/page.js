"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  Box,
  Button,
  Flex,
  Input,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

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

  const inputBorderColor = useColorModeValue("gray.300", "gray.600");

  return (
    <Flex
      direction="column"
      align="center"
      minH="100vh"
      justify="center"
      bg={useColorModeValue("gray.50", "gray.800")}
      p="20px"
    >
      <VStack spacing="4" mb="6">
        <Input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number to call"
          size="md"
          borderColor={inputBorderColor}
          borderRadius="md"
          focusBorderColor="blue.400"
        />
        <Button
          onClick={startCall}
          bg="blue.500"
          color="white"
          _hover={{ bg: "blue.600" }}
          _active={{ transform: "scale(0.98)" }}
        >
          Call
        </Button>
      </VStack>
      <Flex gap="6" mt="6">
        <Box
          as="video"
          ref={myVideo}
          autoPlay
          muted
          w="300px"
          h="200px"
          borderRadius="md"
          boxShadow="md"
        />
        <Box
          as="video"
          ref={peerVideo}
          autoPlay
          w="300px"
          h="200px"
          borderRadius="md"
          boxShadow="md"
        />
      </Flex>
    </Flex>
  );
}
