import os
import time
import asyncio
from collections import deque
import numpy as np

import torch
import cv2
from ultralytics import YOLO
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from utils.shared.generate_random_color import generate_random_color

from utils.perspective_transformation import ViewTransformer
import json

# ——— Configuration ———
CAMERA_INDEX = "videos/test.mp4"
BUFFER_SIZE = 60
PORT = 8000
HOST = "0.0.0.0"

# Load calibration data
with open('utils/perspective_transformation/calibration/test.json', 'r') as f:
    calibration_data = json.load(f)

# Initialize view transformer
view_transformer = ViewTransformer(video_name='test.mp4')

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

@app.get("/")
async def root():
    return {"status": "Server is running"}

async def broadcast(entry: dict):
    if not clients:
        return
        
    dead = set()
    for ws in clients:
        try:
            await ws.send_json(entry)
        except Exception:
            dead.add(ws)
    
    for ws in dead:
        clients.discard(ws)

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    try:
        await ws.accept()
        clients.add(ws)
        print(f"🟢 New WebSocket connection. Total clients: {len(clients)}")
        
        # Send existing buffer
        for entry in list(frame_buffer):
            await ws.send_json(entry)
 
        while True:
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
            except Exception:
                break

    except Exception as e:
        print(f"❌ WebSocket error: {str(e)}")
    finally:
        if ws in clients:
            clients.remove(ws)
        print(f"🔴 WebSocket disconnected. Remaining clients: {len(clients)}")

async def inference_loop():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("Cannot open video file")

    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps
    
    print(f"Video properties: {fps} FPS, {frame_count} frames, {duration:.2f} seconds")
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Process frame
            results = model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=[0],
                verbose=False
            )[0]

            # Process people results
            persons = []
            if results.boxes.id is not None:
                for box, track_id in zip(results.boxes.data.tolist(), results.boxes.id.tolist()):
                    x1, y1, x2, y2, conf, cls = box[:6]
                    track_id = int(track_id)
                    
                    if track_id not in track_colors:
                        track_colors[track_id] = generate_random_color()
                    
                    leg_coordinates = np.array([(x1+x2)/2, y2], dtype=np.float32)
                    transformed_leg_coordinates = view_transformer.transform_point(leg_coordinates)
                    if transformed_leg_coordinates is not None:
                        transformed_leg_coordinates = transformed_leg_coordinates.tolist()

                    persons.append({
                        "id": track_id,
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "transformed_leg_coordinates": transformed_leg_coordinates,
                        "leg_coordinates": leg_coordinates.tolist(),
                        "conf": float(conf),
                        "color": track_colors[track_id]
                    })

            entry = {
                "id": int(cap.get(cv2.CAP_PROP_POS_FRAMES)),
                "ts": time.time(),
                "persons": persons
            }
            
            frame_buffer.append(entry)
            await broadcast(entry)

            # Small delay to prevent overwhelming the system
            await asyncio.sleep(0.001)

    except Exception as e:
        print(f"⚠️ Inference loop error: {str(e)}")
    finally:
        cap.release()
        frame_buffer.clear()

@app.on_event("startup")
async def startup_event():
    print("🚀 Starting server...")
    asyncio.create_task(inference_loop())

if __name__ == "__main__":
    import uvicorn
    print(f"🌐 Starting server on {HOST}:{PORT}")
    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=True,
        ws_ping_interval=None,
        ws_ping_timeout=None,
        log_level="info"
    )
