import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const GAME_SERVER_URL = 'wss://crash-gateway-grm-cr.gamedev-tech.cc/websocket/lifecycle';
const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("OK");
});

const wss = new WebSocketServer({ server });

function connectToGameServer() {
    const gameSocket = new WebSocket(GAME_SERVER_URL, {
        headers: {
            'Host': 'crash-gateway-grm-cr.gamedev-tech.cc',
            'Origin': 'https://1play.gamedev-tech.cc',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
        }
    });

    gameSocket.on('open', () => {
        console.log('O\'yin serveriga ulandi ✅');
        
        // Siz bergan yangi ulanish paketi
        const connectMsg = {
            id: 1,
            connect: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzUxNTExMjgsImlhdCI6MTc3NDg5MTkyOCwic3ViIjoiMTk5MDQwMTEiLCJjaGFubmVscyI6WyJsdWNreS1qZXQtOTQiXX0.n09wLw2RCHCSYzYYacnO-GyllrdU0kALLtyKKc7oHaE",
                name: "js"
            }
        };
        gameSocket.send(JSON.stringify(connectMsg));
    });

    gameSocket.on('message', (data) => {
        const raw = data.toString();
        // Ma'lumotni hech qanday ishlovsiz barcha mijozlarga tarqatamiz (tezlik uchun)
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(raw);
            }
        });
    });

    gameSocket.on('close', () => setTimeout(connectToGameServer, 2000));
    gameSocket.on('error', (e) => console.error('WS Error:', e.message));
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on ${PORT}`);
    connectToGameServer();
});
