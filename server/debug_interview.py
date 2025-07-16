#!/usr/bin/env python3
"""
Script de debug para testar a funcionalidade de entrevista
"""

import asyncio
import json
from datetime import datetime

async def test_interview_setup():
    """Testa o setup de entrevista"""
    
    # Simula dados de setup
    setup_data = {
        "setup": {
            "job_vacancy_id": "507f1f77bcf86cd799439011",  # ID de exemplo
            "interview_id": "507f1f77bcf86cd799439012",
            "candidate_id": "507f1f77bcf86cd799439013"
        }
    }
    
    print("🧪 Testando setup de entrevista...")
    print(f"Setup data: {json.dumps(setup_data, indent=2)}")
    
    # Simula perguntas que seriam encontradas no banco
    mock_questions = [
        {
            "question": "Qual é o seu nome completo?",
            "tag": "nome_completo",
            "active": True
        },
        {
            "question": "Quantos anos de experiência você tem na área?",
            "tag": "experiencia",
            "active": True
        },
        {
            "question": "Por que você quer trabalhar nesta empresa?",
            "tag": "motivacao",
            "active": True
        }
    ]
    
    print(f"📝 Perguntas mock: {len(mock_questions)}")
    for i, q in enumerate(mock_questions, 1):
        print(f"  {i}. {q['question']} (tag: {q['tag']})")
    
    # Simula o contexto que seria gerado
    interview_questions = [q["question"] for q in mock_questions]
    question_tags = {q["question"]: q.get("tag", "") for q in mock_questions}
    
    context = "Você é um assistente de voz especializado em conduzir pré-entrevistas de emprego. Você é gentil, educado e fala de forma clara e objetiva. Você só fala em português do Brasil.\n\n"
    context += "MISSÃO: Você é um entrevistador de RH. Sua tarefa é fazer uma pré-entrevista com o candidato.\n\n"
    context += "PERGUNTAS OBRIGATÓRIAS (faça uma por vez):\n"
    for i, question in enumerate(interview_questions, 1):
        tag = question_tags.get(question, f"pergunta_{i}")
        context += f"{i}. {question} (tag: {tag})\n"
    
    context += "\nPROTOCOLO DE ENTREVISTA:\n"
    context += "1. Comece AGORA fazendo a primeira pergunta da lista\n"
    context += "2. Faça apenas UMA pergunta por vez\n"
    context += "3. Aguarde a resposta completa do candidato\n"
    context += "4. Se a resposta não for clara, peça esclarecimentos\n"
    context += "5. Após a resposta, faça a próxima pergunta da lista\n"
    context += "6. Quando terminar TODAS as perguntas da lista, siga o protocolo de finalização\n\n"
    
    context += "PROTOCOLO DE FINALIZAÇÃO (OBRIGATÓRIO):\n"
    context += "1. Após fazer a última pergunta e receber a resposta, agradeça ao candidato\n"
    context += "2. Diga: 'Obrigado por participar da pré-entrevista. Agora vou processar suas respostas.'\n"
    context += "3. Imediatamente após agradecer, você DEVE:\n"
    context += "   - Gerar um JSON com todas as respostas coletadas\n"
    context += "   - Usar a tool save_response para cada resposta individual\n"
    context += "   - Incluir o JSON completo na sua resposta final\n\n"
    
    context += "FORMATO DO JSON (OBRIGATÓRIO):\n"
    context += "- Use as tags das perguntas como chaves\n"
    context += "- Exemplo: {\"nome_completo\": \"João Silva\", \"experiencia\": \"3 anos\", \"motivacao\": \"Gosto da empresa\"}\n"
    context += "- Inclua TODAS as respostas coletadas\n\n"
    
    context += "USO DA TOOL save_response:\n"
    context += "- Para cada resposta coletada, chame save_response com:\n"
    context += "  * tag: a tag da pergunta correspondente\n"
    context += "  * response: a resposta do candidato\n"
    context += "- Faça isso para TODAS as respostas antes de finalizar\n"
    context += "- IMPORTANTE: Use a tool save_response ANTES de gerar o JSON final\n"
    context += "- Exemplo de uso: save_response(tag=\"nome_completo\", response=\"João Silva\")\n\n"
    
    context += "IMPORTANTE:\n"
    context += "- NÃO faça outras perguntas além das listadas\n"
    context += "- SEMPRE use a tool save_response para cada resposta\n"
    context += "- SEMPRE gere o JSON final com todas as respostas\n"
    context += "- NUNCA finalize sem usar a tool e gerar o JSON\n"
    context += "- LEMBRE-SE: Você TEM uma tool chamada save_response - USE-A!\n\n"
    
    context += "INSTRUÇÃO FINAL: Comece imediatamente fazendo a primeira pergunta da lista acima. Não espere por nenhuma resposta inicial do usuário.\n"
    
    print(f"📋 Contexto gerado ({len(context)} caracteres):")
    print("=" * 80)
    print(context)
    print("=" * 80)
    
    # Simula tool calls esperados
    expected_tool_calls = [
        {
            "functionName": "save_response",
            "args": {
                "tag": "nome_completo",
                "response": "João Silva Santos"
            }
        },
        {
            "functionName": "save_response", 
            "args": {
                "tag": "experiencia",
                "response": "5 anos de experiência na área de desenvolvimento"
            }
        },
        {
            "functionName": "save_response",
            "args": {
                "tag": "motivacao", 
                "response": "Gosto muito da cultura da empresa e das oportunidades de crescimento"
            }
        }
    ]
    
    print("🔧 Tool calls esperados:")
    for i, tool_call in enumerate(expected_tool_calls, 1):
        print(f"  {i}. {tool_call['functionName']}(tag=\"{tool_call['args']['tag']}\", response=\"{tool_call['args']['response']}\")")
    
    # Simula JSON final esperado
    expected_json = {
        "nome_completo": "João Silva Santos",
        "experiencia": "5 anos de experiência na área de desenvolvimento", 
        "motivacao": "Gosto muito da cultura da empresa e das oportunidades de crescimento"
    }
    
    print(f"📄 JSON final esperado:")
    print(json.dumps(expected_json, indent=2, ensure_ascii=False))
    
    print("\n✅ Teste de setup concluído!")

async def test_tool_call_processing():
    """Testa o processamento de tool calls"""
    
    print("\n🧪 Testando processamento de tool calls...")
    
    # Simula tool call data
    tool_call_data = {
        "toolCall": {
            "functionName": "save_response",
            "args": {
                "tag": "nome_completo",
                "response": "João Silva Santos"
            }
        }
    }
    
    print(f"Tool call data: {json.dumps(tool_call_data, indent=2)}")
    
    # Simula processamento
    tool_call = tool_call_data["toolCall"]
    if tool_call.get("functionName") == "save_response":
        args = tool_call.get("args", {})
        tag = args.get("tag")
        response = args.get("response")
        
        print(f"✅ Tool call processado:")
        print(f"  Tag: {tag}")
        print(f"  Response: {response}")
        print(f"  Timestamp: {datetime.utcnow()}")
    
    print("✅ Teste de tool call concluído!")

async def test_json_detection():
    """Testa a detecção de JSON nas respostas"""
    
    print("\n🧪 Testando detecção de JSON...")
    
    import re
    
    # Simula diferentes tipos de resposta
    test_responses = [
        "Obrigado por participar da pré-entrevista. Aqui estão suas respostas: {\"nome_completo\": \"João Silva\", \"experiencia\": \"5 anos\"}",
        "Entrevista finalizada. Respostas coletadas: {\"motivacao\": \"Gosto da empresa\"}",
        "Processando suas respostas... {\"nome_completo\": \"Maria Santos\", \"experiencia\": \"3 anos\", \"motivacao\": \"Oportunidade de crescimento\"}",
        "Apenas uma mensagem normal sem JSON",
        "JSON malformado: {nome_completo: João Silva}"
    ]
    
    json_pattern = r'\{[^{}]*"[^"]*"[^{}]*\}'
    
    for i, response in enumerate(test_responses, 1):
        print(f"\nTeste {i}: {response[:50]}...")
        
        json_matches = re.findall(json_pattern, response)
        print(f"  JSON matches encontrados: {len(json_matches)}")
        
        for j, json_str in enumerate(json_matches):
            try:
                parsed_json = json.loads(json_str)
                print(f"  ✅ JSON válido {j+1}: {parsed_json}")
            except json.JSONDecodeError as e:
                print(f"  ❌ JSON inválido {j+1}: {e}")
        
        # Check completion indicators
        completion_indicators = [
            "obrigado por participar",
            "pré-entrevista foi concluída", 
            "entrevista foi concluída",
            "processar suas respostas",
            "finalizada"
        ]
        
        is_completion = any(indicator in response.lower() for indicator in completion_indicators)
        print(f"  É mensagem de finalização: {is_completion}")
    
    print("✅ Teste de detecção de JSON concluído!")

async def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes de debug da funcionalidade de entrevista...")
    
    await test_interview_setup()
    await test_tool_call_processing() 
    await test_json_detection()
    
    print("\n🎉 Todos os testes concluídos!")
    print("\n📝 Resumo das melhorias implementadas:")
    print("1. ✅ Contexto mais claro e específico sobre uso da tool")
    print("2. ✅ Instruções explícitas para gerar JSON ao final")
    print("3. ✅ Melhor detecção de mensagens de finalização")
    print("4. ✅ Logs detalhados para debug")
    print("5. ✅ Suporte a texto + áudio no Gemini")
    print("6. ✅ Tags das perguntas incluídas no contexto")
    print("7. ✅ Verificação de tool calls com logs")

if __name__ == "__main__":
    asyncio.run(main()) 