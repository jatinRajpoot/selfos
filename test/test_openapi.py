#!/usr/bin/env python3
"""
SelfOS OpenAPI Test Script
Tests all API endpoints defined in the OpenAPI schema.

Usage:
    python test_openapi.py

Requirements:
    pip install requests
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"  # Update if your server runs on a different port
API_KEY = "sos_e76cce7481de35ed6f313beb8591b8cba2488fe5b3ee28134eb7b0a18a71f9ad"

# Test state to track created resources for cleanup
test_state = {
    "course_id": None,
    "chapter_id": None,
    "note_id": None,
    "resource_id": None,
}


def make_request(method, endpoint, json_data=None, params=None):
    """Helper function to make API requests with proper headers."""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
    }
    
    response = requests.request(
        method=method,
        url=url,
        headers=headers,
        json=json_data,
        params=params,
    )
    
    return response


def print_result(test_name, success, response=None, error=None):
    """Print test result in a formatted way."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    
    if response is not None:
        print(f"  Status Code: {response.status_code}")
        try:
            data = response.json()
            print(f"  Response: {json.dumps(data, indent=2)[:500]}")  # Truncate long responses
        except:
            print(f"  Response Text: {response.text[:200]}")
    
    if error:
        print(f"  Error: {error}")


def test_get_openapi_schema():
    """Test: Fetch OpenAPI schema."""
    print("\n" + "="*60)
    print("Testing: GET /api/openapi.json")
    print("="*60)
    
    response = make_request("GET", "/api/openapi.json")
    success = response.status_code == 200
    
    if success:
        data = response.json()
        success = "openapi" in data and "paths" in data
    
    print_result("Fetch OpenAPI Schema", success, response)
    return success


# ============================================================================
# COURSES TESTS
# ============================================================================

def test_create_course():
    """Test: Create a new course."""
    print("\n" + "="*60)
    print("Testing: POST /api/gpt/courses")
    print("="*60)
    
    payload = {
        "title": f"Test Course - {datetime.now().isoformat()}",
        "description": "This is a test course created by the API test script.",
        "chapters": ["Chapter 1: Introduction", "Chapter 2: Basics", "Chapter 3: Advanced"]
    }
    
    response = make_request("POST", "/api/gpt/courses", json_data=payload)
    success = response.status_code == 201
    
    if success:
        data = response.json()
        test_state["course_id"] = data.get("id")
        if data.get("chapters"):
            test_state["chapter_id"] = data["chapters"][0].get("id")
        print(f"  Created course ID: {test_state['course_id']}")
        print(f"  Created chapter ID: {test_state['chapter_id']}")
    
    print_result("Create Course", success, response)
    return success


def test_list_courses():
    """Test: List all courses."""
    print("\n" + "="*60)
    print("Testing: GET /api/gpt/courses")
    print("="*60)
    
    response = make_request("GET", "/api/gpt/courses")
    success = response.status_code == 200 and "courses" in response.json()
    
    print_result("List Courses", success, response)
    return success


def test_list_courses_with_chapters():
    """Test: List courses with chapters included."""
    print("\n" + "="*60)
    print("Testing: GET /api/gpt/courses?includeChapters=true")
    print("="*60)
    
    response = make_request("GET", "/api/gpt/courses", params={"includeChapters": "true"})
    success = response.status_code == 200
    
    if success:
        data = response.json()
        if data.get("courses"):
            for course in data["courses"]:
                if "chapters" in course:
                    print(f"  Course '{course['title']}' has {len(course['chapters'])} chapters")
    
    print_result("List Courses with Chapters", success, response)
    return success


def test_get_course():
    """Test: Get a specific course."""
    print("\n" + "="*60)
    print(f"Testing: GET /api/gpt/courses/{test_state['course_id']}")
    print("="*60)
    
    if not test_state["course_id"]:
        print_result("Get Course", False, error="No course_id available from previous test")
        return False
    
    response = make_request("GET", f"/api/gpt/courses/{test_state['course_id']}")
    success = response.status_code == 200
    
    print_result("Get Course", success, response)
    return success


def test_update_course():
    """Test: Update a course."""
    print("\n" + "="*60)
    print(f"Testing: PUT /api/gpt/courses/{test_state['course_id']}")
    print("="*60)
    
    if not test_state["course_id"]:
        print_result("Update Course", False, error="No course_id available from previous test")
        return False
    
    payload = {
        "title": f"Updated Test Course - {datetime.now().isoformat()}",
        "description": "This course has been updated by the test script."
    }
    
    response = make_request("PUT", f"/api/gpt/courses/{test_state['course_id']}", json_data=payload)
    success = response.status_code == 200
    
    print_result("Update Course", success, response)
    return success


# ============================================================================
# CHAPTERS TESTS
# ============================================================================

def test_list_chapters():
    """Test: List chapters in a course."""
    print("\n" + "="*60)
    print(f"Testing: GET /api/gpt/courses/{test_state['course_id']}/chapters")
    print("="*60)
    
    if not test_state["course_id"]:
        print_result("List Chapters", False, error="No course_id available from previous test")
        return False
    
    response = make_request("GET", f"/api/gpt/courses/{test_state['course_id']}/chapters")
    success = response.status_code == 200
    
    if success:
        data = response.json()
        if data.get("chapters") and not test_state["chapter_id"]:
            test_state["chapter_id"] = data["chapters"][0].get("id")
    
    print_result("List Chapters", success, response)
    return success


def test_add_chapters():
    """Test: Add chapters to a course."""
    print("\n" + "="*60)
    print(f"Testing: POST /api/gpt/courses/{test_state['course_id']}/chapters")
    print("="*60)
    
    if not test_state["course_id"]:
        print_result("Add Chapters", False, error="No course_id available from previous test")
        return False
    
    payload = {
        "chapters": ["New Chapter 1", "New Chapter 2"]
    }
    
    response = make_request("POST", f"/api/gpt/courses/{test_state['course_id']}/chapters", json_data=payload)
    success = response.status_code == 201
    
    print_result("Add Chapters", success, response)
    return success


def test_get_chapter():
    """Test: Get a specific chapter."""
    print("\n" + "="*60)
    print(f"Testing: GET /api/gpt/chapters/{test_state['chapter_id']}")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("Get Chapter", False, error="No chapter_id available from previous test")
        return False
    
    response = make_request("GET", f"/api/gpt/chapters/{test_state['chapter_id']}")
    success = response.status_code == 200
    
    print_result("Get Chapter", success, response)
    return success


def test_update_chapter():
    """Test: Update a chapter."""
    print("\n" + "="*60)
    print(f"Testing: PUT /api/gpt/chapters/{test_state['chapter_id']}")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("Update Chapter", False, error="No chapter_id available from previous test")
        return False
    
    payload = {
        "title": f"Updated Chapter - {datetime.now().isoformat()}"
    }
    
    response = make_request("PUT", f"/api/gpt/chapters/{test_state['chapter_id']}", json_data=payload)
    success = response.status_code == 200
    
    print_result("Update Chapter", success, response)
    return success


def test_mark_chapter_complete():
    """Test: Mark chapter as complete."""
    print("\n" + "="*60)
    print(f"Testing: POST /api/gpt/chapters/{test_state['chapter_id']}/complete")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("Mark Chapter Complete", False, error="No chapter_id available from previous test")
        return False
    
    response = make_request("POST", f"/api/gpt/chapters/{test_state['chapter_id']}/complete")
    success = response.status_code == 200
    
    print_result("Mark Chapter Complete", success, response)
    return success


def test_reset_chapter_progress():
    """Test: Reset chapter progress."""
    print("\n" + "="*60)
    print(f"Testing: DELETE /api/gpt/chapters/{test_state['chapter_id']}/complete")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("Reset Chapter Progress", False, error="No chapter_id available from previous test")
        return False
    
    response = make_request("DELETE", f"/api/gpt/chapters/{test_state['chapter_id']}/complete")
    success = response.status_code == 200
    
    print_result("Reset Chapter Progress", success, response)
    return success


# ============================================================================
# NOTES TESTS
# ============================================================================

def test_create_note():
    """Test: Create a note."""
    print("\n" + "="*60)
    print("Testing: POST /api/gpt/notes")
    print("="*60)
    
    payload = {
        "content": f"This is a test note created at {datetime.now().isoformat()}",
        "courseId": test_state["course_id"],
        "chapterId": test_state["chapter_id"]
    }
    
    response = make_request("POST", "/api/gpt/notes", json_data=payload)
    success = response.status_code == 201
    
    if success:
        data = response.json()
        test_state["note_id"] = data.get("id")
        print(f"  Created note ID: {test_state['note_id']}")
    
    print_result("Create Note", success, response)
    return success


def test_list_notes():
    """Test: List notes."""
    print("\n" + "="*60)
    print("Testing: GET /api/gpt/notes")
    print("="*60)
    
    response = make_request("GET", "/api/gpt/notes")
    success = response.status_code == 200
    
    print_result("List Notes", success, response)
    return success


def test_get_note():
    """Test: Get a specific note."""
    print("\n" + "="*60)
    print(f"Testing: GET /api/gpt/notes/{test_state['note_id']}")
    print("="*60)
    
    if not test_state["note_id"]:
        print_result("Get Note", False, error="No note_id available from previous test")
        return False
    
    response = make_request("GET", f"/api/gpt/notes/{test_state['note_id']}")
    success = response.status_code == 200
    
    print_result("Get Note", success, response)
    return success


def test_update_note():
    """Test: Update a note."""
    print("\n" + "="*60)
    print(f"Testing: PUT /api/gpt/notes/{test_state['note_id']}")
    print("="*60)
    
    if not test_state["note_id"]:
        print_result("Update Note", False, error="No note_id available from previous test")
        return False
    
    payload = {
        "content": f"Updated note content at {datetime.now().isoformat()}"
    }
    
    response = make_request("PUT", f"/api/gpt/notes/{test_state['note_id']}", json_data=payload)
    success = response.status_code == 200
    
    print_result("Update Note", success, response)
    return success


# ============================================================================
# RESOURCES TESTS
# ============================================================================

def test_create_resource():
    """Test: Create a resource."""
    print("\n" + "="*60)
    print("Testing: POST /api/gpt/resources")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("Create Resource", False, error="No chapter_id available from previous test")
        return False
    
    payload = {
        "chapterId": test_state["chapter_id"],
        "name": "Test Resource - YouTube Video",
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    
    response = make_request("POST", "/api/gpt/resources", json_data=payload)
    success = response.status_code == 201
    
    if success:
        data = response.json()
        test_state["resource_id"] = data.get("id")
        print(f"  Created resource ID: {test_state['resource_id']}")
    
    print_result("Create Resource", success, response)
    return success


def test_list_resources():
    """Test: List resources for a chapter."""
    print("\n" + "="*60)
    print(f"Testing: GET /api/gpt/resources?chapterId={test_state['chapter_id']}")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("List Resources", False, error="No chapter_id available from previous test")
        return False
    
    response = make_request("GET", "/api/gpt/resources", params={"chapterId": test_state["chapter_id"]})
    success = response.status_code == 200
    
    print_result("List Resources", success, response)
    return success


def test_get_resource():
    """Test: Get a specific resource."""
    print("\n" + "="*60)
    print(f"Testing: GET /api/gpt/resources/{test_state['resource_id']}")
    print("="*60)
    
    if not test_state["resource_id"]:
        print_result("Get Resource", False, error="No resource_id available from previous test")
        return False
    
    response = make_request("GET", f"/api/gpt/resources/{test_state['resource_id']}")
    success = response.status_code == 200
    
    print_result("Get Resource", success, response)
    return success


# ============================================================================
# CLEANUP TESTS
# ============================================================================

def test_delete_resource():
    """Test: Delete a resource."""
    print("\n" + "="*60)
    print(f"Testing: DELETE /api/gpt/resources/{test_state['resource_id']}")
    print("="*60)
    
    if not test_state["resource_id"]:
        print_result("Delete Resource", False, error="No resource_id available from previous test")
        return False
    
    response = make_request("DELETE", f"/api/gpt/resources/{test_state['resource_id']}")
    success = response.status_code == 200
    
    print_result("Delete Resource", success, response)
    return success


def test_delete_note():
    """Test: Delete a note."""
    print("\n" + "="*60)
    print(f"Testing: DELETE /api/gpt/notes/{test_state['note_id']}")
    print("="*60)
    
    if not test_state["note_id"]:
        print_result("Delete Note", False, error="No note_id available from previous test")
        return False
    
    response = make_request("DELETE", f"/api/gpt/notes/{test_state['note_id']}")
    success = response.status_code == 200
    
    print_result("Delete Note", success, response)
    return success


def test_delete_chapter():
    """Test: Delete a chapter."""
    print("\n" + "="*60)
    print(f"Testing: DELETE /api/gpt/chapters/{test_state['chapter_id']}")
    print("="*60)
    
    if not test_state["chapter_id"]:
        print_result("Delete Chapter", False, error="No chapter_id available from previous test")
        return False
    
    response = make_request("DELETE", f"/api/gpt/chapters/{test_state['chapter_id']}")
    success = response.status_code == 200
    
    print_result("Delete Chapter", success, response)
    return success


def test_delete_course():
    """Test: Delete a course."""
    print("\n" + "="*60)
    print(f"Testing: DELETE /api/gpt/courses/{test_state['course_id']}")
    print("="*60)
    
    if not test_state["course_id"]:
        print_result("Delete Course", False, error="No course_id available from previous test")
        return False
    
    response = make_request("DELETE", f"/api/gpt/courses/{test_state['course_id']}")
    success = response.status_code == 200
    
    print_result("Delete Course", success, response)
    return success


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all tests and print summary."""
    print("\n" + "="*60)
    print("SelfOS OpenAPI Test Suite")
    print(f"Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:20]}...")
    print("="*60)
    
    results = {}
    
    # Schema test
    results["OpenAPI Schema"] = test_get_openapi_schema()
    
    # Course tests
    results["Create Course"] = test_create_course()
    results["List Courses"] = test_list_courses()
    results["List Courses with Chapters"] = test_list_courses_with_chapters()
    results["Get Course"] = test_get_course()
    results["Update Course"] = test_update_course()
    
    # Chapter tests
    results["List Chapters"] = test_list_chapters()
    results["Add Chapters"] = test_add_chapters()
    results["Get Chapter"] = test_get_chapter()
    results["Update Chapter"] = test_update_chapter()
    results["Mark Chapter Complete"] = test_mark_chapter_complete()
    results["Reset Chapter Progress"] = test_reset_chapter_progress()
    
    # Note tests
    results["Create Note"] = test_create_note()
    results["List Notes"] = test_list_notes()
    results["Get Note"] = test_get_note()
    results["Update Note"] = test_update_note()
    
    # Resource tests
    results["Create Resource"] = test_create_resource()
    results["List Resources"] = test_list_resources()
    results["Get Resource"] = test_get_resource()
    
    # Cleanup tests
    results["Delete Resource"] = test_delete_resource()
    results["Delete Note"] = test_delete_note()
    results["Delete Chapter"] = test_delete_chapter()
    results["Delete Course"] = test_delete_course()
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {test_name}")
    
    print("\n" + "-"*60)
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")
    print("="*60)
    
    return failed == 0


if __name__ == "__main__":
    import sys
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
