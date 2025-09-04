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
from openfiles_ai.tools.tools import ProcessedToolCalls, AnthropicProcessedToolCalls, ToolCall, ToolDefinition, ToolResult


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

    def test_openai_definitions_structure(self, tools):
        """Should return OpenAI-compatible tool definitions"""
        definitions = tools.openai.definitions

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

    def test_anthropic_definitions_structure(self, tools):
        """Should return Anthropic-compatible tool definitions"""
        definitions = tools.anthropic.definitions

        assert len(definitions) == 8
        assert definitions[0]["name"] == "write_file"
        assert definitions[1]["name"] == "read_file"
        assert definitions[2]["name"] == "edit_file"
        assert definitions[3]["name"] == "list_files"
        assert definitions[4]["name"] == "append_to_file"
        assert definitions[5]["name"] == "overwrite_file"
        assert definitions[6]["name"] == "get_file_metadata"
        assert definitions[7]["name"] == "get_file_versions"

        # Check Anthropic structure (flat with input_schema)
        for definition in definitions:
            assert "name" in definition
            assert "description" in definition
            assert "input_schema" in definition
            assert definition["input_schema"]["type"] == "object"
            assert "properties" in definition["input_schema"]
            assert "required" in definition["input_schema"]

    def test_openai_provider_has_correct_structure(self, tools):
        """Should have openai provider with correct methods"""
        assert hasattr(tools, 'openai')
        assert hasattr(tools.openai, 'definitions')
        assert hasattr(tools.openai, 'process_tool_calls')
        assert hasattr(tools.openai, '_is_openfiles_tool')

    def test_anthropic_provider_has_correct_structure(self, tools):
        """Should have anthropic provider with correct methods"""
        assert hasattr(tools, 'anthropic')
        assert hasattr(tools.anthropic, 'definitions')
        assert hasattr(tools.anthropic, 'process_tool_calls')
        assert hasattr(tools.anthropic, '_is_openfiles_tool')

    def test_openai_is_openfiles_tool(self, tools):
        """Should identify OpenFiles tools correctly in OpenAI provider"""
        assert tools.openai._is_openfiles_tool("write_file") is True
        assert tools.openai._is_openfiles_tool("read_file") is True
        assert tools.openai._is_openfiles_tool("edit_file") is True
        assert tools.openai._is_openfiles_tool("list_files") is True
        assert tools.openai._is_openfiles_tool("append_to_file") is True
        assert tools.openai._is_openfiles_tool("overwrite_file") is True
        assert tools.openai._is_openfiles_tool("get_file_metadata") is True
        assert tools.openai._is_openfiles_tool("get_file_versions") is True

    def test_openai_is_not_openfiles_tool(self, tools):
        """Should reject non-OpenFiles tools in OpenAI provider"""
        assert tools.openai._is_openfiles_tool("some_other_tool") is False
        assert tools.openai._is_openfiles_tool("get_weather") is False
        assert tools.openai._is_openfiles_tool("") is False
        assert tools.openai._is_openfiles_tool("invalid_tool") is False

    def test_anthropic_is_openfiles_tool(self, tools):
        """Should identify OpenFiles tools correctly in Anthropic provider"""
        assert tools.anthropic._is_openfiles_tool("write_file") is True
        assert tools.anthropic._is_openfiles_tool("read_file") is True
        assert tools.anthropic._is_openfiles_tool("edit_file") is True
        assert tools.anthropic._is_openfiles_tool("list_files") is True
        assert tools.anthropic._is_openfiles_tool("append_to_file") is True
        assert tools.anthropic._is_openfiles_tool("overwrite_file") is True
        assert tools.anthropic._is_openfiles_tool("get_file_metadata") is True
        assert tools.anthropic._is_openfiles_tool("get_file_versions") is True

    def test_anthropic_is_not_openfiles_tool(self, tools):
        """Should reject non-OpenFiles tools in Anthropic provider"""
        assert tools.anthropic._is_openfiles_tool("some_other_tool") is False
        assert tools.anthropic._is_openfiles_tool("get_weather") is False
        assert tools.anthropic._is_openfiles_tool("") is False
        assert tools.anthropic._is_openfiles_tool("invalid_tool") is False

    @pytest.mark.asyncio
    async def test_openai_execute_write_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute write_file tool correctly via OpenAI provider"""
        mock_client.write_file.return_value = sample_file_metadata
        
        args = {"path": "test.txt", "content": "Hello World", "contentType": "text/plain"}
        result = await tools.openai._execute_tool("write_file", args)

        mock_client.write_file.assert_called_once_with(
            path="test.txt", content="Hello World", content_type="text/plain"
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_openai_execute_read_file_tool(self, tools, mock_client):
        """Should execute read_file tool correctly via OpenAI provider"""
        mock_client.read_file.return_value = "File content"

        args = {"path": "test.txt", "version": 0}
        result = await tools.openai._execute_tool("read_file", args)

        mock_client.read_file.assert_called_once_with(path="test.txt", version=None)
        assert result == {"path": "test.txt", "content": "File content", "version": 0}

    @pytest.mark.asyncio
    async def test_openai_execute_read_file_with_version(self, tools, mock_client):
        """Should execute read_file tool with specific version via OpenAI provider"""
        mock_client.read_file.return_value = "File content v2"

        args = {"path": "test.txt", "version": 2}
        result = await tools.openai._execute_tool("read_file", args)

        mock_client.read_file.assert_called_once_with(path="test.txt", version=2)
        assert result["version"] == 2

    @pytest.mark.asyncio
    async def test_openai_execute_edit_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute edit_file tool correctly via OpenAI provider"""
        mock_client.edit_file.return_value = sample_file_metadata

        args = {"path": "test.txt", "oldString": "Hello", "newString": "Hi"}
        result = await tools.openai._execute_tool("edit_file", args)

        mock_client.edit_file.assert_called_once_with(
            path="test.txt", old_string="Hello", new_string="Hi"
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_openai_execute_list_files_tool(self, tools, mock_client):
        """Should execute list_files tool correctly via OpenAI provider"""
        mock_list_response = MagicMock()
        mock_client.list_files.return_value = mock_list_response

        args = {"directory": "docs/", "limit": 20, "recursive": False}
        result = await tools.openai._execute_tool("list_files", args)

        mock_client.list_files.assert_called_once_with(
            directory="docs/", limit=20, recursive=False
        )
        assert result == mock_list_response

    @pytest.mark.asyncio
    async def test_openai_execute_append_to_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute append_to_file tool correctly via OpenAI provider"""
        mock_client.append_file.return_value = sample_file_metadata

        args = {"path": "log.txt", "content": "\nNew log entry"}
        result = await tools.openai._execute_tool("append_to_file", args)

        mock_client.append_file.assert_called_once_with(
            path="log.txt", content="\nNew log entry"
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_openai_execute_overwrite_file_tool(self, tools, mock_client, sample_file_metadata):
        """Should execute overwrite_file tool correctly via OpenAI provider"""
        mock_client.overwrite_file.return_value = sample_file_metadata

        args = {"path": "config.json", "content": '{"new": "config"}', "isBase64": False}
        result = await tools.openai._execute_tool("overwrite_file", args)

        mock_client.overwrite_file.assert_called_once_with(
            path="config.json", content='{"new": "config"}', is_base64=False
        )
        assert result == sample_file_metadata

    @pytest.mark.asyncio
    async def test_openai_execute_get_file_metadata_tool(self, tools, mock_client):
        """Should execute get_file_metadata tool correctly via OpenAI provider"""
        mock_metadata_response = MagicMock()
        mock_client.get_metadata.return_value = mock_metadata_response

        args = {"path": "test.txt", "version": 0}
        result = await tools.openai._execute_tool("get_file_metadata", args)

        mock_client.get_metadata.assert_called_once_with(
            path="test.txt", version=None
        )
        assert result == mock_metadata_response

    @pytest.mark.asyncio
    async def test_openai_execute_get_file_versions_tool(self, tools, mock_client):
        """Should execute get_file_versions tool correctly via OpenAI provider"""
        mock_versions_response = MagicMock()
        mock_client.get_versions.return_value = mock_versions_response

        args = {"path": "test.txt", "limit": 10, "offset": 0}
        result = await tools.openai._execute_tool("get_file_versions", args)

        mock_client.get_versions.assert_called_once_with(
            path="test.txt", limit=10, offset=0
        )
        assert result == mock_versions_response

    @pytest.mark.asyncio
    async def test_openai_execute_tool_with_base_path(self, mock_client, sample_file_metadata):
        """Should execute tools with base path via OpenAI provider"""
        # Mock the with_base_path method
        mock_client_with_path = AsyncMock()
        mock_client_with_path.write_file.return_value = sample_file_metadata
        mock_client.with_base_path.return_value = mock_client_with_path
        
        tools = OpenFilesTools(mock_client, "projects/website")
        
        args = {"path": "index.html", "content": "<html></html>", "contentType": "text/html"}
        await tools.openai._execute_tool("write_file", args)

        mock_client_with_path.write_file.assert_called_once_with(
            path="index.html",
            content="<html></html>",
            content_type="text/html",
        )

    @pytest.mark.asyncio
    async def test_openai_execute_unknown_tool(self, tools):
        """Should raise error for unknown tool via OpenAI provider"""
        with pytest.raises(ValueError) as exc:
            await tools.openai._execute_tool("unknown_tool", {"arg": "value"})

        assert "Unknown tool: unknown_tool" in str(exc.value)

    @pytest.mark.asyncio
    async def test_openai_process_tool_calls_openai_response(self, tools, mock_client, sample_file_metadata):
        """Should process OpenAI response with tool calls via OpenAI provider"""
        mock_client.write_file.return_value = sample_file_metadata

        # Mock OpenAI response structure
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

        processed = await tools.openai.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert processed.results[0].status == "success"
        assert processed.results[0].function == "write_file"
        assert len(processed.tool_messages) == 1

        # Verify client was called
        mock_client.write_file.assert_called_once()

    @pytest.mark.asyncio
    async def test_openai_process_tool_calls_with_error(self, tools, mock_client):
        """Should handle tool execution errors via OpenAI provider"""
        mock_client.read_file.side_effect = Exception("File not found")

        mock_tool_call = MagicMock()
        mock_tool_call.id = "call-456"
        mock_tool_call.function.name = "read_file"
        mock_tool_call.function.arguments = json.dumps({"path": "missing.txt", "version": 0})

        mock_message = MagicMock()
        mock_message.tool_calls = [mock_tool_call]

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        processed = await tools.openai.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert processed.results[0].status == "error"
        assert processed.results[0].error == "File not found"

    @pytest.mark.asyncio
    async def test_openai_process_tool_calls_ignores_non_openfiles_tools(self, tools, mock_client):
        """Should ignore non-OpenFiles tools via OpenAI provider"""
        mock_tool_call = MagicMock()
        mock_tool_call.id = "call-weather"
        mock_tool_call.function.name = "get_weather"
        mock_tool_call.function.arguments = json.dumps({"city": "New York"})

        mock_message = MagicMock()
        mock_message.tool_calls = [mock_tool_call]

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        processed = await tools.openai.process_tool_calls(mock_response)

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
    async def test_openai_process_tool_calls_mixed_tools(self, tools, mock_client, sample_file_metadata):
        """Should process only OpenFiles tools in mixed response via OpenAI provider"""
        mock_client.write_file.return_value = sample_file_metadata

        mock_weather_call = MagicMock()
        mock_weather_call.id = "call-weather"
        mock_weather_call.function.name = "get_weather"
        mock_weather_call.function.arguments = json.dumps({"city": "New York"})

        mock_write_call = MagicMock()
        mock_write_call.id = "call-write"
        mock_write_call.function.name = "write_file"
        mock_write_call.function.arguments = json.dumps({
            "path": "test.txt",
            "content": "Hello",
            "contentType": "text/plain",
        })

        mock_message = MagicMock()
        mock_message.tool_calls = [mock_weather_call, mock_write_call]

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        processed = await tools.openai.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1  # Only OpenFiles tool processed
        assert processed.results[0].tool_call_id == "call-write"
        assert processed.results[0].function == "write_file"

    @pytest.mark.asyncio
    async def test_openai_process_tool_calls_empty_response(self, tools):
        """Should handle empty response gracefully via OpenAI provider"""
        mock_response = MagicMock()
        mock_response.choices = []

        processed = await tools.openai.process_tool_calls(mock_response)

        assert processed.handled is False
        assert len(processed.results) == 0
        assert len(processed.tool_messages) == 0

    @pytest.mark.asyncio
    async def test_openai_process_tool_calls_object_style_response(self, tools, mock_client, sample_file_metadata):
        """Should handle object-style response (like from OpenAI SDK) via OpenAI provider"""
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

        processed = await tools.openai.process_tool_calls(mock_response)

        assert processed.handled is True
        assert len(processed.results) == 1
        assert processed.results[0].status == "success"
        mock_client.write_file.assert_called_once()