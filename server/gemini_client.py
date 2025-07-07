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
"""Gemini API Direct Connection Client"""

import ssl
import traceback
import websockets
import certifi
import os


class GeminiClient:
    """
    Handles connection and authentication with Gemini API Direct service
    """

    def __init__(self):
        self.host = "generativelanguage.googleapis.com"
        self.service_url = f"wss://{self.host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"
        self.active_connections = set()
        self.api_key = None

    def get_api_key(self):
        """Retrieves the API key from environment or file."""
        try:
            # Try to get from environment variable first
            api_key = os.getenv("GEMINI_API_KEY")

            if not api_key:
                raise ValueError(
                    "API key not found. Please set GEMINI_API_KEY environment variable"
                )

            self.api_key = api_key
            return api_key

        except Exception as e:
            print(f"Error getting API key: {e}")
            print(f"Full traceback:\n{traceback.format_exc()}")
            raise

    async def connect_to_gemini(self, api_key: str):
        """
        Establishes a WebSocket connection to Gemini API Direct service
        """
        try:
            # Construct the URL with API key
            url_with_key = f"{self.service_url}?key={api_key}"

            print(f"Connecting to {self.host}...")

            connection = await websockets.connect(
                url_with_key,
                ssl=ssl.create_default_context(cafile=certifi.where()),
            )

            print("Connected to Gemini API")
            self.active_connections.add(connection)
            return connection

        except Exception as e:
            print(f"Error connecting to Gemini: {e}")
            print(f"Full traceback: {traceback.format_exc()}")
            raise

    async def authenticate_and_connect(self):
        """
        Complete authentication flow and establish connection
        """
        try:
            # Get API key
            api_key = self.get_api_key()
            print("Retrieved API key for Gemini connection")

            # Connect to Gemini
            connection = await self.connect_to_gemini(api_key)
            return connection, api_key

        except Exception as e:
            print(f"Error in authentication and connection: {e}")
            print(f"Full traceback: {traceback.format_exc()}")
            raise

    def add_connection(self, connection):
        """Add a connection to the active connections set"""
        self.active_connections.add(connection)

    def remove_connection(self, connection):
        """Remove a connection from the active connections set"""
        if connection in self.active_connections:
            self.active_connections.remove(connection)

    async def cleanup_connection(self, connection):
        """Clean up a specific connection"""
        self.remove_connection(connection)
        try:
            await connection.close()
        except Exception:
            pass

    async def cleanup_all_connections(self):
        """Clean up all active connections"""
        for conn in list(self.active_connections):
            try:
                await conn.close()
            except Exception:
                pass
        self.active_connections.clear()
        print("All Gemini connections cleaned up.")

    async def ping_connections(self):
        """
        Ping all active connections to check if they're still alive
        Returns list of stale connections
        """
        stale_connections = []
        for conn in list(self.active_connections):
            try:
                await conn.ping()
            except Exception:
                print("Found stale Gemini connection")
                stale_connections.append(conn)
                self.remove_connection(conn)
                try:
                    await conn.close()
                except Exception:
                    pass
        return stale_connections
