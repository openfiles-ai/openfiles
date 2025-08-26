"""
Comprehensive tests for OpenFilesTools - Tools module

Following the same test structure as TypeScript SDK
"""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from openfiles_ai.core import OpenFilesClient
from openfiles_ai.core.generated.models import (
    FileMetadata,
)
from openfiles_ai.tools import OpenFilesTools
from openfiles_ai.tools.tools import ProcessedToolCalls, ToolCall, ToolDefinition, ToolResult


class TestToolDefinition:
    """Test ToolDefinition class"""

    def test_create_tool_definition(self):
        """Should create a valid tool definition"""
        definition = ToolDefinition(
            name="test_tool",
            description="Test tool description",
            parameters={
                "type": "object",
                "properties": {"arg1": {"type": "string"}},
                "required": ["arg1"],
            },
        )

        result = definition.to_dict()
        assert result["type"] == "function"
        assert result["function"]["name"] == "test_tool"
        assert result["function"]["description"] == "Test tool description"
        assert result["function"]["strict"] is True
        assert result["function"]["parameters"]["type"] == "object"


class TestToolResult:
    """Test ToolResult class"""

    def test_create_successful_result(self):
        """Should create successful tool result"""
        result = ToolResult(
            tool_call_id="call-123",
            function="test_function",
            status="success",
            data={"result": "success"},
            args={"input": "test"},
        )

        assert result.tool_call_id == "call-123"
        assert result.function == "test_function"
        assert result.status == "success"
        assert result.data == {"result": "success"}
        assert result.args == {"input": "test"}

    def test_create_error_result(self):
        """Should create error tool result"""
        result = ToolResult(
            tool_call_id="call-456", function="test_function", status="error", error="Test error"
        )

        assert result.tool_call_id == "call-456"
        assert result.status == "error"
        assert result.error == "Test error"


class TestProcessedToolCalls:
    """Test ProcessedToolCalls class"""

    def test_create_with_successful_results(self):
        """Should create processed tool calls with success messages"""
        results = [
            ToolResult(
                tool_call_id="call-123",
                function="write_file",
                status="success",
                data={"id": "file-123", "path": "test.txt"},
            )
        ]

        processed = ProcessedToolCalls(handled=True, results=results)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert len(processed.tool_messages) == 1

        message = processed.tool_messages[0]
        assert message["role"] == "tool"
        assert message["tool_call_id"] == "call-123"

        content = json.loads(message["content"])
        assert content["success"] is True
        assert content["operation"] == "write_file"

    def test_create_with_error_results(self):
        """Should create processed tool calls with error messages"""
        results = [
            ToolResult(
                tool_call_id="call-456", function="read_file", status="error", error="File not found"
            )
        ]

        processed = ProcessedToolCalls(handled=True, results=results)

        message = processed.tool_messages[0]
        content = json.loads(message["content"])
        assert content["success"] is False
        assert content["error"]["code"] == "EXECUTION_ERROR"
        assert content["error"]["message"] == "File not found"


class TestOpenFilesTools:
    """Test OpenFilesTools class"""

    @pytest.fixture
    def mock_client(self):
        """Create a mock OpenFilesClient"""
        client = AsyncMock(spec=OpenFilesClient)
        client.write_file = AsyncMock()
        client.read_file = AsyncMock()
        client.edit_file = AsyncMock()
        client.list_files = AsyncMock()
        client.append_file = AsyncMock()
        client.overwrite_file = AsyncMock()
        client.get_metadata = AsyncMock()
        client.get_versions = AsyncMock()
        return client

    @pytest.fixture
    def tools(self, mock_client):
        """Create OpenFilesTools instance"""
        return OpenFilesTools(mock_client)

    @pytest.fixture
    def sample_file_metadata(self):
        """Sample file metadata for testing"""
        return FileMetadata(
            id="550e8400-e29b-41d4-a716-446655440000",
            path="test.txt",
            version=1,
            contentType="text/plain",
            sizeBytes=11,
            createdAt="2025-01-01T00:00:00Z",
            updatedAt="2025-01-01T00:00:00Z",
        )

    def test_constructor(self, mock_client):
        """Should create tools instance with client"""
        tools = OpenFilesTools(mock_client)
        assert tools.client == mock_client
        assert tools.base_path is None

    def test_constructor_with_base_path(self, mock_client):
        """Should create tools instance with base path"""
        tools = OpenFilesTools(mock_client, "projects/website")
        assert tools.client == mock_client
        assert tools.base_path == "projects/website"

    def test_with_base_path(self, mock_client):
        """Should create new instance with base path"""
        tools = OpenFilesTools(mock_client)
        project_tools = tools.with_base_path("projects/website")

        assert project_tools.client == mock_client
        assert project_tools.base_path == "projects/website"
        # Original instance should be unchanged
        assert tools.base_path is None

    def test_definitions_structure(self, tools):
        """Should return OpenAI-compatible tool definitions"""
        definitions = tools.definitions

        assert len(definitions) == 8
        assert definitions[0].function["name"] == "write_file"
        assert definitions[1].function["name"] == "read_file"
        assert definitions[2].function["name"] == "edit_file"
        assert definitions[3].function["name"] == "list_files"
        assert definitions[4].function["name"] == "append_to_file"
        assert definitions[5].function["name"] == "overwrite_file"
        assert definitions[6].function["name"] == "get_file_metadata"
        assert definitions[7].function["name"] == "get_file_versions"

        # Check structure of each definition
        for definition in definitions:
            tool_dict = definition.to_dict()
            assert tool_dict["type"] == "function"
            assert "name" in tool_dict["function"]
            assert "description" in tool_dict["function"]
            assert "parameters" in tool_dict["function"]
            assert tool_dict["function"]["parameters"]["type"] == "object"
            assert "properties" in tool_dict["function"]["parameters"]
            assert "required" in tool_dict["function"]["parameters"]

    def test_is_openfiles_tool(self, tools):
        """Should identify OpenFiles tools correctly"""
        assert tools._is_openfiles_tool("write_file") is True
        assert tools._is_openfiles_tool("read_file") is True
        assert tools._is_openfiles_tool("edit_file") is True
        assert tools._is_openfiles_tool("list_files") is True
        assert tools._is_openfiles_tool("append_to_file") is True
        assert tools._is_openfiles_tool("overwrite_file") is True
        assert tools._is_openfiles_tool("get_file_metadata") is True
        assert tools._is_openfiles_tool("get_file_versions") is True

    def test_is_not_openfiles_tool(self, tools):
        """Should reject non-OpenFiles tools"""
        assert tools._is_openfiles_tool("some_other_tool") is False
        assert tools._is_openfiles_tool("get_weather") is False
        assert tools._is_openfiles_tool("") is False
        assert tools._is_openfiles_tool("invalid_tool") is False

    @pytest.mark.asyncio
    async def test_execute_write_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute write_file tool correctly"""
        mock_client.write_file.return_value = sample_file_metadata

        tool_call = ToolCall(
            id="call-123",
            function_name="write_file",
            arguments=json.dumps(
                {"path": "test.txt", "content": "Hello World", "contentType": "text/plain"}
            ),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.write_file.assert_called_once_with(
            path="test.txt", content="Hello World", content_type="text/plain", base_path=None
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_execute_read_file_tool(self, tools, mock_client):
        """Should execute read_file tool correctly"""
        mock_content_response = MagicMock()
        mock_content_response.data.content = "File content"
        mock_client.read_file.return_value = mock_content_response

        tool_call = ToolCall(
            id="call-123",
            function_name="read_file",
            arguments=json.dumps({"path": "test.txt", "version": 0}),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.read_file.assert_called_once_with(path="test.txt", version=None, base_path=None)
        assert result == {"path": "test.txt", "content": "File content", "version": 0}

    @pytest.mark.asyncio
    async def test_execute_read_file_with_version(self, tools, mock_client):
        """Should execute read_file tool with specific version"""
        mock_content_response = MagicMock()
        mock_content_response.data.content = "File content v2"
        mock_client.read_file.return_value = mock_content_response

        tool_call = ToolCall(
            id="call-123",
            function_name="read_file",
            arguments=json.dumps({"path": "test.txt", "version": 2}),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.read_file.assert_called_once_with(path="test.txt", version=2, base_path=None)
        assert result["version"] == 2

    @pytest.mark.asyncio
    async def test_execute_edit_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute edit_file tool correctly"""
        mock_client.edit_file.return_value = sample_file_metadata

        tool_call = ToolCall(
            id="call-123",
            function_name="edit_file",
            arguments=json.dumps(
                {"path": "test.txt", "oldString": "Hello", "newString": "Hi"}
            ),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.edit_file.assert_called_once_with(
            path="test.txt", old_string="Hello", new_string="Hi", base_path=None
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_execute_list_files_tool(self, tools, mock_client):
        """Should execute list_files tool correctly"""
        mock_list_response = MagicMock()
        mock_client.list_files.return_value = mock_list_response

        tool_call = ToolCall(
            id="call-123",
            function_name="list_files",
            arguments=json.dumps({"directory": "docs/", "limit": 20}),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.list_files.assert_called_once_with(
            directory="docs/", limit=20, base_path=None
        )
        assert result == mock_list_response

    @pytest.mark.asyncio
    async def test_execute_append_to_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute append_to_file tool correctly"""
        mock_client.append_file.return_value = sample_file_metadata

        tool_call = ToolCall(
            id="call-123",
            function_name="append_to_file",
            arguments=json.dumps({"path": "log.txt", "content": "\nNew log entry"}),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.append_file.assert_called_once_with(
            path="log.txt", content="\nNew log entry", base_path=None
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_execute_overwrite_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute overwrite_file tool correctly"""
        mock_client.overwrite_file.return_value = sample_file_metadata

        tool_call = ToolCall(
            id="call-123",
            function_name="overwrite_file",
            arguments=json.dumps(
                {"path": "config.json", "content": '{"new": "config"}', "isBase64": False}
            ),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.overwrite_file.assert_called_once_with(
            path="config.json", content='{"new": "config"}', is_base64=False, base_path=None
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_execute_get_file_metadata_tool(self, tools, mock_client):
        """Should execute get_file_metadata tool correctly"""
        mock_metadata_response = MagicMock()
        mock_client.get_metadata.return_value = mock_metadata_response

        tool_call = ToolCall(
            id="call-123",
            function_name="get_file_metadata",
            arguments=json.dumps({"path": "test.txt", "version": 0}),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.get_metadata.assert_called_once_with(
            path="test.txt", version=None, base_path=None
        )
        assert result == mock_metadata_response

    @pytest.mark.asyncio
    async def test_execute_get_file_versions_tool(self, tools, mock_client):
        """Should execute get_file_versions tool correctly"""
        mock_versions_response = MagicMock()
        mock_client.get_versions.return_value = mock_versions_response

        tool_call = ToolCall(
            id="call-123",
            function_name="get_file_versions",
            arguments=json.dumps({"path": "test.txt", "limit": 10, "offset": 0}),
        )

        result = await tools._execute_tool(tool_call)

        mock_client.get_versions.assert_called_once_with(
            path="test.txt", limit=10, offset=0, base_path=None
        )
        assert result == mock_versions_response

    @pytest.mark.asyncio
    async def test_execute_tool_with_base_path(self, mock_client, sample_file_metadata):
        """Should execute tools with base path"""
        tools = OpenFilesTools(mock_client, "projects/website")
        mock_client.write_file.return_value = sample_file_metadata

        tool_call = ToolCall(
            id="call-123",
            function_name="write_file",
            arguments=json.dumps(
                {"path": "index.html", "content": "<html></html>", "contentType": "text/html"}
            ),
        )

        await tools._execute_tool(tool_call)

        mock_client.write_file.assert_called_once_with(
            path="index.html",
            content="<html></html>",
            content_type="text/html",
            base_path="projects/website",
        )

    @pytest.mark.asyncio
    async def test_execute_unknown_tool(self, tools):
        """Should raise error for unknown tool"""
        tool_call = ToolCall(
            id="call-123", function_name="unknown_tool", arguments=json.dumps({"arg": "value"})
        )

        with pytest.raises(ValueError) as exc:
            await tools._execute_tool(tool_call)

        assert "Unknown tool: unknown_tool" in str(exc.value)

    @pytest.mark.asyncio
    async def test_process_tool_calls_openai_response(self, tools, mock_client, sample_file_metadata):
        """Should process OpenAI response with tool calls"""
        mock_client.write_file.return_value = sample_file_metadata

        # Mock OpenAI response structure
        mock_response = {
            "choices": [
                {
                    "message": {
                        "tool_calls": [
                            {
                                "id": "call-123",
                                "function": {
                                    "name": "write_file",
                                    "arguments": json.dumps({
                                        "path": "test.txt",
                                        "content": "Hello World",
                                        "contentType": "text/plain",
                                    }),
                                },
                            }
                        ]
                    }
                }
            ]
        }

        processed = await tools.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert processed.results[0].status == "success"
        assert processed.results[0].function == "write_file"
        assert len(processed.tool_messages) == 1

        # Verify client was called
        mock_client.write_file.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_tool_calls_with_error(self, tools, mock_client):
        """Should handle tool execution errors"""
        mock_client.read_file.side_effect = Exception("File not found")

        mock_response = {
            "choices": [
                {
                    "message": {
                        "tool_calls": [
                            {
                                "id": "call-456",
                                "function": {
                                    "name": "read_file",
                                    "arguments": json.dumps({"path": "missing.txt", "version": 0}),
                                },
                            }
                        ]
                    }
                }
            ]
        }

        processed = await tools.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert processed.results[0].status == "error"
        assert processed.results[0].error == "File not found"

    @pytest.mark.asyncio
    async def test_process_tool_calls_ignores_non_openfiles_tools(self, tools, mock_client):
        """Should ignore non-OpenFiles tools"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "tool_calls": [
                            {
                                "id": "call-weather",
                                "function": {
                                    "name": "get_weather",
                                    "arguments": json.dumps({"city": "New York"}),
                                },
                            }
                        ]
                    }
                }
            ]
        }

        processed = await tools.process_tool_calls(mock_response)

        assert processed.handled is False
        assert len(processed.results) == 0
        assert len(processed.tool_messages) == 0

        # No client methods should be called
        assert not any(method.called for method in [
            mock_client.write_file,
            mock_client.read_file,
            mock_client.edit_file,
            mock_client.list_files,
        ])

    @pytest.mark.asyncio
    async def test_process_tool_calls_mixed_tools(self, tools, mock_client, sample_file_metadata):
        """Should process only OpenFiles tools in mixed response"""
        mock_client.write_file.return_value = sample_file_metadata

        mock_response = {
            "choices": [
                {
                    "message": {
                        "tool_calls": [
                            {
                                "id": "call-weather",
                                "function": {
                                    "name": "get_weather",
                                    "arguments": json.dumps({"city": "New York"}),
                                },
                            },
                            {
                                "id": "call-write",
                                "function": {
                                    "name": "write_file",
                                    "arguments": json.dumps({
                                        "path": "test.txt",
                                        "content": "Hello",
                                        "contentType": "text/plain",
                                    }),
                                },
                            },
                        ]
                    }
                }
            ]
        }

        processed = await tools.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1  # Only OpenFiles tool processed
        assert processed.results[0].tool_call_id == "call-write"
        assert processed.results[0].function == "write_file"

    @pytest.mark.asyncio
    async def test_process_tool_calls_empty_response(self, tools):
        """Should handle empty response gracefully"""
        mock_response = {"choices": []}

        processed = await tools.process_tool_calls(mock_response)

        assert processed.handled is False
        assert len(processed.results) == 0
        assert len(processed.tool_messages) == 0

    @pytest.mark.asyncio
    async def test_process_tool_calls_object_style_response(self, tools, mock_client, sample_file_metadata):
        """Should handle object-style response (like from OpenAI SDK)"""
        mock_client.write_file.return_value = sample_file_metadata

        # Mock object with attributes (like OpenAI SDK response)
        mock_tool_call = MagicMock()
        mock_tool_call.id = "call-123"
        mock_tool_call.function.name = "write_file"
        mock_tool_call.function.arguments = json.dumps({
            "path": "test.txt",
            "content": "Hello World",
            "contentType": "text/plain",
        })

        mock_message = MagicMock()
        mock_message.tool_calls = [mock_tool_call]

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        processed = await tools.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert processed.results[0].status == "success"
        mock_client.write_file.assert_called_once()