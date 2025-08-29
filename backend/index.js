const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const AxiosDigestAuth = require("@mhoc/axios-digest-auth").default;
const axios = require("axios");
require("dotenv").config();

const { initDB, MovimentacaoVeiculo } = require("./models");

const PORT = process.env.PORT || 3001;
const CAMERA_PROTOCOL = process.env.CAMERA_PROTOCOL || "http";
const CAMERA_IP = process.env.CAMERA_IP;
const CAMERA_IP_SAIDA = process.env.CAMERA_IP_SAIDA;
const CAMERA_USER = process.env.CAMERA_USER;
const CAMERA_PASS = process.env.CAMERA_PASS;
const ALERT_STREAM_PATH = process.env.ALERT_STREAM_PATH || "/ISAPI/Event/notification/alertStream";

const app = express();
app.use(cors());
app.use(express.json()); // <— IMPORTANTE para body JSON
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

// Histórico em memória (para a página)
const placasHistorico = [];
const MAX_PLACAS = 50;

// Rotas de API
const movimentacaoRoutes = require("./routes/movimentacaoRoutes");
app.use("/api/movimentacao", movimentacaoRoutes);

// Histórico
app.get("/historico", (req, res) => res.json(placasHistorico));

function broadcast(event) {
  placasHistorico.push(event);
  if (placasHistorico.length > MAX_PLACAS) placasHistorico.shift();

  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(event));
  });
}

function extractPlate(xml) {
  const tags = ["plateNumber", "licensePlate", "carPlate", "plate", "license"];
  for (const t of tags) {
    const regex = new RegExp(`<${t}>(.*?)</${t}>`, "i");
    const match = xml.match(regex);
    if (match) return match[1];
  }
  return null;
}

async function connectStream() {
  const digestAuth = new AxiosDigestAuth({
    username: CAMERA_USER,
    password: CAMERA_PASS,
  });

  while (true) {
    try {
      const res = await digestAuth.request({
        method: "GET",
        url: `${CAMERA_PROTOCOL}://${CAMERA_IP}${ALERT_STREAM_PATH}`,
        responseType: "stream",
        timeout: 0,
      });

      console.log("Conectado ao alertStream, aguardando eventos...");
      let buffer = "";
      res.data.on("data", (chunk) => {
        buffer += chunk.toString();
        const endTag = "</EventNotificationAlert>";
        let idx;
        while ((idx = buffer.indexOf(endTag)) !== -1) {
          const xml = buffer.slice(0, idx + endTag.length);
          buffer = buffer.slice(idx + endTag.length);

          const plate = extractPlate(xml);
          if (plate) {
            const event = {
              placa: plate,
              entrada: true,
              saida: false,
              createdAt: new Date().toISOString(),
            };

            console.log("📷 Placa detectada (entrada):", event);
            broadcast(event);

            // Salvar no banco
            MovimentacaoVeiculo.create(event)
              .then(() => console.log("✅ Movimentação salva no SQL Server."))
              .catch(err => console.error("❌ Erro ao salvar movimentação:", err.message));
          }
        }
      });

      res.data.on("end", () => console.log("Conexão encerrada, tentando novamente..."));
      res.data.on("error", () => console.log("Erro, reconectando..."));

      await new Promise((r) => {
        res.data.once("end", r);
        res.data.once("error", r);
        res.data.once("close", r);
      });
    } catch (err) {
      console.error("Erro de conexão:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function connectStreamSaida() {
  const digestAuth = new AxiosDigestAuth({
    username: CAMERA_USER,
    password: CAMERA_PASS,
  });

  while (true) {
    try {
      const res = await digestAuth.request({
        method: "GET",
        url: `${CAMERA_PROTOCOL}://${CAMERA_IP_SAIDA}${ALERT_STREAM_PATH}`,
        responseType: "stream",
        timeout: 0,
      });

      console.log("Conectado ao alertStream Saida, aguardando eventos...");
      let buffer = "";
      res.data.on("data", (chunk) => {
        buffer += chunk.toString();
        const endTag = "</EventNotificationAlert>";
        let idx;
        while ((idx = buffer.indexOf(endTag)) !== -1) {
          const xml = buffer.slice(0, idx + endTag.length);
          buffer = buffer.slice(idx + endTag.length);

          const plate = extractPlate(xml);
          if (plate) {
            const event = {
              placa: plate,
              entrada: false,
              saida: true,
              createdAt: new Date().toISOString(),
            };

            console.log("📷 Placa detectada (saída):", event);
            broadcast(event);

            // Salvar no banco
            MovimentacaoVeiculo.create(event)
              .then(() => console.log("✅ Movimentação de saída salva no SQL Server."))
              .catch(err => console.error("❌ Erro ao salvar movimentação:", err.message));
          }

        }
      });

      res.data.on("end", () => console.log("Conexão encerrada, tentando novamente..."));
      res.data.on("error", () => console.log("Erro, reconectando..."));

      await new Promise((r) => {
        res.data.once("end", r);
        res.data.once("error", r);
        res.data.once("close", r);
      });
    } catch (err) {
      console.error("Erro de conexão:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

(async () => {
  await initDB();      // conecta no banco
  connectStream();     // conecta na câmera
  connectStreamSaida()
  server.listen(PORT, () => console.log(`Servidor http://localhost:${PORT}`));
})();
