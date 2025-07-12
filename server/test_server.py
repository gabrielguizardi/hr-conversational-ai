#!/usr/bin/env python3
"""
Test script to check if the server can be started
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_imports():
    """Test if all required modules can be imported"""
    try:
        import asyncio
        import json
        import traceback
        import websockets
        from websockets.legacy.protocol import WebSocketCommonProtocol
        from websockets.legacy.server import WebSocketServerProtocol
        from gemini_client import GeminiClient
        from pymongo import MongoClient
        from bson.objectid import ObjectId
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_environment():
    """Test if required environment variables are set"""
    required_vars = ["GEMINI_API_KEY", "MONGODB_URI"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        print("Please create a .env file with the required variables")
        return False
    else:
        print("✅ Environment variables configured")
        return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        from pymongo import MongoClient
        mongo_uri = os.getenv("MONGODB_URI")
        client = MongoClient(mongo_uri)
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing server configuration...")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Environment Test", test_environment),
        ("MongoDB Test", test_mongodb_connection),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
        else:
            print(f"  {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed! Server should work correctly.")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 