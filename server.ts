import { WebSocket } from 'ws';
import admin from 'firebase-admin';

// Firebase Admin sozlamalari
const serviceAccount = {
  projectId: "fastfast-1",
  clientEmail: "firebase-adminsdk-fbsvc@fastfast-1.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCz3Vsraya3V6P1\nDAEsquf3eXTqkuhKt5GiY2hF38YTseCRx839SWNmi1D6B1ZSmMMilJcWCYEenisV\nrgR0R1WY4PNCWyZcWshbRcC9R90rKmKfhwqhy2AsTfZtg0oVqVwf253/s8CPzmtc\nqjOK0llDe8+Y3xpXYl0bGBg/sRsISo7rALyY2DxykqcSyUTwl9zB+OqJDB/ud+Uj\n+9G3OFCH1zyu+TFUG2z/NzGSQg66N5TCpxIBGCpV5mmMbcZjmYhupa+QYN67Ke6G\n0kVO2h0UhrPwlFACbHNpWawzxCFVfwEVamJk+S0/6CmhFORe+CsnUvyIos03knUE\nlKJb636LAgMBAAECggEAC66OS9EfSBwklXdMojqNa1jTm6Kj/KpUhp//Nz6T7laI\nt98qxU8dah0VSs/sLtwmHFpbP76pSLRMJxHQzz6M1CuUERS7dpcc2TS8Em8W8cVE\nd4j9S0naurXrkexLhQGlbppEdkWV9aEZ/wA87cDAtG3Xq12eJ9vHIUnc1VIq58xX\n4/IHIqGDnLkeXh5aBUcqEvhaNdKzH5SeFzjpBSf26oSWQ2J0oYtSweqP1g7TTuI5\n6qy2g6iwVOodDVOKeKrRGm5QpqkMA729M1Evj0owcFLxu8hLNM9BItP62dZZBw8+\nyyKjDsKauB1SSlWsGzVZorv3udQDzn6nw1GOe1ckcQKBgQDq72g6NukkeaAX64TW\nywNvxDyMUDoVZXb+SaosYEO9hkTR7qHtdvRu19RP6b4aDaibSYQ04NzWBIaBGCio\n7J2/Lngc3AqI1Wnc/CTfhTXTHT8e0hjBrPDVtY4JoGtH/15wi1ODmgROkoNrEpW8\naDPr4boZfHC/UTzbTrFt/n5xMQKBgQDD/eLXchqAozq5x93oWacb8KEFpn9JhLgH\nIRuISVV19T4MkZD4vrFGMO4JtN18tKVMt61sLzmtDZivcSMOWzXHMOBfy2udoZAE\nfLseIN1Z5zLE+sGA2wiQrSSEH71bSBjvbDPJoOgXMujDv+gcF8IAS/dYKLBgkO7j\n5hptmPXcewKBgAk0qFjfnfMX8PX+/I2OFuxiPB0jZ6M+/pKoQErM2tqqUDgJqb6s\nUpelTWR0PEa5EkpDbzLDPOQF+V9FmxJDc0ryfzJiTOdftW47UxaPGbTUCI0knmO4\naxd0rcQizRFdKE4wp20Ys+KASzX+3G8thhtQFQK6pZBZlpDhXIJ63mmBAoGAKFSg\nT1FNntb4CK7WPS/lsVws5mrCmrBS5jSr47mjemiC4jc6K9WhyR3cfebYBQdvVIAf\nkbmOFsxLdR7E5fli8aBfK5dCh+dtKV85ahO9OPjYe6xWEVwBQTQ/5WhaoOQPLYWI\nip8v40Y4m79r1gwVgdYgCeYllVl9ryv0mET3ou0CgYEAmwiwbzd/UCdCgDzFUyuT\nabqWSoVBtjcS3nxB3VFWaeegJnUUyFUsbZT4mt/2X/RoM11Dp8/MyMhjbkVTs40g\njbAwnBCNGV9Yu2oQjdioTAyDrsnSLGDv1hkJ2yGbMdxWqzWK6Q3GTM0J54lmjQrH\nRC0uhFvTSnLZzVfyafJeZL0=\n-----END PRIVATE KEY-----\n" as string,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fastfast-1-default-rtdb.firebaseio.com"
});

const db = admin.database();
const liveRef = db.ref('liveData');

const GAME_SERVER_URL = 'wss://crash-gateway-grm-cr.gamedev-tech.cc/websocket/lifecycle';

function connectToGameServer() {
    console.log("O'yin serveriga ulanish... 🚀");
    
    const gameSocket = new WebSocket(GAME_SERVER_URL, {
        headers: {
            'Origin': 'https://1play.gamedev-tech.cc',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    gameSocket.on('open', () => {
        const connectMsg = {
            id: 1,
            connect: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzUxNTExMjgsImlhdCI6MTc3NDg5MTkyOCwic3ViIjoiMTk5MDQwMTEiLCJjaGFubmVscyI6WyJsdWNreS1qZXQtOTQiXX0.n09wLw2RCHCSYzYYacnO-GyllrdU0kALLtyKKc7oHaE",
                name: "js"
            }
        };
        gameSocket.send(JSON.stringify(connectMsg));
        console.log("Ulandi va Avtorizatsiya yuborildi ✅");
    });

    gameSocket.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.push?.pub?.data) {
            const d = msg.push.pub.data;
            let update = null;

            // 1. Waiting -> STARTING
            if (d.eventType === "changeState" && d.state === "waiting") {
                update = { state: 'waiting', coeff: 0 };
            } 
            // 2. Flying -> 1.00 dan boshlash
            else if (d.eventType === "changeState" && d.state === "flying") {
                update = { state: 'flying', coeff: 1.00 };
            }
            // 3. Koeffitsient o'zgarishi
            else if (d.eventType === "changeCoefficient") {
                update = { state: 'flying', coeff: d.next[0] };
            }
            // 4. To'xtash -> Qizil rang
            else if (d.eventType === "stopCoefficient") {
                update = { state: 'stop', coeff: d.finalValue };
            }

            if (update) {
                liveRef.update(update).catch(() => {});
            }
        }
    });

    gameSocket.on('close', () => {
        console.log("Aloqa uzildi, 2 soniyada qayta ulanish...");
        setTimeout(connectToGameServer, 2000);
    });

    gameSocket.on('error', (e) => console.error("Xato:", e.message));
}

connectToGameServer();
