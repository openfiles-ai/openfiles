"""
Shared test fixtures for OpenFiles SDK
"""

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest


@pytest.fixture
def valid_api_key():
    """Valid OpenFiles API key for testing"""
    return "oa_test123456789012345678901234567890"


@pytest.fixture
def invalid_api_key():
    """Invalid API key format for testing"""
    return "invalid_key_format"


@pytest.fixture
def mock_httpx_response():
    """Mock httpx response"""
    response = MagicMock(spec=httpx.Response)
    response.status_code = 200
    response.json.return_value = {
        "success": True,
        "data": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "path": "test.txt",
            "version": 1,
            "contentType": "text/plain",
            "sizeBytes": 11,
            "createdAt": "2025-01-01T00:00:00Z",
            "updatedAt": "2025-01-01T00:00:00Z"
        },
        "operation": "write_file",
        "message": "File created successfully"
    }
    response.raise_for_status = MagicMock()
    return response


@pytest.fixture
def mock_httpx_client():
    """Mock httpx AsyncClient"""
    client = AsyncMock(spec=httpx.AsyncClient)
    
    # Create a mock response for each method
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "success": True,
        "data": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "path": "test.txt",
            "version": 1,
            "contentType": "text/plain",
            "sizeBytes": 11,
            "createdAt": "2025-01-01T00:00:00Z",
            "updatedAt": "2025-01-01T00:00:00Z"
        }
    }
    
    client.post.return_value = mock_response
    client.get.return_value = mock_response
    client.put.return_value = mock_response
    client.patch.return_value = mock_response
    client.delete.return_value = mock_response
    client.aclose = AsyncMock()
    return client


@pytest.fixture
def sample_file_metadata():
    """Sample file metadata for testing"""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",  # Valid UUID
        "path": "test.txt",
        "version": 1,
        "contentType": "text/plain",
        "sizeBytes": 11,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_file_content_response():
    """Sample file content response for testing"""
    return {
        "success": True,
        "data": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "path": "test.txt",
            "content": "Hello World",
            "version": 1,
            "mimeType": "text/plain",
            "size": 11,
            "createdAt": "2025-01-01T00:00:00Z",
            "updatedAt": "2025-01-01T00:00:00Z"
        },
        "operation": "read_file",
        "message": "File read successfully"
    }


@pytest.fixture
def sample_file_list_response():
    """Sample file list response for testing"""
    return {
        "success": True,
        "data": {
            "files": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "path": "test.txt",
                    "version": 1,
                    "contentType": "text/plain",
                    "sizeBytes": 11,
                    "createdAt": "2025-01-01T00:00:00Z",
                    "updatedAt": "2025-01-01T00:00:00Z"
                }
            ],
            "total": 1,
            "limit": 10,
            "offset": 0
        },
        "operation": "list_files",
        "message": "Files listed successfully"
    }


@pytest.fixture
def mock_error_response():
    """Mock error response"""
    response = MagicMock(spec=httpx.Response)
    response.status_code = 404
    response.json.return_value = {
        "success": False,
        "error": {
            "code": "FILE_NOT_FOUND",
            "message": "File not found"
        },
        "operation": "read_file"
    }
    response.raise_for_status = MagicMock()
    return response