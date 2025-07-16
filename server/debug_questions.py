import os
from pymongo import MongoClient
from bson.objectid import ObjectId

# MongoDB connection
mongo_client = MongoClient(os.environ.get("MONGODB_URI", "mongodb://localhost:27017"))
mongo_client_db = mongo_client.hr_conversational_ai

# Test job vacancy ID (use the one from your data)
job_vacancy_id = "68705fe860fd8b9c14a59003"

print("=== DEBUG: CONSULTA DE PERGUNTAS ===")
print(f"Job Vacancy ID: {job_vacancy_id}")

# 1. Verificar todas as perguntas na coleção
print("\n1. TODAS AS PERGUNTAS NA COLEÇÃO:")
all_questions = list(mongo_client_db.interview_questions.find({}))
print(f"Total de perguntas: {len(all_questions)}")

for i, q in enumerate(all_questions, 1):
    print(f"  {i}. ID: {q.get('_id')}")
    print(f"     Job Vacancy ID: {q.get('job_vacancy_id')} (tipo: {type(q.get('job_vacancy_id'))})")
    print(f"     Active: {q.get('active')}")
    print(f"     Question: {q.get('question')}")
    print(f"     Category: {q.get('category')}")
    print(f"     Tag: {q.get('tag')}")
    print()

# 2. Verificar perguntas com string comparison
print("\n2. CONSULTA COM STRING COMPARISON:")
questions_string = list(mongo_client_db.interview_questions.find({
    "job_vacancy_id": job_vacancy_id,
    "active": True
}))
print(f"Perguntas encontradas com string: {len(questions_string)}")

for i, q in enumerate(questions_string, 1):
    print(f"  {i}. {q.get('question')}")

# 3. Verificar perguntas com ObjectId comparison
print("\n3. CONSULTA COM OBJECTID COMPARISON:")
try:
    questions_objectid = list(mongo_client_db.interview_questions.find({
        "job_vacancy_id": ObjectId(job_vacancy_id),
        "active": True
    }))
    print(f"Perguntas encontradas com ObjectId: {len(questions_objectid)}")
    
    for i, q in enumerate(questions_objectid, 1):
        print(f"  {i}. {q.get('question')}")
except Exception as e:
    print(f"Erro na consulta com ObjectId: {e}")

# 4. Verificar perguntas apenas por job_vacancy_id (sem filtro active)
print("\n4. CONSULTA APENAS POR JOB_VACANCY_ID (sem filtro active):")
questions_no_active = list(mongo_client_db.interview_questions.find({
    "job_vacancy_id": job_vacancy_id
}))
print(f"Perguntas encontradas (sem filtro active): {len(questions_no_active)}")

for i, q in enumerate(questions_no_active, 1):
    print(f"  {i}. {q.get('question')} (active: {q.get('active')})")

# 5. Verificar perguntas apenas por job_vacancy_id com ObjectId (sem filtro active)
print("\n5. CONSULTA APENAS POR JOB_VACANCY_ID COM OBJECTID (sem filtro active):")
try:
    questions_objectid_no_active = list(mongo_client_db.interview_questions.find({
        "job_vacancy_id": ObjectId(job_vacancy_id)
    }))
    print(f"Perguntas encontradas com ObjectId (sem filtro active): {len(questions_objectid_no_active)}")
    
    for i, q in enumerate(questions_objectid_no_active, 1):
        print(f"  {i}. {q.get('question')} (active: {q.get('active')})")
except Exception as e:
    print(f"Erro na consulta com ObjectId (sem filtro active): {e}")

# 6. Verificar se há perguntas inativas
print("\n6. PERGUNTAS INATIVAS:")
inactive_questions = list(mongo_client_db.interview_questions.find({
    "job_vacancy_id": job_vacancy_id,
    "active": False
}))
print(f"Perguntas inativas: {len(inactive_questions)}")

for i, q in enumerate(inactive_questions, 1):
    print(f"  {i}. {q.get('question')} (active: {q.get('active')})")

# 7. Verificar se há perguntas sem o campo active
print("\n7. PERGUNTAS SEM CAMPO ACTIVE:")
questions_no_active_field = list(mongo_client_db.interview_questions.find({
    "job_vacancy_id": job_vacancy_id,
    "active": {"$exists": False}
}))
print(f"Perguntas sem campo active: {len(questions_no_active_field)}")

for i, q in enumerate(questions_no_active_field, 1):
    print(f"  {i}. {q.get('question')} (active field exists: {'active' in q})")

print("\n=== FIM DO DEBUG ===") 