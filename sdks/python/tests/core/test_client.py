"""
Comprehensive tests for OpenFilesClient - Core module

Following the same test structure as TypeScript SDK with 40+ test cases
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from openfiles_ai.core import OpenFilesClient
from openfiles_ai.core.exceptions import (
    APIKeyError,
    AuthenticationError,
    FileNotFoundError,
    NetworkError,
    RateLimitError,
    ValidationError,
)
from openfiles_ai.core.generated.models import ContentType


class TestOpenFilesClientConstructor:
    """Test OpenFilesClient constructor and initialization"""
    
    def test_create_client_with_valid_api_key(self, valid_api_key):
        """Should create client with valid API key"""
        client = OpenFilesClient(api_key=valid_api_key)
        assert isinstance(client, OpenFilesClient)
        assert client.api_key == valid_api_key
    
    def test_reject_invalid_api_key_format(self, invalid_api_key):
        """Should reject invalid API key format"""
        with pytest.raises(APIKeyError) as exc:
            OpenFilesClient(api_key=invalid_api_key)
        assert 'Invalid API key format' in str(exc.value)
    
    def test_use_default_base_url(self, valid_api_key):
        """Should use default base URL"""
        client = OpenFilesClient(api_key=valid_api_key)
        assert client.base_url == "https://api.openfiles.ai/functions/v1/api"
    
    def test_use_custom_base_url(self, valid_api_key):
        """Should use custom base URL"""
        custom_url = "http://localhost:3000"
        client = OpenFilesClient(
            api_key=valid_api_key,
            base_url=custom_url
        )
        assert client.base_url == custom_url
    
    def test_use_default_timeout(self, valid_api_key):
        """Should use default timeout"""
        client = OpenFilesClient(api_key=valid_api_key)
        assert client.timeout == 30.0
    
    def test_use_custom_timeout(self, valid_api_key):
        """Should use custom timeout"""
        client = OpenFilesClient(
            api_key=valid_api_key,
            timeout=60.0
        )
        assert client.timeout == 60.0
    
    def test_use_base_path(self, valid_api_key):
        """Should store base path for operations"""
        client = OpenFilesClient(
            api_key=valid_api_key,
            base_path="projects/website"
        )
        assert client.base_path == "projects/website"


class TestOpenFilesClientWriteFile:
    """Test write_file method"""
    
    @pytest.mark.asyncio
    async def test_write_file_successfully(
        self, 
        valid_api_key, 
        mock_httpx_client, 
        sample_file_metadata
    ):
        """Should write file successfully"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.post.return_value.json.return_value = {
                "success": True,
                "data": sample_file_metadata
            }
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.write_file(
                path="test.txt",
                content="Hello World"
            )
            
            assert result.path == "test.txt"
            assert result.version == 1
            mock_httpx_client.post.assert_called_once()
            
            # Check the request payload
            call_args = mock_httpx_client.post.call_args
            assert call_args[0][0] == "/files"  # URL
            request_json = call_args[1]["json"]
            assert request_json["path"] == "test.txt"
            assert request_json["content"] == "Hello World"
    
    @pytest.mark.asyncio
    async def test_write_file_with_base_path(self, valid_api_key, mock_httpx_client):
        """Should write file with base path prefix"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            client = OpenFilesClient(
                api_key=valid_api_key,
                base_path="projects/website"
            )
            
            await client.write_file(
                path="config.json",
                content='{"name": "test"}'
            )
            
            # Check that path was prefixed with base path
            call_args = mock_httpx_client.post.call_args
            request_json = call_args[1]["json"]
            assert request_json["path"] == "projects/website/config.json"
    
    @pytest.mark.asyncio
    async def test_write_file_with_operation_base_path(self, valid_api_key, mock_httpx_client):
        """Should use operation base path over client base path"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            client = OpenFilesClient(
                api_key=valid_api_key,
                base_path="default"
            )
            
            await client.write_file(
                path="config.json",
                content='{"name": "test"}',
                base_path="override"
            )
            
            call_args = mock_httpx_client.post.call_args
            request_json = call_args[1]["json"]
            assert request_json["path"] == "override/config.json"
    
    @pytest.mark.asyncio
    async def test_write_binary_file(self, valid_api_key, mock_httpx_client):
        """Should write binary file with base64 encoding"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            client = OpenFilesClient(api_key=valid_api_key)
            
            await client.write_file(
                path="image.png",
                content="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAIG",
                content_type=ContentType.image_png,
                is_base64=True
            )
            
            call_args = mock_httpx_client.post.call_args
            request_json = call_args[1]["json"]
            # The contentType is serialized as a string by model_dump
            assert request_json["contentType"] == "image/png"
            assert request_json["isBase64"] is True
    
    @pytest.mark.asyncio
    async def test_write_file_network_error(self, valid_api_key):
        """Should handle network errors during write"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.side_effect = httpx.RequestError("Connection failed")
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            
            with pytest.raises(NetworkError) as exc:
                await client.write_file(
                    path="test.txt",
                    content="Hello World"
                )
            
            assert "Network error during write_file" in str(exc.value)


class TestOpenFilesClientReadFile:
    """Test read_file method"""
    
    @pytest.mark.asyncio
    async def test_read_file_latest_version(
        self, 
        valid_api_key, 
        mock_httpx_client,
        sample_file_content_response
    ):
        """Should read latest version of file"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = sample_file_content_response
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.read_file("test.txt")
            
            assert result.success is True
            assert result.data.content == "Hello World"
            
            call_args = mock_httpx_client.get.call_args
            assert call_args[0][0] == "/files/test.txt"
            assert "version" not in call_args[1].get("params", {})
    
    @pytest.mark.asyncio
    async def test_read_file_specific_version(self, valid_api_key, mock_httpx_client, sample_file_content_response):
        """Should read specific version of file"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = sample_file_content_response
            
            client = OpenFilesClient(api_key=valid_api_key)
            await client.read_file("test.txt", version=2)
            
            call_args = mock_httpx_client.get.call_args
            params = call_args[1]["params"]
            assert params["version"] == "2"
    
    @pytest.mark.asyncio
    async def test_read_nonexistent_file(self, valid_api_key):
        """Should handle reading nonexistent file"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 404
            mock_client.get.return_value = mock_response
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            
            with pytest.raises(FileNotFoundError) as exc:
                await client.read_file("nonexistent.txt")
            
            assert "nonexistent.txt" in str(exc.value)


class TestOpenFilesClientEditFile:
    """Test edit_file method"""
    
    @pytest.mark.asyncio
    async def test_edit_file_successfully(
        self, 
        valid_api_key, 
        mock_httpx_client,
        sample_file_metadata
    ):
        """Should edit file with find and replace"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.put.return_value.json.return_value = {
                "success": True,
                "data": sample_file_metadata
            }
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.edit_file(
                path="test.txt",
                old_string="Hello",
                new_string="Hi"
            )
            
            assert result.path == "test.txt"
            mock_httpx_client.put.assert_called_once()
            
            call_args = mock_httpx_client.put.call_args
            assert call_args[0][0] == "/files/edit/test.txt"
            request_json = call_args[1]["json"]
            assert request_json["oldString"] == "Hello"
            assert request_json["newString"] == "Hi"
    
    @pytest.mark.asyncio
    async def test_edit_file_string_not_found(self, valid_api_key):
        """Should handle edit when string not found"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 400
            mock_response.json.return_value = {
                "error": {"message": "String not found in file"}
            }
            mock_client.put.return_value = mock_response
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            
            with pytest.raises(ValidationError) as exc:
                await client.edit_file(
                    path="test.txt",
                    old_string="NotFound",
                    new_string="Replacement"
                )
            
            # The error message should contain some indication of the problem
            assert "error" in str(exc.value).lower()


class TestOpenFilesClientListFiles:
    """Test list_files method"""
    
    @pytest.mark.asyncio
    async def test_list_files_in_directory(
        self, 
        valid_api_key, 
        mock_httpx_client,
        sample_file_list_response
    ):
        """Should list files in directory"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = sample_file_list_response
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.list_files("docs/", limit=5)
            
            assert result.success is True
            assert len(result.data.files) == 1
            assert result.data.files[0].path == "test.txt"
            
            call_args = mock_httpx_client.get.call_args
            params = call_args[1]["params"]
            assert params["directory"] == "docs"
            assert params["limit"] == "5"
    
    @pytest.mark.asyncio
    async def test_list_files_root_directory(self, valid_api_key, mock_httpx_client, sample_file_list_response):
        """Should list files in root directory"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = sample_file_list_response
            
            client = OpenFilesClient(api_key=valid_api_key)
            await client.list_files("")
            
            call_args = mock_httpx_client.get.call_args
            params = call_args[1]["params"]
            assert params["directory"] == ""
    
    @pytest.mark.asyncio
    async def test_list_files_with_pagination(self, valid_api_key, mock_httpx_client, sample_file_list_response):
        """Should support pagination parameters"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = sample_file_list_response
            
            client = OpenFilesClient(api_key=valid_api_key)
            await client.list_files("docs/", limit=20, offset=10)
            
            call_args = mock_httpx_client.get.call_args
            params = call_args[1]["params"]
            assert params["limit"] == "20"
            assert params["offset"] == "10"


class TestOpenFilesClientAppendFile:
    """Test append_file method"""
    
    @pytest.mark.asyncio
    async def test_append_file_successfully(
        self, 
        valid_api_key, 
        mock_httpx_client,
        sample_file_metadata
    ):
        """Should append content to existing file"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.put.return_value.json.return_value = {
                "success": True,
                "data": sample_file_metadata
            }
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.append_file(
                path="log.txt",
                content="\nNew log entry"
            )
            
            assert result.path == "test.txt"
            
            call_args = mock_httpx_client.put.call_args
            assert call_args[0][0] == "/files/append/log.txt"
            request_json = call_args[1]["json"]
            assert request_json["content"] == "\nNew log entry"


class TestOpenFilesClientOverwriteFile:
    """Test overwrite_file method"""
    
    @pytest.mark.asyncio
    async def test_overwrite_file_successfully(
        self, 
        valid_api_key, 
        mock_httpx_client,
        sample_file_metadata
    ):
        """Should overwrite entire file content"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.put.return_value.json.return_value = {
                "success": True,
                "data": sample_file_metadata
            }
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.overwrite_file(
                path="config.json",
                content='{"new": "config"}'
            )
            
            assert result.path == "test.txt"
            
            call_args = mock_httpx_client.put.call_args
            assert call_args[0][0] == "/files/overwrite/config.json"
            request_json = call_args[1]["json"]
            assert request_json["content"] == '{"new": "config"}'
            assert request_json["isBase64"] is False


class TestOpenFilesClientMetadata:
    """Test metadata and versions methods"""
    
    @pytest.mark.asyncio
    async def test_get_metadata_successfully(self, valid_api_key, mock_httpx_client):
        """Should get file metadata without content"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = {
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
                "operation": "get_metadata",
                "message": "Metadata retrieved"
            }
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.get_metadata("test.txt")
            
            assert result.success is True
            
            call_args = mock_httpx_client.get.call_args
            params = call_args[1]["params"]
            assert params["metadata"] == "true"
    
    @pytest.mark.asyncio
    async def test_get_versions_successfully(self, valid_api_key, mock_httpx_client):
        """Should get file version history"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            mock_httpx_client.get.return_value.json.return_value = {
                "success": True,
                "data": {
                    "file": {"path": "test.txt"},
                    "versions": [{"version": 1, "size": 11}],
                    "total": 1,
                    "limit": 10,
                    "offset": 0
                },
                "operation": "get_versions",
                "message": "Versions retrieved"
            }
            
            client = OpenFilesClient(api_key=valid_api_key)
            result = await client.get_versions("test.txt")
            
            assert result.success is True
            assert len(result.data.versions) == 1
            
            call_args = mock_httpx_client.get.call_args
            params = call_args[1]["params"]
            assert params["versions"] == "true"


class TestOpenFilesClientErrorHandling:
    """Test error handling scenarios"""
    
    @pytest.mark.asyncio
    async def test_handle_authentication_error(self, valid_api_key):
        """Should handle authentication errors"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 401
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            
            with pytest.raises(AuthenticationError):
                await client.write_file("test.txt", "content")
    
    @pytest.mark.asyncio
    async def test_handle_rate_limit_error(self, valid_api_key):
        """Should handle rate limit errors"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 429
            mock_response.headers = {"Retry-After": "60"}
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            
            with pytest.raises(RateLimitError) as exc:
                await client.write_file("test.txt", "content")
            
            assert exc.value.retry_after == 60
    
    @pytest.mark.asyncio
    async def test_handle_server_error(self, valid_api_key):
        """Should handle server errors (5xx)"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_client.post.return_value = mock_response
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            
            with pytest.raises(Exception) as exc:  # Could be FileOperationError or NetworkError
                await client.write_file("test.txt", "content")
            
            assert "500" in str(exc.value)


class TestOpenFilesClientContextManager:
    """Test async context manager functionality"""
    
    @pytest.mark.asyncio
    async def test_context_manager_usage(self, valid_api_key):
        """Should work as async context manager"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client
            
            async with OpenFilesClient(api_key=valid_api_key) as client:
                assert isinstance(client, OpenFilesClient)
            
            # Verify client was closed
            mock_client.aclose.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_manual_close(self, valid_api_key):
        """Should support manual close"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client
            
            client = OpenFilesClient(api_key=valid_api_key)
            await client.close()
            
            mock_client.aclose.assert_called_once()


class TestOpenFilesClientPathResolution:
    """Test path resolution with base paths"""
    
    def test_resolve_path_with_base_path(self, valid_api_key):
        """Should resolve paths with base path"""
        client = OpenFilesClient(
            api_key=valid_api_key,
            base_path="projects/website"
        )
        
        # Path resolution is tested implicitly in other tests
        assert client.base_path == "projects/website"
    
    @pytest.mark.asyncio
    async def test_handle_leading_slashes(self, valid_api_key, mock_httpx_client):
        """Should handle leading slashes properly in paths"""
        with patch('httpx.AsyncClient', return_value=mock_httpx_client):
            client = OpenFilesClient(api_key=valid_api_key)
            
            await client.write_file(
                path="/test.txt",  # Leading slash should be handled
                content="Hello World"
            )
            
            call_args = mock_httpx_client.post.call_args
            request_json = call_args[1]["json"]
            # Path should be normalized (no leading slash)
            assert request_json["path"] == "test.txt"