import requests
import json
import os

BASE_URL = "http://localhost:8000/api/v1/resume"
PDF_PATH = "dummy_resume.pdf"

def run_test():
    print("--- Starting Backend Verification ---")

    # 1. Ingest
    print(f"\n1. Testing /ingest with {PDF_PATH}...")
    if not os.path.exists(PDF_PATH):
        print(f"Error: {PDF_PATH} not found.")
        return

    with open(PDF_PATH, "rb") as f:
        files = {"file": ("dummy_resume.pdf", f, "application/pdf")}
        res = requests.post(f"{BASE_URL}/ingest", files=files)
    
    if res.status_code != 200:
        print(f"Ingest Failed: {res.text}")
        return
    
    data = res.json()
    resume_data = data["data"]
    print("Ingest Success! Parsed Name:", resume_data.get("personal_info", {}).get("name"))

    # 2. Analyze Gaps
    print("\n2. Testing /analyze-gaps...")
    jd = "Software Engineer needed. Must know Python, React, and FastAPI."
    payload = {
        "resume_data": resume_data,
        "job_description": jd
    }
    res = requests.post(f"{BASE_URL}/analyze-gaps", json=payload)
    
    if res.status_code != 200:
        print(f"Analyze Failed: {res.text}")
        return
    
    analysis = res.json()
    print("Analyze Success! Match Score:", analysis.get("match_score"))

    # 3. Generate Tailored Resume
    print("\n3. Testing /generate-tailored...")
    # Mock gap answers
    gap_answers = {"Python": "I use it daily."}
    payload = {
        "resume_data": resume_data,
        "job_description": jd,
        "gap_answers": gap_answers
    }
    res = requests.post(f"{BASE_URL}/generate-tailored", json=payload)
    
    if res.status_code != 200:
        print(f"Generate Failed: {res.text}")
        return
    
    tailored_resume = res.json()
    print("Generate Success! Summary:", tailored_resume.get("summary")[:50] + "...")

    # 4. Render PDF
    print("\n4. Testing /render-pdf...")
    res = requests.post(f"{BASE_URL}/render-pdf", json=tailored_resume)
    
    if res.status_code != 200:
        print(f"Render Failed: {res.text}")
        return
    
    if res.headers.get("content-type") == "application/pdf":
        print(f"Render Success! Received {len(res.content)} bytes of PDF.")
    else:
        print("Render Failed: Did not receive PDF content type.")

    print("\n--- Backend Verification Complete ---")

if __name__ == "__main__":
    run_test()
