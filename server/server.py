"""Vertex AI Gemini Multimodal Live WebSockets Server"""

import asyncio
import os
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

from proxy import handle_client, active_client_connections, cleanup_connections
from gemini_client import GeminiClient

load_dotenv()

app = FastAPI()
gemini_client = GeminiClient()


@app.get("/health_check")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for handling client connections.
    """
    await websocket.accept()
    active_client_connections.add(websocket)
    try:
        await handle_client(websocket, gemini_client)
    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        if websocket in active_client_connections:
            active_client_connections.remove(websocket)


async def main() -> None:
    """
    Starts the FastAPI server using uvicorn.
    """
    print("DEBUG: server.py - Starting server...")

    # Get the port from the environment variable, defaulting to 3001
    port = int(os.environ.get("PORT", 3001))
    host = "0.0.0.0"

    # Start the cleanup task as a background task
    asyncio.create_task(cleanup_connections(gemini_client))

    # Create and run the uvicorn server
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except Exception as e:
        print(f"Server error: {e}")
        import traceback

        print(f"Full traceback: {traceback.format_exc()}")
