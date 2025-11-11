# debug.py or test_config.py
import config

print("\n=== CONFIG TEST ===")
print(f"crew_llm object: {config.crew_llm}")
print(f"crew_llm.model: {config.crew_llm.model}")
print(f"crew_llm._llm_type: {config.crew_llm._llm_type}")
print(f"Is ready: {config.is_ready()}")

# Test a simple call
print("\n=== TESTING LLM CALL ===")
try:
    response = config.crew_llm._call("Say 'Hello from Gemini!'")
    print(f"✅ LLM Response: {response}")
except Exception as e:
    print(f"❌ LLM Call failed: {e}")

print("==================\n")