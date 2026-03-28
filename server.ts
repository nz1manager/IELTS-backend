import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const GAME_SERVER_URL = 'wss://crash-gateway-grm-cr.gamedev-tech.cc/websocket/lifecycle';
const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Server is running");
});

const wss = new WebSocketServer({ server });

function connectToGameServer() {
    console.log('Asl serverga ulanish harakati...');

    const gameSocket = new WebSocket(GAME_SERVER_URL, {
        headers: {
            'Host': 'crash-gateway-grm-cr.gamedev-tech.cc',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0',
            'Origin': 'https://1play.gamedev-tech.cc'
        }
    });

    gameSocket.on('open', () => {
        console.log('Asl o\'yin serveriga ulandi ✅');

        // 1-QADAM: Avtorizatsiyadan o'tish (Siz yuborgan token bilan)
        const authMessage = {
            id: 1,
            method: 1,
            params: {
                name: "js",
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzQ5NzkzOTQsImlhdCI6MTc3NDcyMDE5NCwic3ViIjoiMTk5MDQwMTEiLCJjaGFubmVscyI6WyJsdWNreS1qZXQtOTQiXX0.whMWpJSdwKoOHDMNw_79RiEKe1j16P_OcB5Y7RUj2uI"
            }
        };

        gameSocket.send(JSON.stringify(authMessage));
        console.log('Avtorizatsiya so\'rovi yuborildi 🔑');

        // 2-QADAM: Lucky Jet kanaliga obuna bo'lish
        const subscribeMessage = {
            action: "subscribe",
            channel: "lucky-jet-94"
        };

        // Avtorizatsiyadan so'ng ozgina kutib yuboramiz
        setTimeout(() => {
            if (gameSocket.readyState === WebSocket.OPEN) {
                gameSocket.send(JSON.stringify(subscribeMessage));
                console.log('Lucky Jet kanaliga obuna yuborildi 🚀');
            }
        }, 500);
    });

    gameSocket.on('message', (data) => {
        const message = data.toString();
        
        // Logda ma'lumot kelayotganini tekshirish
        if (message.includes('changeCoefficient')) {
            console.log('🚀 Koeffitsient o\'zgarmoqda!');
        }

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    gameSocket.on('close', (code) => {
        console.log(`Ulanish yopildi (Kod: ${code}). 3 soniyadan so'ng qayta ulanish...`);
        setTimeout(connectToGameServer, 3000);
    });

    gameSocket.on('error', (err) => {
        console.error('Xato:', err.message);
    });
}

wss.on('connection', (ws) => {
    console.log('Telegram foydalanuvchisi ulandi ✅');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend ${PORT}-portda tayyor.`);
    connectToGameServer();
});
