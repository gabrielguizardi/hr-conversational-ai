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
"""Vertex AI Gemini Multimodal Live WebSockets Server"""

import asyncio
import os
from proxy import WebSocketProxy
from dotenv import load_dotenv

load_dotenv()


async def main() -> None:
    """
    Starts the WebSocket server using the proxy logic.
    """
    print("DEBUG: server.py - Starting server...")

    # Get the port from the environment variable, defaulting to 3001
    port = int(os.environ.get("PORT", 3001))
    host = "0.0.0.0"

    # Create and start the proxy server
    proxy = WebSocketProxy(host=host, port=port)
    await proxy.start_server()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except Exception as e:
        print(f"Server error: {e}")
        import traceback

        print(f"Full traceback: {traceback.format_exc()}")
