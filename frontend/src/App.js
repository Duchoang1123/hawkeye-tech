import { useState, useEffect, useRef, useMemo } from "react";
import Chart from "chart.js/auto";
import { format } from "date-fns";
export default function App() {
  const [view, setView] = useState("table");   // "table" or "histogram"
  const [data, setData] = useState([]);        // [{ ts, persons: [...] }, ...]
  const [wsStatus, setWsStatus] = useState("disconnected"); // "connected", "disconnected", "error"
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const wsRef = useRef(null);

  // WebSocket setup with reconnection
  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.hostname;
      const port = "8000";
      const wsUrl = `${proto}://${host}:${port}/ws`;
      console.log("🔗 Connecting to WS at", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 WS Connected");
        setWsStatus("connected");
        ws.send("ping"); // Initial ping
      };

      ws.onclose = () => {
        console.log("🔴 WS Disconnected");
        setWsStatus("disconnected");
        // Attempt to reconnect after 2 seconds
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (error) => {
        console.error("⚠️ WS Error:", error);
        setWsStatus("error");
      };

      ws.onmessage = (e) => {
        try {
          const entry = JSON.parse(e.data);
          console.log("📨 Received data:", entry);
          setData(prevData => [entry, ...prevData]);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };
    };

    connectWebSocket();

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Histogram of person counts
  useEffect(() => {
    if (view !== "histogram" || !canvasRef.current) return;

    const counts = data.map(e => e.persons?.length ?? 0);
    const ctx = canvasRef.current.getContext("2d");

    if (chartRef.current) {
      chartRef.current.data.labels = counts.map((_, i) => i);
      chartRef.current.data.datasets[0].data = counts;
      chartRef.current.update();
    } else {
      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: counts.map((_, i) => i),
          datasets: [{ label: "Persons per frame", data: counts }],
        },
        options: { animation: false },
      });
    }
  }, [data, view]);

  // Clean up chart on unmount
  useEffect(() => {
    return () => chartRef.current?.destroy();
  }, []);

  const totalPersons = useMemo(() => {
    if (data.length === 0) return 0;
    const personsSet = new Set(); 
    const dataArray = data[2]?.persons;

    console.log(dataArray);
    
    dataArray?.forEach(p => personsSet.add(p?.id));
    return personsSet.size;
  }, [data]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Real-Time Person Detection</h2>
      <div style={{ marginBottom: 10 }}>
        <span style={{
          display: "inline-block",
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: wsStatus === "connected" ? "#4CAF50" : wsStatus === "error" ? "#f44336" : "#ff9800",
          color: "white",
          marginRight: 10
        }}>
          {wsStatus === "connected" ? "Connected" : wsStatus === "error" ? "Error" : "Disconnected"}
        </span>
      </div>
      <div>
        <label>
          <input
            type="radio"
            name="view"
            value="table"
            checked={view === "table"}
            onChange={() => setView("table")}
          />
          Table
        </label>
        <label style={{ marginLeft: 10 }}>
          <input
            type="radio"
            name="view"
            value="histogram"
            checked={view === "histogram"}
            onChange={() => setView("histogram")}
          />
          Histogram
        </label>
      </div>

      <div style={{ padding: '2px 0', position: 'sticky', top: 0, right: 0, width: '100%', backgroundColor: 'white', border: '1px solid black' }}>
        <p>
          Persons: {totalPersons}
        </p>
      </div>

      <div>
        {view === "table" ? (
          <table border="1" cellPadding="4" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Time</th>
                <th>Person ID</th>
                <th>Coordinates</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {data.flatMap((entry, index) =>
                (entry.persons || []).map((p) => (
                  <tr key={`${entry.ts}-${p.id}-${p.conf}`}>
                    <td>{entry.id}</td>
                    <td>{format(entry.ts * 1000, "HH:mm:ss.SSS")}</td>
                    <td>{p.id}</td>
                    <td>[{p.bbox.join(", ")}]</td>
                    <td>{p.conf.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            style={{ display: "block", margin: "auto" }}
          />
        )}
      </div>
    </div>
  );
}