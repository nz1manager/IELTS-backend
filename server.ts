import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Asl o'yin serverining URL manzili
const GAME_SERVER_URL = 'wss://crash-gateway-grm-cr.gamedev-tech.cc/websocket/lifecycle';
const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Server is running");
});

const wss = new WebSocketServer({ server });

function connectToGameServer() {
    console.log('Asl serverga ulanishga harakat qilinmoqda...');

    const gameSocket = new WebSocket(GAME_SERVER_URL, {
        headers: {
            'Host': 'crash-gateway-grm-cr.gamedev-tech.cc',
            'Origin': 'https://1play.gamedev-tech.cc',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
            'Cookie': '__cf_bm=2lmYUvVFqkI9F27D4L1rsZyz9PysegOeV708I9ovlDo-1774719149-1.0.1.1-Uzd1bx7x8rLMh68zQJ__RPXhZXI57s8FJSLLlC4NdW..AKrNUohFju8mgp55gQ08vGUXuPqTZ7lZsL.GLUQcphU46Raw.sDatATE2t4mZFU',
            'sentry-trace': '34709a31bc034f1495fc2c59cbb851b9-88cae5d6e27418ae'
        }
    });

    gameSocket.on('open', () => {
        console.log('Asl o\'yin serveriga ulandi ✅');

        // Lucky Jet kanaliga obuna bo'lish so'rovi
        const subscribeMessage = {
            action: "subscribe",
            channel: "lucky-jet-94"
        };

        gameSocket.send(JSON.stringify(subscribeMessage));
        console.log('Lucky Jet kanaliga obuna yuborildi 🚀');
    });

    gameSocket.on('message', (data) => {
        const message = data.toString();
        
        // Agar xabarda koeffitsient bo'lsa, logda ko'ramiz (tekshirish uchun)
        if (message.includes('changeCoefficient')) {
            console.log('Ma’lumot kelmoqda...');
        }

        // Kelgan ma'lumotni barcha Telegram foydalanuvchilariga yuborish
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    gameSocket.on('close', () => {
        console.log('Ulanish uzildi. 2 soniyadan so\'ng qayta ulanish...');
        setTimeout(connectToGameServer, 2000);
    });

    gameSocket.on('error', (error) => {
        console.error('Serverda xato:', error.message);
    });
}

wss.on('connection', (ws) => {
    console.log('Yangi foydalanuvchi ulandi ✅');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend ${PORT}-portda tayyor.`);
    connectToGameServer();
});
