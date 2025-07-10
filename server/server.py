"""Vertex AI Gemini Multimodal Live WebSockets Server"""

import asyncio
import os
import uvicorn
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.errors import InvalidId


from proxy import handle_client, active_client_connections, cleanup_connections
from gemini_client import GeminiClient

load_dotenv()

app = FastAPI()

# Exception handlers
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handler for generic exceptions.
    """
    logging.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler for HTTP exceptions.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(InvalidId)
async def invalid_id_exception_handler(request: Request, exc: InvalidId):
    """
    Handler for MongoDB InvalidId exceptions.
    """
    return JSONResponse(
        status_code=400,
        content={"detail": "Invalid ID format"}
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajuste para restringir em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
gemini_client = GeminiClient()
mongo_client = MongoClient(os.environ.get("MONGODB_URI"))
mongo_client_db = mongo_client.hr_conversational_ai


@app.get("/health_check")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}


@app.post("/job_vacancies")
async def create_job_vacancy(job_vacancy: dict):
    """
    Create a new job vacancy.
    """
    mongo_client_db.job_vacancies.insert_one(job_vacancy)
    return {"status": "success", "message": "Job vacancy created successfully"}


@app.get("/job_vacancies")
async def get_job_vacancies():
    """
    Get all job vacancies.
    """
    job_vacancies = list(mongo_client_db.job_vacancies.find({}))

    for job in job_vacancies:
        job["_id"] = str(job["_id"])

    return {"job_vacancies": job_vacancies}


@app.get("/job_vacancies/{job_id}")
def get_job_vacancy(job_id: str):
    """
    Get a specific job vacancy by ID.
    """
    job_vacancy = mongo_client_db.job_vacancies.find_one({"_id": ObjectId(job_id)})

    if not job_vacancy:
        raise HTTPException(status_code=404, detail="Job vacancy not found")

    job_vacancy["_id"] = str(job_vacancy["_id"])
    return {"job_vacancy": job_vacancy}


@app.post("/job_vacancies/{job_id}/candidates")
def create_candidate_for_job(job_id: str, candidate: dict):
    """
    Create a candidate for a specific job vacancy.
    """
    candidate["job_vacancy_id"] = ObjectId(job_id)
    mongo_client_db.candidates.insert_one(candidate)
    return {"status": "success", "message": "Candidate created successfully"}


@app.get("/job_vacancies/{job_id}/candidates")
def get_candidates_for_job(job_id: str):
    """
    Get all candidates for a specific job vacancy.
    """
    candidates = list(
        mongo_client_db.candidates.find({"job_vacancy_id": ObjectId(job_id)})
    )

    for candidate in candidates:
        candidate["_id"] = str(candidate["_id"])
        candidate["job_vacancy_id"] = str(candidate["job_vacancy_id"])

    return {"candidates": candidates}


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
