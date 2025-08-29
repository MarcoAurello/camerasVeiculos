import { useEffect, useState, useRef } from "react";
import carrImg from "./carr.gif";

function App() {
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const wsRef = useRef(null);

  const atualizarListas = (data) => {
    setEntradas(data.filter(ev => ev.entrada));
    setSaidas(data.filter(ev => ev.saida));
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/api/movimentacao/placas-hoje`)
      .then(res => {
        if (!res.ok) throw new Error("Erro na API");
        return res.json();
      })
      .then(atualizarListas)
      .catch(err => console.error("Erro fetch placas-hoje:", err));

    wsRef.current = new WebSocket(import.meta.env.VITE_WS_URL || "ws://localhost:3001");

    wsRef.current.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.entrada) {
          setEntradas(prev => [event, ...prev.filter(ev => ev.placa !== event.placa)]);
        }
        if (event.saida) {
          setSaidas(prev => [event, ...prev.filter(ev => ev.placa !== event.placa)]);
        }
      } catch (err) {
        console.error("Erro processando mensagem WS:", err);
      }
    };

    wsRef.current.onerror = (e) => console.error("WS error:", e);

    return () => {
      try { wsRef.current?.close(); } catch {}
    };
  }, []);

  const formatarHora = (dateString) => new Date(dateString).toLocaleTimeString();

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Frota Senac</h1>
      <div style={styles.containerColunas}>
        {/* Coluna Entradas */}
        <div style={styles.coluna}>
          <h2 style={styles.subtitle}>Entradas</h2>
          <ul style={styles.list}>
            {entradas.map((ev, idx) => (
              <li key={idx} style={{ ...styles.item, borderLeft: "6px solid #4CAF50" }}>
                <div style={styles.left}>
                  <img src={carrImg} alt="Carro" style={styles.carImg} />
                  <strong>{ev.placa}</strong>
                </div>
                <span style={styles.time}>{formatarHora(ev.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna Saídas */}
        <div style={styles.coluna}>
          <h2 style={styles.subtitle}>Saídas</h2>
          <ul style={styles.list}>
            {saidas.map((ev, idx) => (
              <li key={idx} style={{ ...styles.item, borderLeft: "6px solid #F44336" }}>
                <div style={styles.left}>
                  <img src={carrImg} alt="Carro" style={styles.carImg} />
                  <strong>{ev.placa}</strong>
                </div>
                <span style={styles.time}>{formatarHora(ev.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#004A8D",
    color: "#FDC180",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Orbitron','Segoe UI',Tahoma,Verdana,sans-serif",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: 30,
    letterSpacing: 2,
    color: "#F7941D",
  },
  containerColunas: {
    display: "flex",
    gap: 20,
    width: "100%",
    maxWidth: 1200,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  coluna: {
    flex: 1,
  },
  subtitle: {
    fontSize: "1.5rem",
    margin: "20px 0 10px",
    color: "#FDC180",
    textAlign: "center",
  },
  list: {
    listStyle: "none",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 15,
    overflowY: "auto",
    maxHeight: "60vh",
    paddingRight: 5,
  },
  item: {
    background: "linear-gradient(90deg, #01060bff 0%, #010a12ff 100%)",
    borderLeft: "6px solid #F7941D",
    padding: "15px 25px",
    borderRadius: 12,
    boxShadow: "0 0 15px rgba(247,148,30,0.6)",
    fontSize: "1.2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: { display: "flex", alignItems: "center", gap: 10 },
  carImg: { width: 104, height: 60 },
  time: { fontSize: "0.9rem", color: "#FDC180" },
};

export default App;
