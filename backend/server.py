import os
import time
import asyncio
from threading import Thread
from collections import deque
import random
import colorsys

import torch
import cv2
from ultralytics import YOLO
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from utils.generate_random_color import generate_random_color
 
# ——— Configuration ———
CAMERA_INDEX = 0            # default webcam index
BUFFER_SIZE  = 100         # keep last 100 frames
PORT         = 8000
# Always use 0.0.0.0 for development to ensure WebSocket works
HOST         = "0.0.0.0"

print(f"🚀 Starting server on {HOST}:{PORT}")

# ——— FastAPI Setup ———
app = FastAPI()

frame_buffer = deque(maxlen=BUFFER_SIZE)
clients = set()

# Load YOLOv8 on GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🔧 Using device: {device}")
model = YOLO("yolov8n.pt").to(device)

# Dictionary to store track IDs and their colors
track_colors = {}



# CORS: allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug endpoints
@app.get("/")
async def root():
    return {
        "status": "Server is running",
        "websocket_endpoint": "/ws",
        "clients_connected": len(clients),
    }

@app.get("/debug")
async def debug_info(request: Request):
    client_host = request.client.host
    return {
        "server_host": HOST,
        "server_port": PORT,
        "client_host": client_host,
        "active_clients": len(clients),
        "buffer_size": len(frame_buffer),
        "cors_origins": app.user_middleware[0].options.allow_origins,
        "websocket_url": f"ws://{HOST}:{PORT}/ws"
    }

# ——— WebSocket endpoint ———
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    print(f"⏳ WebSocket connection attempt from {ws.client.host}")
    try:
        await ws.accept()
        clients.add(ws)
        print(f"🟢 WS connection opened from {ws.client.host}. Total clients: {len(clients)}")

        # send existing buffer
        buffer_size = len(frame_buffer)
        print(f"📤 Sending {buffer_size} buffered frames to {ws.client.host}")
        for entry in frame_buffer:
            await ws.send_json(entry)
        print(f"✅ Sent {buffer_size} frames successfully")
 
        # Keep connection alive
        while True:
            try:
                msg = await ws.receive_text()
                print(f"📥 Received message from {ws.client.host}: {msg}")
                await ws.send_json({"status": "ok", "message_received": msg})
            except WebSocketDisconnect:
                print(f"⚠️ WebSocket disconnected normally from {ws.client.host}")
                break
            except Exception as e:
                print(f"⚠️ Error handling message from {ws.client.host}: {str(e)}")
                break

    except Exception as e:
        print(f"❌ WebSocket error with {ws.client.host}: {str(e)}")
    finally:
        if ws in clients:
            clients.remove(ws)
        print(f"🔴 WS connection closed for {ws.client.host}. Remaining clients: {len(clients)}")

async def broadcast(entry: dict):
    if not clients:
        return  # No clients connected, skip broadcast
        
    print(f"🔊 Broadcasting to {len(clients)} clients")
    dead = set()
    for ws in clients:
        try:
            await ws.send_json(entry)
        except Exception as e:
            print(f"⚠️ Failed to send to client {ws.client.host}: {str(e)}")
            dead.add(ws)
    
    # Remove dead connections
    for ws in dead:
        clients.remove(ws)
        print(f"❌ Removed dead client. Remaining: {len(clients)}")

# ——— Inference & Tracking Loop ———
async def inference_loop():
    print("🎥 Starting inference loop...")
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("Cannot open webcam")

    print("📸 Webcam opened successfully")
    counter = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("⚠️ Failed to read frame")
                break

            # YOLOv8 tracking with ByteTrack
            results = model.track(
                frame,
                persist=True,  # Enable tracking persistence
                tracker="bytetrack.yaml",  # Use ByteTrack tracker
                classes=[0],  # Only track person class (COCO class 0)
                verbose=False
            )[0]

            # Process tracking results
            persons = []
            if results.boxes.id is not None:  # Check if tracking IDs are available
                for box, track_id in zip(results.boxes.data.tolist(), results.boxes.id.tolist()):
                    # Unpack the box data correctly
                    x1, y1, x2, y2, conf, cls = box[:6]  # Take only first 6 values
                    track_id = int(track_id)
                    
                    # Generate or retrieve color for this track ID
                    if track_id not in track_colors:
                        track_colors[track_id] = generate_random_color()
                    
                    persons.append({
                        "id": track_id,
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "conf": float(conf),
                        "color": track_colors[track_id]
                    })

            entry = {"id": counter, "ts": time.time(), "persons": persons}
            counter += 1

            # buffer and broadcast
            frame_buffer.append(entry)
            await broadcast(entry)

            # limit to ~10 FPS
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"⚠️ Inference loop error: {str(e)}")
        print("Debug info:", results.boxes.data.tolist() if 'results' in locals() else "No results available")
    finally:
        cap.release()
        print("�� Camera released")

@app.on_event("startup")
async def startup_event():
    print("🔄 Starting inference task...")
    asyncio.create_task(inference_loop())

if __name__ == "__main__":
    import uvicorn
    print("🌐 Starting uvicorn server...")
    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=True,
        ws_ping_interval=None,
        ws_ping_timeout=None,
        log_level="debug"  # Change to debug level for more information
    )
