import WebSocket, { WebSocketServer } from "ws";


const ws = new WebSocketServer({
    port: 3001
});

const sockets: WebSocket[] = [];

ws.on("connection", (socket) => {
    sockets.push(socket);
    socket.on("message", (msg) => {
        console.log("i received the msg: ", JSON.parse(msg.toString()));
        socket.send(JSON.stringify({
            msg: "hey i received your msg",
        }))
    })
});
