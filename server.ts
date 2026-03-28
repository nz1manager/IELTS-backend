import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Asl o'yin serverining URL manzili
const GAME_SERVER_URL = 'wss://crash-gateway-grm-cr.gamedev-tech.cc/websocket/lifecycle';

// Render uchun PORT sozlamasi
const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Server is running");
});

const wss = new WebSocketServer({ server });

let gameSocket: WebSocket | null = null;

function connectToGameServer() {
    console.log('Asl serverga ulanishga harakat qilinmoqda...');

    gameSocket = new WebSocket(GAME_SERVER_URL, {
        headers: {
            'Origin': 'https://1play.gamedev-tech.cc',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0',
            'Cookie': '__cf_bm=2lmYUvVFqkI9F27D4L1rsZyz9PysegOeV708I9ovlDo-1774719149-1.0.1.1-Uzd1bx7x8rLMh68zQJ__RPXhZXI57s8FJSLLlC4NdW..AKrNUohFju8mgp55gQ08vGUXuPqTZ7lZsL.GLUQcphU46Raw.sDatATE2t4mZFU'
        }
    });

    gameSocket.on('open', () => {
        console.log('Asl o\'yin serveriga ulandi ✅');

        // Lucky Jet kanaliga obuna bo'lish xabari
        const subscribeMessage = {
            action: "subscribe",
            channel: "lucky-jet-94"
        };

        if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
            gameSocket.send(JSON.stringify(subscribeMessage));
            console.log('Lucky Jet kanaliga obuna bo\'lish so\'rovi yuborildi 🚀');
        }
    });

    gameSocket.on('message', (data) => {
        const message = data.toString();
        
        // Asl serverdan kelgan har bir millisekundlik xabarni Telegram foydalanuvchilariga uzatish
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    gameSocket.on('close', () => {
        console.log('Asl server bilan ulanish uzildi. 2 soniyadan so\'ng qayta ulanish...');
        setTimeout(connectToGameServer, 2000);
    });

    gameSocket.on('error', (error) => {
        console.error('Asl serverda xato:', error.message);
    });
}

wss.on('connection', (ws) => {
    console.log('Yangi Telegram foydalanuvchisi ulandi.');
    
    ws.on('close', () => {
        console.log('Foydalanuvchi ulanishni uzdi.');
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server ${PORT}-portda ishlamoqda.`);
    connectToGameServer();
});
