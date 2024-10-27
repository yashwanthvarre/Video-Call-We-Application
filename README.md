

Video Calling App with WebRTC

This is a Next.js project bootstrapped with create-next-app.

Getting Started

Run the Signaling Server
First, start the signaling server for WebRTC peer connection:

bash
Copy code
node server.js
Start the Development Server
To run the app in development mode:

bash
Copy code
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
Open http://localhost:3000 in your browser to view the app.

You can start editing by modifying app/page.js. The page auto-updates as you edit the file.

Project Overview

This app uses WebRTC for real-time video streaming and Socket.IO for signaling between peers. Users can enter a "phone number" as a unique room ID to start a call.

Learn More

For more details on the tools used in this project:

Next.js Documentation - learn about Next.js features.
WebRTC Documentation - learn about real-time video communication.
Socket.IO Documentation - understand real-time bidirectional communication.
Deploy on Vercel

The easiest way to deploy this app is on Vercel. Check out Next.js deployment documentation for details.

