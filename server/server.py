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
from datetime import datetime


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
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler for HTTP exceptions.
    """
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(InvalidId)
async def invalid_id_exception_handler(request: Request, exc: InvalidId):
    """
    Handler for MongoDB InvalidId exceptions.
    """
    return JSONResponse(status_code=400, content={"detail": "Invalid ID format"})


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


@app.get("/interview_questions")
async def get_interview_questions():
    """
    Get all interview questions.
    """
    questions = list(mongo_client_db.interview_questions.find({}))

    for question in questions:
        question["_id"] = str(question["_id"])

    return {"interview_questions": questions}


@app.post("/interview_questions")
async def create_interview_question(request: Request):
    """
    Create a new interview question.
    """
    try:
        data = await request.json()

        # Validate required fields
        if not data.get("question"):
            raise HTTPException(status_code=400, detail="Question text is required")

        # Create question document
        question_doc = {
            "question": data["question"],
            "category": data.get("category", "personal"),
            "difficulty": data.get("difficulty", "easy"),
            "tag": data.get("tag", ""),
            "job_vacancy_id": data.get("job_vacancy_id"),
            "created_at": datetime.utcnow(),
            "active": data.get("active", True),
        }

        result = mongo_client_db.interview_questions.insert_one(question_doc)
        question_doc["_id"] = str(result.inserted_id)

        return {"interview_question": question_doc}

    except Exception as e:
        logging.error(f"Error creating interview question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/interview_questions/{question_id}")
async def update_interview_question(question_id: str, request: Request):
    """
    Update an interview question.
    """
    try:
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=400, detail="Invalid question ID")

        data = await request.json()

        # Update fields
        update_data = {}
        if "question" in data:
            update_data["question"] = data["question"]
        if "category" in data:
            update_data["category"] = data["category"]
        if "difficulty" in data:
            update_data["difficulty"] = data["difficulty"]
        if "tag" in data:
            update_data["tag"] = data["tag"]
        if "active" in data:
            update_data["active"] = data["active"]

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_data["updated_at"] = datetime.utcnow()

        result = mongo_client_db.interview_questions.update_one(
            {"_id": ObjectId(question_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")

        return {"message": "Question updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating interview question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/interview_questions/{question_id}")
async def delete_interview_question(question_id: str):
    """
    Delete an interview question.
    """
    try:
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=400, detail="Invalid question ID")

        result = mongo_client_db.interview_questions.delete_one(
            {"_id": ObjectId(question_id)}
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")

        return {"message": "Question deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting interview question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_questions/job_vacancy/{job_vacancy_id}")
async def get_interview_questions_by_job_vacancy(job_vacancy_id: str):
    """
    Get interview questions for a specific job vacancy.
    """
    try:
        if not ObjectId.is_valid(job_vacancy_id):
            raise HTTPException(status_code=400, detail="Invalid job vacancy ID")

        questions = list(
            mongo_client_db.interview_questions.find(
                {"job_vacancy_id": job_vacancy_id, "active": True}
            )
        )

        for question in questions:
            question["_id"] = str(question["_id"])

        return {"interview_questions": questions}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interview questions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/interviews")
async def create_interview(request: Request):
    """
    Create a new interview session.
    """
    try:
        data = await request.json()

        # Validate required fields
        if not data.get("candidate_id"):
            raise HTTPException(status_code=400, detail="Candidate ID is required")
        if not data.get("job_vacancy_id"):
            raise HTTPException(status_code=400, detail="Job vacancy ID is required")

        # Create interview document
        interview_doc = {
            "candidate_id": ObjectId(data["candidate_id"]),
            "job_vacancy_id": ObjectId(data["job_vacancy_id"]),
            "status": "in_progress",
            "started_at": datetime.utcnow(),
            "responses": {},
            "questions_asked": [],
        }

        result = mongo_client_db.interviews.insert_one(interview_doc)
        interview_doc["_id"] = str(result.inserted_id)

        return {"interview": interview_doc}

    except Exception as e:
        logging.error(f"Error creating interview: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/interviews/{interview_id}/responses")
async def update_interview_responses(interview_id: str, request: Request):
    """
    Update interview responses.
    """
    try:
        if not ObjectId.is_valid(interview_id):
            raise HTTPException(status_code=400, detail="Invalid interview ID")

        data = await request.json()

        # Validate required fields
        if not data.get("responses"):
            raise HTTPException(status_code=400, detail="Responses are required")

        update_data = {"responses": data["responses"], "updated_at": datetime.utcnow()}

        if data.get("status"):
            update_data["status"] = data["status"]
            if data["status"] == "completed":
                update_data["completed_at"] = datetime.utcnow()

        result = mongo_client_db.interviews.update_one(
            {"_id": ObjectId(interview_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Interview not found")

        return {"message": "Interview responses updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating interview responses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interviews/{interview_id}")
async def get_interview(interview_id: str):
    """
    Get a specific interview by ID.
    """
    try:
        if not ObjectId.is_valid(interview_id):
            raise HTTPException(status_code=400, detail="Invalid interview ID")

        interview = mongo_client_db.interviews.find_one({"_id": ObjectId(interview_id)})

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        interview["_id"] = str(interview["_id"])
        interview["candidate_id"] = str(interview["candidate_id"])
        interview["job_vacancy_id"] = str(interview["job_vacancy_id"])

        return {"interview": interview}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interview: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interviews/candidate/{candidate_id}")
async def get_interviews_by_candidate(candidate_id: str):
    """
    Get all interviews for a specific candidate.
    """
    try:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid candidate ID")

        interviews = list(
            mongo_client_db.interviews.find({"candidate_id": ObjectId(candidate_id)})
        )

        for interview in interviews:
            interview["_id"] = str(interview["_id"])
            interview["candidate_id"] = str(interview["candidate_id"])
            interview["job_vacancy_id"] = str(interview["job_vacancy_id"])

        return {"interviews": interviews}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interviews by candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_questions_asked")
async def get_interview_questions_asked():
    """
    Get all questions asked during interviews.
    """
    try:
        questions = list(
            mongo_client_db.interview_questions_asked.find({}).sort("asked_at", -1)
        )

        for question in questions:
            question["_id"] = str(question["_id"])
            if question.get("interview_id"):
                question["interview_id"] = str(question["interview_id"])
            if question.get("candidate_id"):
                question["candidate_id"] = str(question["candidate_id"])
            if question.get("job_vacancy_id"):
                question["job_vacancy_id"] = str(question["job_vacancy_id"])

        return {"interview_questions_asked": questions}

    except Exception as e:
        logging.error(f"Error getting interview questions asked: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_questions_asked/interview/{interview_id}")
async def get_interview_questions_asked_by_interview(interview_id: str):
    """
    Get questions asked during a specific interview.
    """
    try:
        if not ObjectId.is_valid(interview_id):
            raise HTTPException(status_code=400, detail="Invalid interview ID")

        questions = list(
            mongo_client_db.interview_questions_asked.find(
                {"interview_id": ObjectId(interview_id)}
            ).sort("question_number", 1)
        )

        for question in questions:
            question["_id"] = str(question["_id"])
            if question.get("interview_id"):
                question["interview_id"] = str(question["interview_id"])
            if question.get("candidate_id"):
                question["candidate_id"] = str(question["candidate_id"])
            if question.get("job_vacancy_id"):
                question["job_vacancy_id"] = str(question["job_vacancy_id"])

        return {"interview_questions_asked": questions}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interview questions asked by interview: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_questions_asked/candidate/{candidate_id}")
async def get_interview_questions_asked_by_candidate(candidate_id: str):
    """
    Get questions asked during interviews for a specific candidate.
    """
    try:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid candidate ID")

        questions = list(
            mongo_client_db.interview_questions_asked.find(
                {"candidate_id": ObjectId(candidate_id)}
            ).sort("asked_at", -1)
        )

        for question in questions:
            question["_id"] = str(question["_id"])
            if question.get("interview_id"):
                question["interview_id"] = str(question["interview_id"])
            if question.get("candidate_id"):
                question["candidate_id"] = str(question["candidate_id"])
            if question.get("job_vacancy_id"):
                question["job_vacancy_id"] = str(question["job_vacancy_id"])

        return {"interview_questions_asked": questions}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interview questions asked by candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_responses")
async def get_interview_responses():
    """
    Get all interview responses.
    """
    try:
        responses = list(
            mongo_client_db.interview_responses.find({}).sort("answered_at", -1)
        )

        for response in responses:
            response["_id"] = str(response["_id"])
            if response.get("interview_id"):
                response["interview_id"] = str(response["interview_id"])
            if response.get("candidate_id"):
                response["candidate_id"] = str(response["candidate_id"])
            if response.get("job_vacancy_id"):
                response["job_vacancy_id"] = str(response["job_vacancy_id"])

        return {"interview_responses": responses}

    except Exception as e:
        logging.error(f"Error getting interview responses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_responses/interview/{interview_id}")
async def get_interview_responses_by_interview(interview_id: str):
    """
    Get responses for a specific interview.
    """
    try:
        if not ObjectId.is_valid(interview_id):
            raise HTTPException(status_code=400, detail="Invalid interview ID")

        responses = list(
            mongo_client_db.interview_responses.find(
                {"interview_id": ObjectId(interview_id)}
            ).sort("answered_at", 1)
        )

        for response in responses:
            response["_id"] = str(response["_id"])
            if response.get("interview_id"):
                response["interview_id"] = str(response["interview_id"])
            if response.get("candidate_id"):
                response["candidate_id"] = str(response["candidate_id"])
            if response.get("job_vacancy_id"):
                response["job_vacancy_id"] = str(response["job_vacancy_id"])

        return {"interview_responses": responses}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interview responses by interview: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/interview_responses/candidate/{candidate_id}")
async def get_interview_responses_by_candidate(candidate_id: str):
    """
    Get responses for a specific candidate.
    """
    try:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid candidate ID")

        responses = list(
            mongo_client_db.interview_responses.find(
                {"candidate_id": ObjectId(candidate_id)}
            ).sort("answered_at", -1)
        )

        for response in responses:
            response["_id"] = str(response["_id"])
            if response.get("interview_id"):
                response["interview_id"] = str(response["interview_id"])
            if response.get("candidate_id"):
                response["candidate_id"] = str(response["candidate_id"])
            if response.get("job_vacancy_id"):
                response["job_vacancy_id"] = str(response["job_vacancy_id"])

        return {"interview_responses": responses}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting interview responses by candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


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


@app.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    """
    Get a specific candidate by ID.
    """
    try:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid candidate ID")

        candidate = mongo_client_db.candidates.find_one({"_id": ObjectId(candidate_id)})

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        candidate["_id"] = str(candidate["_id"])
        if candidate.get("job_vacancy_id"):
            candidate["job_vacancy_id"] = str(candidate["job_vacancy_id"])

        return {"candidate": candidate}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting candidate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/candidates/{candidate_id}/meet")
async def get_meet_data(candidate_id: str):
    """
    Get candidate and job vacancy data for the meet page.
    """
    try:
        print(f"🔍 get_meet_data - candidate_id: {candidate_id}")

        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid candidate ID")

        # Get candidate data
        candidate = mongo_client_db.candidates.find_one({"_id": ObjectId(candidate_id)})

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        candidate["_id"] = str(candidate["_id"])
        print(f"🔍 get_meet_data - candidate found: {candidate}")

        # Get job vacancy data if candidate has job_vacancy_id
        job_vacancy = None
        if candidate.get("job_vacancy_id"):
            candidate["job_vacancy_id"] = str(candidate["job_vacancy_id"])
            print(f"🔍 get_meet_data - job_vacancy_id: {candidate['job_vacancy_id']}")

            job_vacancy = mongo_client_db.job_vacancies.find_one(
                {"_id": ObjectId(candidate["job_vacancy_id"])}
            )

            if job_vacancy:
                job_vacancy["_id"] = str(job_vacancy["_id"])
                print(f"🔍 get_meet_data - job_vacancy found: {job_vacancy}")
            else:
                print(
                    f"🔍 get_meet_data - job_vacancy not found for ID: {candidate['job_vacancy_id']}"
                )
        else:
            print(f"🔍 get_meet_data - candidate has no job_vacancy_id")

        # Get interview questions for this job vacancy
        interview_questions = []
        if candidate.get("job_vacancy_id"):
            # Try to find questions with string comparison first
            questions = list(
                mongo_client_db.interview_questions.find(
                    {"job_vacancy_id": candidate["job_vacancy_id"], "active": True}
                )
            )

            # If no questions found, try with ObjectId
            if not questions:
                try:
                    questions = list(
                        mongo_client_db.interview_questions.find(
                            {
                                "job_vacancy_id": ObjectId(candidate["job_vacancy_id"]),
                                "active": True,
                            }
                        )
                    )
                    print(f"Found {len(questions)} questions using ObjectId conversion")
                except Exception as e:
                    print(f"Error converting to ObjectId: {e}")
                    questions = []

            for question in questions:
                question["_id"] = str(question["_id"])
                question["job_vacancy_id"] = str(question["job_vacancy_id"])

            interview_questions = questions

        print(
            f"🔍 get_meet_data - returning data: candidate={candidate is not None}, job_vacancy={job_vacancy is not None}, questions={len(interview_questions)}"
        )

        return {
            "candidate": candidate,
            "job_vacancy": job_vacancy,
            "interview_questions": interview_questions,
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting meet data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


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
