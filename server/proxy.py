import asyncio
import json
import traceback
import websockets
import os
import re
from datetime import datetime
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

def save_response_in_db(interview_id, tag, response, candidate_id=None, job_vacancy_id=None):
    try:
# 1. Defina o FILTRO para encontrar o documento
        # Um documento de resposta é único pela combinação de entrevista, candidato, vaga e a tag da pergunta.
        filter_doc = {
            "interview_id": ObjectId(interview_id) if interview_id else None,
            "candidate_id": ObjectId(candidate_id) if candidate_id else None,
            "job_vacancy_id": ObjectId(job_vacancy_id) if job_vacancy_id else None,
            "tag": tag
        }

        # 2. Defina a ATUALIZAÇÃO usando o operador $set
        # Isso diz ao MongoDB para definir (ou atualizar) estes campos.
        update_doc = {
            "$set": {
                "response": response,
                "answered_at": datetime.utcnow(),
                "interview_id": ObjectId(interview_id) if interview_id else None,
                "candidate_id": ObjectId(candidate_id) if candidate_id else None,
                "job_vacancy_id": ObjectId(job_vacancy_id) if job_vacancy_id else None,
                "tag": tag
            }
        }

        # 3. Execute o comando upsert
        result = mongo_client_db.interview_responses.update_one(
            filter_doc, 
            update_doc, 
            upsert=True
        )
        print(f"✅ Resposta salva: {tag} = {response}")
        return str(result.upserted_id)
    except Exception as e:
        print(f"❌ Erro ao salvar resposta: {e}")
        return None

async def proxy_task(
    source_websocket: WebSocketCommonProtocol,
    target_websocket: WebSocketCommonProtocol,
    name: str = "",
    gemini_client: GeminiClient = None,
    interview_state = None,
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
                    # Get interview questions if job_vacancy_id is provided
                    interview_questions = []
                    question_tags = {}
                    if "job_vacancy_id" in data.get("setup", {}):
                        job_vacancy_id = data["setup"]["job_vacancy_id"]
                        try:
                            questions = list(mongo_client_db.interview_questions.find({
                                "job_vacancy_id": job_vacancy_id,
                                "active": True
                            }))
                            if not questions:
                                try:
                                    from bson.objectid import ObjectId
                                    questions = list(mongo_client_db.interview_questions.find({
                                        "job_vacancy_id": ObjectId(job_vacancy_id),
                                        "active": True
                                    }))
                                except Exception:
                                    questions = []
                            interview_questions = [q["question"] for q in questions]
                            question_tags = {q["question"]: q.get("tag", "") for q in questions}
                            interview_state["job_vacancy_id"] = job_vacancy_id
                            interview_state["total_questions"] = len(interview_questions)
                            if "job_candidate_id" in data.get("setup", {}):
                                interview_state["candidate_id"] = data["setup"]["job_candidate_id"]
                        except Exception as e:
                            print(f"Error fetching interview questions: {e}")
                            print(f"Full traceback: {traceback.format_exc()}")

                    # --- CONTEXTO (PROMPT) MODIFICADO ---
                    if interview_questions:
                        context = "Você é um assistente de voz para pré-entrevistas de emprego. Você é gentil, educado e fala português do Brasil de forma clara e objetiva.\n\n"
                        context += "MISSÃO: Sua tarefa é fazer uma pré-entrevista com o candidato, fazendo TODAS as perguntas da lista, UMA DE CADA VEZ.\n\n"
                        context += "PERGUNTAS OBRIGATÓRIAS (faça uma por vez na ordem exata):\n"
                        for i, question in enumerate(interview_questions, 1):
                            tag = question_tags.get(question, f"pergunta_{i}")
                            context += f"{i}. {question} (tag: {tag})\n"

                        context += "\nPROTOCOLO DE ENTREVISTA:\n"
                        context += "1. Comece fazendo uma BREVE introdução e siga com a primeira pergunta da lista. Não espere o usuário falar primeiro.\n"
                        context += "2. Após o candidato responder, SINTETIZE a resposta e use a tool `save_response` com a tag da pergunta e a resposta dele.\n"
                        context += "3. Faça a PRÓXIMA pergunta da lista.\n"
                        context += "5. Quando tiver feito TODAS as perguntas e salvo TODAS as respostas, agradeça ao candidato e OBRIGATORIAMENTE use a tool `submit_interview` para terminar a conversa.\n\n"

                        context += "USO DA TOOL `save_response`:\n"
                        context += "- Esta tool DEVE ser chamada após CADA uma das perguntas ter sido respondida.\n"
                        context += "- Você deve passar para ela um único argumento: `response_json`.\n"
                        context += "- O valor deste argumento DEVE ser uma STRING JSON contendo a tag e a resposta que você coletou.\n"
                        context += "- Exemplo de chamada: save_response(response_json='{\"nome_completo\":\"João da Silva\"}')\n"

                        context += "USO DA TOOL `submit_interview`:\n"
                        context += "- Esta tool DEVE ser chamada após todas as perguntas terem sido respondidas.\n"
                        context += "- Exemplo de chamada: submit_interview()\n"

                        context += "IMPORTANTE: Comece agora com a primeira pergunta.\n"
                    else:
                        context = "Você é um assistente de voz para pré-entrevistas de emprego. Você é gentil, educado e fala português do Brasil de forma clara e objetiva.\n\n"
                        context += "MISSÃO: Sua tarefa é fazer uma pré-entrevista com o candidato, fazendo TODAS as perguntas da lista, UMA DE CADA VEZ."
                        context += "USO DA TOOL `save_response`:\n"
                        context += "- Esta tool DEVE ser chamada após CADA uma das perguntas ter sido respondida.\n"
                        context += "- Você deve passar para ela um único argumento: `response_json`.\n"
                        context += "- O valor deste argumento DEVE ser uma STRING JSON contendo a tag e a resposta que você coletou.\n"
                        context += "- Exemplo de chamada: save_response(response_json='{\"nome_completo\":\"João da Silva\"}')\n"

                        context += "USO DA TOOL `submit_interview`:\n"
                        context += "- Esta tool DEVE ser chamada após todas as perguntas terem sido respondidas.\n"
                        context += "- Exemplo de chamada: submit_interview()\n"

                        context += "IMPORTANTE: Comece agora com a primeira pergunta.\n"

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
                                        "text": context
                                    }
                                ]
                            },
                            "tools": [
                                {
                                    "function_declarations": [
                                        {
                                        "name": "save_response",
                                        "description": "Salva uma única resposta do candidato. Use após CADA pergunta.",
                                        "parameters": {
                                            "type": "object",
                                            "properties": {
                                                "tag": {"type": "string", "description": "A tag da pergunta."},
                                                "response": {"type": "string", "description": "A resposta do candidato."}
                                            },
                                            "required": ["tag", "response"]
                                            }
                                        },
                                        {
                                            "name": "submit_interview",
                                            "description": "Encerra a entrevista, finalizando a conexão do websocket. Use APENAS no final da entrevista.",
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                    await target_websocket.send(json.dumps(gemini_setup))
                    continue
                # Handler para tool call do Gemini
                if "toolCall" in data:
                    function_calls = data["toolCall"]['functionCalls']
                    for tool_call in function_calls:
                        if tool_call.get("name") == "save_response":
                            args = tool_call.get("args", {})
                            tag = args.get("tag")
                            response = args.get("response")
                            print(f"💾 Recebida resposta via Tool - Tag: {tag}")
                            
                            # 1. Salva a resposta individual no banco de dados (como já fazia)
                            save_response_in_db(
                                interview_id=interview_state["interview_id"],
                                tag=tag,
                                response=response,
                                candidate_id=interview_state["candidate_id"],
                                job_vacancy_id=interview_state["job_vacancy_id"]
                            )
                        
                        elif tool_call.get("name") == "submit_interview":
                            print("🏁 Entrevista finalizada e submetida pelo Gemini.")
                            args = tool_call.get("args", {})

                            interview_state["interview_completed"] = True

                            # Envia o JSON final de volta para o cliente original
                            if name == "Server->Client":
                                await source_websocket.close(1000, "Interview completed")

                            # Pula o resto do processamento para esta mensagem, pois a entrevista acabou
                            continue
                # Forward the message
                if hasattr(target_websocket, "send_text"):
                    await target_websocket.send_text(json.dumps(data))
                else:
                    await target_websocket.send(json.dumps(data))

            except websockets.exceptions.ConnectionClosed as e:
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
    client_websocket: WebSocketCommonProtocol, gemini_client: GeminiClient, interview_state
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
                client_websocket, server_websocket, "Client->Server", gemini_client, interview_state
            )
        )
        server_to_client = asyncio.create_task(
            proxy_task(
                server_websocket, client_websocket, "Server->Client", gemini_client, interview_state
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

        # Track interview state
        interview_state = {
            "interview_id": None,
            "candidate_id": None,
            "job_vacancy_id": None,
            "questions_asked": [],
            "current_question_number": 0,
            "total_questions": 0,
            "expecting_final_response": False,
            "interview_completed": False
        }

        await create_proxy(client_websocket, gemini_client, interview_state)

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
