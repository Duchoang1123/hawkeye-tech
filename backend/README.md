# Real-Time Person Detection Server

This is the backend server for real-time person detection using YOLOv8 and WebSocket communication.

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
```

2. Activate the virtual environment:

```bash
source venv/Scripts/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

1. Make sure your virtual environment is activated

2. Run the server:
   - Local development (localhost only):
   ```bash
   python server.py
   ```
   - Network development (accessible from other devices):
   ```bash
   HOST=0.0.0.0 python server.py
   ```

The server will start on `http://localhost:8000` (or `http://0.0.0.0:8000`) with WebSocket endpoint at `/ws`

## Configuration

You can modify these variables in `server.py` or through environment variables:
- `CAMERA_INDEX`: webcam index (default: 0)
- `BUFFER_SIZE`: number of frames to keep in memory (default: 100)
- `PORT`: server port (default: 8000)
- `HOST`: server host (default: "localhost", use "0.0.0.0" for network access)

## Security Note

- Using `localhost` (default) is more secure as it only allows connections from your machine
- Using `0.0.0.0` allows connections from any device on your network
- Use `0.0.0.0` only during development when you need to:
  - Test from other devices (phones, tablets)
  - Allow other developers to access your server
  - Run in a container or cloud environment

## Troubleshooting

1. If the webcam doesn't open:
   - Check if your webcam is connected
   - Try a different `CAMERA_INDEX` (0, 1, 2, etc.)

2. If you see CUDA/GPU errors:
   - The server will automatically fall back to CPU if CUDA is not available
   - No action needed unless you specifically want GPU acceleration 