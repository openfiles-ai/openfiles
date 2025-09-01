#!/usr/bin/env python3
"""
Prebuild Python SDK - Fetch OpenAPI spec and generate models

This script fetches the OpenAPI specification from a URL (if provided)
and generates Pydantic models for the Python SDK.
"""

import json
import subprocess
import sys
import urllib.request
from pathlib import Path

# Add parent directory to path to import from openfiles_ai
sys.path.insert(0, str(Path(__file__).parent.parent))

from openfiles_ai.config import settings


def main() -> None:
    """Prebuild Python SDK with OpenAPI spec fetch and model generation"""
    
    print("🔧 Prebuilding Python SDK...")
    
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    local_spec_path = project_root / "openapi-spec.json"
    output_dir = project_root / "openfiles_ai/core/generated"
    
    # Step 1: Try to fetch OpenAPI spec from URL using Pydantic Settings
    if settings.debug:
        print(f"🐛 Debug mode enabled")
        print(f"🐛 OpenAPI URL: {settings.openfiles_openapi_url}")
    
    openfiles_openapi_url = settings.openfiles_openapi_url
    
    if openfiles_openapi_url:
        try:
            print(f"🌐 Fetching OpenAPI spec from: {openfiles_openapi_url}")
            
            with urllib.request.urlopen(openfiles_openapi_url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {response.reason}")
                
                spec_data = response.read()
                spec = json.loads(spec_data)
                
            # Save the fetched spec
            with open(local_spec_path, 'w') as f:
                json.dump(spec, f, indent=2)
            
            print("✅ OpenAPI spec updated from URL")
            print(f"🎯 Spec contains {len(spec.get('paths', {}))} endpoints")
            
        except Exception as error:
            print(f"⚠️  Failed to fetch OpenAPI spec: {error}")
            print("📄 Will try to use existing spec or fallback to OpenAPI package")
    else:
        print("📄 No OPENFILES_OPENAPI_URL provided")
    
    # Step 2: Determine which spec file to use
    spec_path = local_spec_path
    
    if not local_spec_path.exists():
        print("📦 No local spec found, trying OpenAPI package...")
        package_spec_path = project_root.parent / "openapi/dist/sdk-openapi.json"
        
        if package_spec_path.exists():
            spec_path = package_spec_path
            print("✅ Using OpenAPI package spec")
        else:
            print("❌ No OpenAPI spec found!")
            print("💡 Either set OPENFILES_OPENAPI_URL or build the OpenAPI package")
            sys.exit(1)
    
    # Step 3: Validate the spec
    try:
        with open(spec_path, 'r') as f:
            spec = json.load(f)
        print(f"🎯 Using spec with {len(spec.get('paths', {}))} endpoints")
    except (json.JSONDecodeError, FileNotFoundError) as error:
        print(f"❌ Invalid or missing OpenAPI spec: {error}")
        sys.exit(1)
    
    # Step 4: Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Step 5: Generate Python models
    try:
        print("🚀 Generating Python models...")
        
        cmd = [
            "python", "-m", "datamodel_code_generator",
            "--input", str(spec_path),
            "--output", str(output_dir / "models.py"),
            "--input-file-type", "openapi",
            "--output-model-type", "pydantic_v2.BaseModel",
            "--target-python-version", "3.9",
            "--field-constraints",
            "--use-annotated",
            "--enable-version-header",
            "--use-generic-container-types",
            "--use-union-operator",
            "--collapse-root-models",
            "--use-title-as-name",
            "--strict-nullable",
        ]
        
        result = subprocess.run(
            cmd, 
            check=True, 
            capture_output=True, 
            text=True
        )
        
        if result.stdout:
            print(f"✅ {result.stdout}")
        
        # Create __init__.py for generated module
        init_file = output_dir / "__init__.py"
        init_content = '''"""
Generated OpenAPI client models

This module contains auto-generated models from the OpenAPI specification.
Do not edit these files directly - they will be overwritten during generation.
"""

from .models import *

__all__ = [
    # Export all generated models
    "FileMetadata",
    "WriteFileRequest", 
    "EditFileRequest",
    "AppendFileRequest",
    "OverwriteFileRequest",
    "FileContentResponse",
    "FileListResponse",
    "FileMetadataResponse", 
    "FileVersionsResponse",
    "ErrorResponse",
]
'''
        
        init_file.write_text(init_content)
        
        print("✅ Python models generated successfully")
        print("📄 Generated files:")
        print(f"   - {output_dir / 'models.py'}")
        print(f"   - {output_dir / '__init__.py'}")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate models: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ datamodel-code-generator not found")
        print("💡 Install it with: poetry install")
        sys.exit(1)
    
    print("🎉 Python SDK prebuild complete!")


if __name__ == "__main__":
    main()