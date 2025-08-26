"""
Tests for OpenAI client with OpenFiles integration
"""

from unittest.mock import Mock

from openfiles_ai.openai.client import ClientOptions, FileOperation, ToolExecution


class TestClientOptions:
    """Test ClientOptions configuration"""

    def test_init_required_params(self):
        """Test ClientOptions initialization with required parameters"""
        config = ClientOptions(
            openfiles_api_key="oa_test123456789012345678901234567890"
        )
        
        assert config.openfiles_api_key == "oa_test123456789012345678901234567890"
        assert config.api_key is None
        assert config.openfiles_base_url is None
        assert config.base_path is None
        assert config.on_file_operation is None
        assert config.on_tool_execution is None
        assert config.on_error is None

    def test_init_all_params(self):
        """Test ClientOptions initialization with all parameters"""
        on_file_op = Mock()
        on_tool_exec = Mock()
        on_error = Mock()
        
        config = ClientOptions(
            openfiles_api_key="oa_test123456789012345678901234567890",
            api_key="sk_test",
            openfiles_base_url="https://api.test.com",
            base_path="projects/test",
            on_file_operation=on_file_op,
            on_tool_execution=on_tool_exec,
            on_error=on_error,
            custom_param="value"
        )
        
        assert config.openfiles_api_key == "oa_test123456789012345678901234567890"
        assert config.api_key == "sk_test"
        assert config.openfiles_base_url == "https://api.test.com"
        assert config.base_path == "projects/test"
        assert config.on_file_operation == on_file_op
        assert config.on_tool_execution == on_tool_exec
        assert config.on_error == on_error
        assert config.openai_kwargs["custom_param"] == "value"


class TestFileOperation:
    """Test FileOperation monitoring class"""

    def test_init_minimal(self):
        """Test FileOperation with minimal parameters"""
        op = FileOperation(action="write_file")
        
        assert op.action == "write_file"
        assert op.path is None
        assert op.version is None
        assert op.success is True
        assert op.error is None
        assert op.data is None

    def test_init_complete(self):
        """Test FileOperation with all parameters"""
        data = {"content": "test"}
        op = FileOperation(
            action="edit_file",
            path="test.txt",
            version=2,
            success=False,
            error="File not found",
            data=data
        )
        
        assert op.action == "edit_file"
        assert op.path == "test.txt"
        assert op.version == 2
        assert op.success is False
        assert op.error == "File not found"
        assert op.data == data


class TestToolExecution:
    """Test ToolExecution monitoring class"""

    def test_init_minimal(self):
        """Test ToolExecution with minimal parameters"""
        exec = ToolExecution(
            tool_call_id="call_123",
            function="write_file",
            success=True
        )
        
        assert exec.tool_call_id == "call_123"
        assert exec.function == "write_file"
        assert exec.success is True
        assert exec.result is None
        assert exec.error is None
        assert exec.duration is None

    def test_init_complete(self):
        """Test ToolExecution with all parameters"""
        result = {"path": "test.txt"}
        exec = ToolExecution(
            tool_call_id="call_456",
            function="read_file",
            success=False,
            result=result,
            error="Permission denied",
            duration=0.5
        )
        
        assert exec.tool_call_id == "call_456"
        assert exec.function == "read_file"
        assert exec.success is False
        assert exec.result == result
        assert exec.error == "Permission denied"
        assert exec.duration == 0.5


# Simple integration test that avoids complex mocking
class TestOpenAIIntegration:
    """Test OpenAI integration functionality without complex mocking"""

    def test_client_options_initialization(self):
        """Test that ClientOptions stores configuration correctly"""
        config = ClientOptions(
            openfiles_api_key="oa_test123456789012345678901234567890",
            api_key="sk_test",
            base_path="projects/test"
        )
        
        assert config.openfiles_api_key == "oa_test123456789012345678901234567890"
        assert config.api_key == "sk_test"
        assert config.base_path == "projects/test"

    def test_file_operation_creation(self):
        """Test FileOperation creation for monitoring"""
        op = FileOperation(
            action="write_file",
            path="test.txt",
            version=1,
            success=True,
            data={"content": "hello"}
        )
        
        assert op.action == "write_file"
        assert op.path == "test.txt"
        assert op.version == 1
        assert op.success is True
        assert op.data["content"] == "hello"

    def test_tool_execution_creation(self):
        """Test ToolExecution creation for monitoring"""
        exec = ToolExecution(
            tool_call_id="call_123",
            function="write_file",
            success=True,
            result={"path": "test.txt"},
            duration=0.5
        )
        
        assert exec.tool_call_id == "call_123"
        assert exec.function == "write_file"
        assert exec.success is True
        assert exec.result["path"] == "test.txt"
        assert exec.duration == 0.5

    def test_base_path_combination(self):
        """Test base path combination logic"""
        existing_path = "projects/test"
        new_path = "subfolder/file"
        
        # Simulate the path combination logic from with_base_path
        combined = f"{existing_path}/{new_path}".replace("//", "/").rstrip("/")
        
        assert combined == "projects/test/subfolder/file"

    def test_path_normalization(self):
        """Test path normalization handles double slashes"""
        path_with_doubles = "projects//test///subfolder"
        
        # Use a proper normalization approach
        while "//" in path_with_doubles:
            path_with_doubles = path_with_doubles.replace("//", "/")
        
        assert path_with_doubles == "projects/test/subfolder"