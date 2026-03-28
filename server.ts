import { WebSocketServer, WebSocket } from 'ws'; // Named importlardan foydalanamiz
import http from 'http';

// Asl o'yin serverining URL manzili
const GAME_SERVER_URL = 'wss://crash-gateway-grm-cr.gamedev-tech.cc/websocket/lifecycle';

// Render uchun PORT sozlamasi (0.0.0.0 manzili bilan)
const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Server is running");
});

// TUZATILGAN QATOR: WebSocketServer klassidan foydalanamiz
const wss = new WebSocketServer({ server });

let gameSocket: WebSocket | null = null;

function connectToGameServer() {
    gameSocket = new WebSocket(GAME_SERVER_URL, {
        headers: {
            'Origin': 'https://1play.gamedev-tech.cc',
        }
    });

  gameSocket.on('open', () => {
        console.log('Asl o\'yin serveriga ulandi.');

        // O'yin serveriga aynan Lucky Jet ma'lumotlarini so'rab xabar yuboramiz
        const subscribeMessage = {
            action: "subscribe",
            channel: "lucky-jet-94"
        };

        if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
            gameSocket.send(JSON.stringify(subscribeMessage));
            console.log('Lucky Jet kanaliga obuna bo\'lish so\'rovi yuborildi ✅');
        }
    });

    gameSocket.on('message', (data) => {
        const message = data.toString();
        
        // Ulangan barcha mijozlarga ma'lumotni tarqatamiz
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    gameSocket.on('close', () => {
        console.log('Asl server bilan ulanish uzildi. Qayta ulanish...');
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

    ws.on('error', (err) => {
        console.error('Mijoz ulanishida xato:', err.message);
    });
});

// Renderda muvaffaqiyatli ishlashi uchun 0.0.0.0 hostini ko'rsatish tavsiya etiladi
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server ${PORT}-portda ishlamoqda.`);
    connectToGameServer();
});
