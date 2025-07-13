import asyncio
import json
import traceback
import websockets
import os
from websockets.legacy.protocol import WebSocketCommonProtocol
from websockets.legacy.server import WebSocketServerProtocol
from gemini_client import GeminiClient
from pymongo import MongoClient
from bson.objectid import ObjectId


DEBUG = True

# Track active client connections
active_client_connections = set()

# MongoDB connection
mongo_client = MongoClient(os.environ.get("MONGODB_URI"))
mongo_client_db = mongo_client.hr_conversational_ai


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
        iterator = (
            source_websocket.iter_text()
            if hasattr(source_websocket, "iter_text")
            else source_websocket
        )
        async for message in iterator:
            try:
                if isinstance(message, bytes):
                    message = message.decode("utf-8")

                data = json.loads(message)

                if "setup" in data and name == "Client->Server":
                    print(
                        f"{name} intercepting setup message - applying backend configuration"
                    )
                    print(f"Setup data received: {json.dumps(data, indent=2)}")

                    # Get interview questions if job_vacancy_id is provided
                    interview_questions = []
                    question_tags = {}
                    if "job_vacancy_id" in data.get("setup", {}):
                        job_vacancy_id = data["setup"]["job_vacancy_id"]
                        print(f"Job vacancy ID found in setup: {job_vacancy_id}")
                        try:
                            questions = list(mongo_client_db.interview_questions.find({
                                "job_vacancy_id": job_vacancy_id,
                                "active": True
                            }))
                            interview_questions = [q["question"] for q in questions]
                            # Create mapping of questions to tags
                            question_tags = {q["question"]: q.get("tag", "") for q in questions}
                            print(f"Found {len(interview_questions)} interview questions for job vacancy {job_vacancy_id}")
                            print(f"Questions: {interview_questions}")
                            print(f"Question tags: {question_tags}")
                        except Exception as e:
                            print(f"Error fetching interview questions: {e}")
                            print(f"Full traceback: {traceback.format_exc()}")
                    else:
                        print("No job_vacancy_id found in setup data")

                    # Create context with interview questions
                    if interview_questions:
                        context = "Você é um assistente de voz especializado em conduzir pré-entrevistas de emprego. Você é gentil, educado e fala de forma clara e objetiva. Você só fala em português do Brasil.\n\n"
                        context += "IMPORTANTE: Esta é uma pré-entrevista para coletar dados do currículo do candidato. Sua função é:\n"
                        context += "- Fazer perguntas de forma natural e conversacional\n"
                        context += "- Coletar informações básicas do candidato\n"
                        context += "- Ser paciente e atencioso\n"
                        context += "- Fazer uma pergunta por vez e aguardar a resposta completa\n"
                        context += "- Se a resposta não for clara, peça esclarecimentos\n\n"
                        context += "Perguntas que você deve fazer (faça uma por vez, na ordem que achar mais natural):\n"
                        for i, question in enumerate(interview_questions, 1):
                            context += f"{i}. {question}\n"
                        context += "\nApós fazer todas as perguntas, agradeça ao candidato e informe que a pré-entrevista foi concluída."
                    else:
                        context = "Você é um assistente de voz que responde perguntas e ajuda com tarefas. Você é gentil, educado e fala de forma clara e objetiva. Você só fala em português do Brasil."

                    gemini_setup = {
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
                            "system_instruction": {
                                "parts": [
                                    {
                                        "text": "Você é um assistente de voz que fala APENAS em português do Brasil. Nunca responda em outros idiomas. Seja sempre educado, claro e objetivo em suas respostas."
                                    }
                                ]
                            }
                        }
                    }

                    print(f"Sending backend setup: {json.dumps(gemini_setup)}")

                    await target_websocket.send(json.dumps(gemini_setup))
                    
                    # Send context as initial message if there are interview questions
                    if interview_questions:
                        try:
                            context_message = {
                                "client_content": {
                                    "turns": [
                                        {
                                            "role": "user",
                                            "parts": [
                                                {
                                                    "text": context
                                                }
                                            ]
                                        }
                                    ],
                                    "turn_complete": True
                                }
                            }
                            print(f"Sending context message: {json.dumps(context_message)}")
                            await target_websocket.send(json.dumps(context_message))
                        except Exception as e:
                            print(f"Error sending context message: {e}")
                            # Continue without context if there's an error
                    
                    continue

                # Log message type for debugging
                if "setup" in data:
                    print(f"{name} forwarding setup message")
                    print(
                        f"Setup message content: {json.dumps(data, indent=2)}")
                elif "realtime_input" in data:
                    print(f"{name} forwarding audio/video input")
                    if "media_chunks" in data["realtime_input"]:
                        chunks = data["realtime_input"]["media_chunks"]
                        total_size = sum(len(chunk.get("data", "")) for chunk in chunks)
                        print(f"📤 Audio chunks being sent to Gemini - {len(chunks)} chunks, total size: {total_size} bytes")
                elif "serverContent" in data:
                    has_audio = "inlineData" in str(data)
                    print(
                        f"{name} forwarding server content"
                        + (" with audio" if has_audio else "")
                    )
                    if has_audio:
                        audio_data = data.get("serverContent", {}).get("modelTurn", {}).get("parts", [{}])[0].get("inlineData", {}).get("data", "")
                        print(f"🎵 Audio response from Gemini - size: {len(audio_data)} bytes")
                else:
                    print(f"{name} forwarding message type: {list(data.keys())}")
                    print(f"Message content: {json.dumps(data, indent=2)}")

                # Forward the message
                try:
                    # Use send_text for FastAPI compatibility
                    if hasattr(target_websocket, "send_text"):
                        await target_websocket.send_text(json.dumps(data))
                    else:
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
    client_websocket: WebSocketCommonProtocol, gemini_client: GeminiClient
) -> None:
    """
    Handles a new client connection.
    """
    print("New connection...")
    try:
        # Send auth complete message to client
        auth_message = json.dumps({"authComplete": True})
        if hasattr(client_websocket, "send_text"):
            await client_websocket.send_text(auth_message)
        else:
            await client_websocket.send(auth_message)
        print("Sent auth complete message")

        print("Creating proxy connection")
        await create_proxy(client_websocket, gemini_client)

    except asyncio.TimeoutError:
        print("Timeout in handle_client")
        if hasattr(client_websocket, "close"):
            await client_websocket.close(code=1008, reason="Auth timeout")
    except Exception as e:
        print(f"Error in handle_client: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        if hasattr(client_websocket, "close"):
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
                if hasattr(conn, "ping"):
                    await conn.ping()
            except Exception:
                print("Found stale client connection, removing...")
                active_client_connections.remove(conn)
                try:
                    if hasattr(conn, "close"):
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
