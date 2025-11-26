#!/usr/bin/env python3
"""
SelfOS GPT API Debug Script - Test with existing data
"""

import requests
import json

BASE_URL = 
API_KEY = 

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

def print_result(name, response):
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"{status} {name}: {response.status_code}")
    try:
        data = response.json()
        print(f"   {json.dumps(data, indent=2)}")
    except:
        print(f"   {response.text}")
    print()
    return response

# Use existing course
EXISTING_COURSE_ID = "6926c5d300255a241f91"
EXISTING_CHAPTER_ID = "6926c5db0022e184c73a"

print("Testing with existing data...")
print("=" * 60)

# 1. Test course creation with minimal data
print("\n1. Test course creation (minimal)")
r = requests.post(f"{BASE_URL}/api/gpt/courses", headers=headers, json={
    "title": "Simple Test Course"
})
print_result("POST /api/gpt/courses (minimal)", r)

# 2. Test course creation without chapters
print("\n2. Test course creation (with description, no chapters)")
r = requests.post(f"{BASE_URL}/api/gpt/courses", headers=headers, json={
    "title": "Test Course 2",
    "description": "A test course"
})
print_result("POST /api/gpt/courses", r)

# 3. Get existing course
print("\n3. Get existing course")
r = requests.get(f"{BASE_URL}/api/gpt/courses/{EXISTING_COURSE_ID}", headers=headers)
print_result(f"GET /api/gpt/courses/{EXISTING_COURSE_ID}", r)

# 4. Get existing chapter
print("\n4. Get existing chapter")
r = requests.get(f"{BASE_URL}/api/gpt/chapters/{EXISTING_CHAPTER_ID}", headers=headers)
print_result(f"GET /api/gpt/chapters/{EXISTING_CHAPTER_ID}", r)

# 5. Add chapter to existing course
print("\n5. Add chapter to existing course")
r = requests.post(f"{BASE_URL}/api/gpt/courses/{EXISTING_COURSE_ID}/chapters", headers=headers, json={
    "title": "New Test Chapter"
})
print_result(f"POST /api/gpt/courses/{EXISTING_COURSE_ID}/chapters", r)

# 6. List resources for chapter
print("\n6. List resources for chapter")
r = requests.get(f"{BASE_URL}/api/gpt/resources?chapterId={EXISTING_CHAPTER_ID}", headers=headers)
print_result(f"GET /api/gpt/resources?chapterId={EXISTING_CHAPTER_ID}", r)

# 7. Create resource
print("\n7. Create resource for chapter")
r = requests.post(f"{BASE_URL}/api/gpt/resources", headers=headers, json={
    "chapterId": EXISTING_CHAPTER_ID,
    "name": "MDN JavaScript Guide",
    "type": "webpage",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
})
print_result("POST /api/gpt/resources", r)

print("\n" + "=" * 60)
print("Debug test complete!")
