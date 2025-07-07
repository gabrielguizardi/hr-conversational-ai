# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Vertex AI Gemini Multimodal Live WebSockets Proxy Logic"""

import asyncio
import json
import traceback
import websockets
from websockets.legacy.protocol import WebSocketCommonProtocol
from websockets.legacy.server import WebSocketServerProtocol
from gemini_client import GeminiClient


DEBUG = True

# Track active client connections
active_client_connections = set()


async def proxy_task(
    source_websocket: WebSocketCommonProtocol,
    target_websocket: WebSocketCommonProtocol,
    name: str = "",
    gemini_client: GeminiClient = None,
) -> None:
    """
    Forwards messages from one WebSocket connection to another.
    """
    try:
        async for message in source_websocket:
            try:
                data = json.loads(message)

                # Intercept setup messages from client and apply backend configuration
                if "setup" in data and name == "Client->Server":
                    print(
                        f"{name} intercepting setup message - applying backend configuration"
                    )
                    # Apply backend setup configuration
                    backend_setup = {
                        "setup": {
                            "model": "models/gemini-2.5-flash-preview-native-audio-dialog",
                            "generation_config": {
                                "response_modalities": ["audio"],
                                "speech_config": {
                                    "voice_config": {
                                        "prebuilt_voice_config": {
                                            "voice_name": "Aoede",
                                        },
                                    },
                                },
                            },
                        }
                    }
                    print(
                        f"Sending backend setup: {json.dumps(backend_setup, indent=2)}"
                    )
                    await target_websocket.send(json.dumps(backend_setup))
                    continue

                # Log message type for debugging
                if "setup" in data:
                    print(f"{name} forwarding setup message")
                    print(f"Setup message content: {json.dumps(data, indent=2)}")
                elif "realtime_input" in data:
                    print(f"{name} forwarding audio/video input")
                elif "serverContent" in data:
                    has_audio = "inlineData" in str(data)
                    print(
                        f"{name} forwarding server content"
                        + (" with audio" if has_audio else "")
                    )
                else:
                    print(f"{name} forwarding message type: {list(data.keys())}")
                    print(f"Message content: {json.dumps(data, indent=2)}")

                # Forward the message
                try:
                    await target_websocket.send(json.dumps(data))
                except Exception as e:
                    print(f"\n{name} Error sending message:")
                    print("=" * 80)
                    print(f"Error details: {str(e)}")
                    print("=" * 80)
                    print(f"Message that failed: {json.dumps(data, indent=2)}")
                    raise

            except websockets.exceptions.ConnectionClosed as e:
                print(f"\n{name} connection closed during message processing:")
                print("=" * 80)
                print(f"Close code: {e.code}")
                print("Close reason (full):")
                print("-" * 40)
                print(e.reason)
                print("=" * 80)
                break
            except Exception as e:
                print(f"\n{name} Error processing message:")
                print("=" * 80)
                print(f"Error details: {str(e)}")
                print(f"Full traceback:\n{traceback.format_exc()}")
                print("=" * 80)

    except websockets.exceptions.ConnectionClosed as e:
        print(f"\n{name} connection closed:")
        print("=" * 80)
        print(f"Close code: {e.code}")
        print("Close reason (full):")
        print("-" * 40)
        print(e.reason)
        print("=" * 80)
    except Exception as e:
        print(f"\n{name} Error:")
        print("=" * 80)
        print(f"Error details: {str(e)}")
        print(f"Full traceback:\n{traceback.format_exc()}")
        print("=" * 80)
    finally:
        # Clean up connections when done
        print(f"{name} cleaning up connection")
        if gemini_client and target_websocket:
            await gemini_client.cleanup_connection(target_websocket)


async def create_proxy(
    client_websocket: WebSocketCommonProtocol, gemini_client: GeminiClient
) -> None:
    """
    Establishes a WebSocket connection to the server and creates two tasks for
    bidirectional message forwarding between the client and the server.
    """
    try:
        # Authenticate and connect to Gemini
        server_websocket, bearer_token = await gemini_client.authenticate_and_connect()

        # Create bidirectional proxy tasks
        client_to_server = asyncio.create_task(
            proxy_task(
                client_websocket, server_websocket, "Client->Server", gemini_client
            )
        )
        server_to_client = asyncio.create_task(
            proxy_task(
                server_websocket, client_websocket, "Server->Client", gemini_client
            )
        )

        try:
            # Wait for both tasks to complete
            await asyncio.gather(client_to_server, server_to_client)
        except Exception as e:
            print(f"Error during proxy operation: {e}")
            print(f"Full traceback: {traceback.format_exc()}")
        finally:
            # Clean up tasks
            for task in [client_to_server, server_to_client]:
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass

    except Exception as e:
        print(f"Error creating proxy connection: {e}")
        print(f"Full traceback: {traceback.format_exc()}")


async def handle_client(
    client_websocket: WebSocketServerProtocol, gemini_client: GeminiClient
) -> None:
    """
    Handles a new client connection.
    """
    print("New connection...")
    try:
        # Send auth complete message to client
        await client_websocket.send(json.dumps({"authComplete": True}))
        print("Sent auth complete message")

        print("Creating proxy connection")
        await create_proxy(client_websocket, gemini_client)

    except asyncio.TimeoutError:
        print("Timeout in handle_client")
        await client_websocket.close(code=1008, reason="Auth timeout")
    except Exception as e:
        print(f"Error in handle_client: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        await client_websocket.close(code=1011, reason=str(e))


async def cleanup_connections(gemini_client: GeminiClient) -> None:
    """
    Periodically clean up stale connections
    """
    while True:
        print(f"Active client connections: {len(active_client_connections)}")

        # Clean up client connections
        for conn in list(active_client_connections):
            try:
                await conn.ping()
            except Exception:
                print("Found stale client connection, removing...")
                active_client_connections.remove(conn)
                try:
                    await conn.close()
                except Exception:
                    pass

        # Clean up Gemini connections
        stale_gemini_connections = await gemini_client.ping_connections()
        if stale_gemini_connections:
            print(
                f"Cleaned up {len(stale_gemini_connections)} stale Gemini connections"
            )

        await asyncio.sleep(30)  # Check every 30 seconds


class WebSocketProxy:
    """
    WebSocket Proxy class that encapsulates all proxy logic
    """

    def __init__(self, host: str = "0.0.0.0", port: int = 3001):
        self.host = host
        self.port = port
        self.cleanup_task = None
        self.gemini_client = GeminiClient()

    async def handle_client_wrapper(self, client_websocket: WebSocketServerProtocol):
        """
        Wrapper to pass gemini_client to handle_client
        """
        active_client_connections.add(client_websocket)
        try:
            await handle_client(client_websocket, self.gemini_client)
        finally:
            if client_websocket in active_client_connections:
                active_client_connections.remove(client_websocket)

    async def start_server(self):
        """
        Starts the WebSocket proxy server.
        """
        print("DEBUG: WebSocketProxy - Starting server...")

        # Start the cleanup task
        self.cleanup_task = asyncio.create_task(cleanup_connections(self.gemini_client))

        async with websockets.serve(
            self.handle_client_wrapper,
            self.host,
            self.port,
            ping_interval=30,  # Send ping every 30 seconds
            ping_timeout=10,  # Wait 10 seconds for pong
        ):
            print(f"Running websocket proxy server on {self.host}:{self.port}...")
            try:
                await asyncio.Future()  # run forever
            finally:
                await self.cleanup()

    async def cleanup(self):
        """
        Clean up resources when shutting down
        """
        if self.cleanup_task:
            self.cleanup_task.cancel()

        # Close all client connections
        for conn in list(active_client_connections):
            try:
                await conn.close()
            except Exception:
                pass
        active_client_connections.clear()

        # Clean up Gemini connections
        await self.gemini_client.cleanup_all_connections()

        print("WebSocket proxy server stopped and cleaned up.")
