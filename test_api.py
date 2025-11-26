#!/usr/bin/env python3
"""
SelfOS GPT API Test Script
Tests all API endpoints to verify they're working correctly.
"""

import requests
import json
import time

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
        print(f"   Response: {json.dumps(data, indent=2)[:500]}")
        if len(json.dumps(data)) > 500:
            print("   ... (truncated)")
    except:
        print(f"   Response: {response.text[:200]}")
    print()
    return response

def test_api():
    print("=" * 60)
    print("SelfOS GPT API Test Suite")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:20]}...")
    print("=" * 60)
    print()

    # Track created resources for cleanup
    created_course_id = None
    created_chapter_id = None
    created_note_id = None
    created_resource_id = None

    try:
        # 1. Test OpenAPI Schema
        print("1. Testing OpenAPI Schema Endpoint")
        print("-" * 40)
        r = requests.get(f"{BASE_URL}/api/openapi.json")
        print_result("GET /api/openapi.json", r)
        if r.status_code == 200:
            schema = r.json()
            print(f"   Schema title: {schema.get('info', {}).get('title')}")
            print(f"   Server URL: {schema.get('servers', [{}])[0].get('url')}")
        print()

        # 2. Test List Courses (empty or existing)
        print("2. Testing Courses API")
        print("-" * 40)
        r = requests.get(f"{BASE_URL}/api/gpt/courses", headers=headers)
        print_result("GET /api/gpt/courses", r)

        # 3. Create a new course
        course_data = {
            "title": "Test Course - Python API Test",
            "description": "This course was created by the API test script",
            "chapters": ["Introduction", "Getting Started", "Advanced Topics"]
        }
        r = requests.post(f"{BASE_URL}/api/gpt/courses", headers=headers, json=course_data)
        result = print_result("POST /api/gpt/courses (create)", r)
        if r.status_code == 201:
            created_course_id = r.json().get("id")
            chapters = r.json().get("chapters", [])
            if chapters:
                created_chapter_id = chapters[0].get("id")
            print(f"   Created course ID: {created_course_id}")
            print(f"   Created chapter ID: {created_chapter_id}")

        # 4. Get the created course
        if created_course_id:
            r = requests.get(f"{BASE_URL}/api/gpt/courses/{created_course_id}", headers=headers)
            print_result(f"GET /api/gpt/courses/{created_course_id}", r)

        # 5. Update the course
        if created_course_id:
            update_data = {"description": "Updated description via API test"}
            r = requests.put(f"{BASE_URL}/api/gpt/courses/{created_course_id}", headers=headers, json=update_data)
            print_result(f"PUT /api/gpt/courses/{created_course_id}", r)

        # 6. List courses with chapters
        r = requests.get(f"{BASE_URL}/api/gpt/courses?includeChapters=true", headers=headers)
        print_result("GET /api/gpt/courses?includeChapters=true", r)

        print()
        print("3. Testing Chapters API")
        print("-" * 40)

        # 7. List chapters for the course
        if created_course_id:
            r = requests.get(f"{BASE_URL}/api/gpt/courses/{created_course_id}/chapters", headers=headers)
            print_result(f"GET /api/gpt/courses/{created_course_id}/chapters", r)

        # 8. Add a new chapter
        if created_course_id:
            chapter_data = {"title": "Bonus Chapter - Added via API"}
            r = requests.post(f"{BASE_URL}/api/gpt/courses/{created_course_id}/chapters", headers=headers, json=chapter_data)
            print_result(f"POST /api/gpt/courses/{created_course_id}/chapters", r)
            if r.status_code == 201:
                new_chapters = r.json().get("chapters", [])
                if new_chapters:
                    # Use the newly created chapter for further tests
                    created_chapter_id = new_chapters[0].get("id")

        # 9. Get chapter details
        if created_chapter_id:
            r = requests.get(f"{BASE_URL}/api/gpt/chapters/{created_chapter_id}", headers=headers)
            print_result(f"GET /api/gpt/chapters/{created_chapter_id}", r)

        # 10. Update chapter
        if created_chapter_id:
            r = requests.put(f"{BASE_URL}/api/gpt/chapters/{created_chapter_id}", headers=headers, json={"title": "Updated Chapter Title"})
            print_result(f"PUT /api/gpt/chapters/{created_chapter_id}", r)

        # 11. Mark chapter complete
        if created_chapter_id:
            r = requests.post(f"{BASE_URL}/api/gpt/chapters/{created_chapter_id}/complete", headers=headers)
            print_result(f"POST /api/gpt/chapters/{created_chapter_id}/complete", r)

        # 12. Reset chapter progress
        if created_chapter_id:
            r = requests.delete(f"{BASE_URL}/api/gpt/chapters/{created_chapter_id}/complete", headers=headers)
            print_result(f"DELETE /api/gpt/chapters/{created_chapter_id}/complete", r)

        print()
        print("4. Testing Notes API")
        print("-" * 40)

        # 13. List notes
        r = requests.get(f"{BASE_URL}/api/gpt/notes", headers=headers)
        print_result("GET /api/gpt/notes", r)

        # 14. Create a quick note
        note_data = {"content": "This is a test note created by the API test script."}
        r = requests.post(f"{BASE_URL}/api/gpt/notes", headers=headers, json=note_data)
        print_result("POST /api/gpt/notes (quick note)", r)
        if r.status_code == 201:
            created_note_id = r.json().get("id")

        # 15. Create a note linked to course/chapter
        if created_course_id and created_chapter_id:
            note_data = {
                "content": "This is a note linked to a specific chapter.",
                "courseId": created_course_id,
                "chapterId": created_chapter_id
            }
            r = requests.post(f"{BASE_URL}/api/gpt/notes", headers=headers, json=note_data)
            print_result("POST /api/gpt/notes (linked to chapter)", r)

        # 16. Get note
        if created_note_id:
            r = requests.get(f"{BASE_URL}/api/gpt/notes/{created_note_id}", headers=headers)
            print_result(f"GET /api/gpt/notes/{created_note_id}", r)

        # 17. Update note
        if created_note_id:
            r = requests.put(f"{BASE_URL}/api/gpt/notes/{created_note_id}", headers=headers, json={"content": "Updated note content."})
            print_result(f"PUT /api/gpt/notes/{created_note_id}", r)

        print()
        print("5. Testing Resources API")
        print("-" * 40)

        # 18. Create a resource
        if created_chapter_id:
            resource_data = {
                "chapterId": created_chapter_id,
                "name": "Test YouTube Video",
                "type": "youtube",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
            r = requests.post(f"{BASE_URL}/api/gpt/resources", headers=headers, json=resource_data)
            print_result("POST /api/gpt/resources", r)
            if r.status_code == 201:
                created_resource_id = r.json().get("id")

        # 19. List resources
        if created_chapter_id:
            r = requests.get(f"{BASE_URL}/api/gpt/resources?chapterId={created_chapter_id}", headers=headers)
            print_result(f"GET /api/gpt/resources?chapterId={created_chapter_id}", r)

        # 20. Get resource
        if created_resource_id:
            r = requests.get(f"{BASE_URL}/api/gpt/resources/{created_resource_id}", headers=headers)
            print_result(f"GET /api/gpt/resources/{created_resource_id}", r)

        print()
        print("6. Cleanup - Deleting Test Data")
        print("-" * 40)

        # Delete resource
        if created_resource_id:
            r = requests.delete(f"{BASE_URL}/api/gpt/resources/{created_resource_id}", headers=headers)
            print_result(f"DELETE /api/gpt/resources/{created_resource_id}", r)

        # Delete note
        if created_note_id:
            r = requests.delete(f"{BASE_URL}/api/gpt/notes/{created_note_id}", headers=headers)
            print_result(f"DELETE /api/gpt/notes/{created_note_id}", r)

        # Delete course (this cascades to chapters, progress, etc.)
        if created_course_id:
            r = requests.delete(f"{BASE_URL}/api/gpt/courses/{created_course_id}", headers=headers)
            print_result(f"DELETE /api/gpt/courses/{created_course_id}", r)

        print()
        print("=" * 60)
        print("Test Complete!")
        print("=" * 60)

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api()
