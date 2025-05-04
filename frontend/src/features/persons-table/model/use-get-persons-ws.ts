import { useState, useRef, useEffect } from 'react'

interface Person {
  id: string
  color: [number, number, number]
  bbox: [number, number, number, number]
  conf: number
}

interface DataEntry {
  id: string
  ts: number
  persons: Person[]
}

type WebSocketStatus = 'connected' | 'disconnected' | 'error'

export const useWebSocket = () => {
  const [data, setData] = useState<DataEntry[]>([])
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host = window.location.hostname
      const port = '8000'
      const wsUrl = `${proto}://${host}:${port}/ws`
      console.log('🔗 Connecting to WS at', wsUrl)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🟢 WS Connected')
        setStatus('connected')
        ws.send('ping')
      }

      ws.onclose = () => {
        console.log('🔴 WS Disconnected')
        setStatus('disconnected')
        setTimeout(connectWebSocket, 2000)
      }

      ws.onerror = (error) => {
        console.error('⚠️ WS Error:', error)
        setStatus('error')
      }

      ws.onmessage = (e) => {
        try {
          const entry = JSON.parse(e.data) as DataEntry
          console.log('📨 Received data:', entry)
          setData((prevData) => [entry, ...prevData])
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }
    }

    connectWebSocket()

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return { data, status }
}
