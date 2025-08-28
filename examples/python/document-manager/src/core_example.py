#!/usr/bin/env python3
"""
Core API Integration Example

Shows how to integrate OpenFiles Core API into your application.
Best for: High-performance apps, direct control, non-AI use cases.
"""

import asyncio
import json
import os
import sys
import time
from typing import Any, Dict

from dotenv import load_dotenv

from openfiles_ai import OpenFilesClient
from shared.sample_data import (
    application_logs,
    app_config,
    customer_data_csv,
    format_file_size,
    sales_data_csv,
)
from shared.session_utils import generate_session_id, create_session_paths, print_session_info


async def core_integration_example() -> None:
    """Demonstrate core API integration with organized file structure"""
    print('🔧 OpenFiles Core API Integration')
    
    # Step 1: Generate unique session for test isolation
    session_id = generate_session_id()
    session_paths = create_session_paths(session_id, "core-demo")
    print_session_info(session_id, session_paths)
    
    # Step 2: Initialize client (copy this pattern)
    if not os.getenv('OPENFILES_API_KEY'):
        print('❌ Configure OPENFILES_API_KEY in .env')
        sys.exit(1)

    # Initialize client with session-specific basePath for organized file structure
    client = OpenFilesClient(
        api_key=os.getenv('OPENFILES_API_KEY'),
        base_url=os.getenv('OPENFILES_BASE_URL'),  # Use local dev server if specified
        base_path=session_paths['business_app']  # All files will be under this session path
    )

    start_time = time.time()
    operations = {'created': 0, 'read': 0, 'edited': 0, 'listed': 0, 'errors': 0}

    try:
        # Basic file operations with versatile business data

        # 1. Create business files using scoped clients for better organization
        print('📊 Creating business files with organized structure...')
        
        # Create scoped client for reports
        reports_client = client.with_base_path('reports')
        result = await reports_client.write_file(
            path='sales-data.csv',  # Creates: demo/business-app/reports/sales-data.csv
            content=sales_data_csv,
            content_type='text/csv'
        )
        print(f"Created sales data file with version {result.version} at path: {result.path}")
        operations['created'] += 1

        # Create scoped client for customer data
        data_client = client.with_base_path('data')
        await data_client.write_file(
            path='customers.csv',  # Creates: demo/business-app/data/customers.csv
            content=customer_data_csv,
            content_type='text/csv'
        )
        operations['created'] += 1

        # Create scoped client for configuration
        config_client = client.with_base_path('config')
        config_result = await config_client.write_file(
            path='app-settings.json',  # Creates: demo/business-app/config/app-settings.json
            content=json.dumps(app_config, indent=2),
            content_type='application/json'
        )
        print(f"Created config file with version {config_result.version} at path: {config_result.path}")
        operations['created'] += 1

        # Create scoped client for logs
        logs_client = client.with_base_path('logs')
        log_result = await logs_client.write_file(
            path='application.log',  # Creates: demo/business-app/logs/application.log
            content=application_logs,
            content_type='text/plain'
        )
        print(f"Created log file with version {log_result.version} at path: {log_result.path}")
        operations['created'] += 1
        print('✅ Files created successfully with organized structure')

        # 2. Read and process files using scoped clients
        print('📖 Reading business data from organized structure...')
        sales_response = await reports_client.read_file(path='sales-data.csv')
        sales_data = sales_response.data.content or ""
        sales_lines = len(sales_data.split('\n')) - 1  # Exclude header
        operations['read'] += 1
        
        config_response = await config_client.read_file(path='app-settings.json')
        config_content = config_response.data.content or "{}"
        config = json.loads(config_content)
        app_name = config.get('app', {}).get('name', 'Unknown')
        print(f'App name from config: {app_name}')
        operations['read'] += 1
        print('✅ Data read successfully from organized paths')

        # 3. Create updated configuration file (demonstrates versioning)
        print('⚙️ Creating updated app configuration and demonstrating more operations...')
        
        # Create a new version of the config with updated version
        updated_config = app_config.copy()
        updated_config['app']['version'] = '1.1.0'
        
        await config_client.write_file(
            path='app-settings-v2.json',  # New file to demonstrate versioning
            content=json.dumps(updated_config, indent=2),
            content_type='application/json'
        )
        operations['created'] += 1

        # Demonstrate edit_file - update configuration version using find and replace
        await config_client.edit_file(
            path='app-settings.json',
            old_string='"version": "1.0.0"',
            new_string='"version": "1.0.1"'
        )
        operations['edited'] += 1
        print('✅ Configuration updated with edit_file (version bumped to 1.0.1)')

        # Demonstrate append_file - add new log entries to existing log
        from datetime import datetime
        
        # Recreate logs client to ensure it's available
        logs_client = client.with_base_path('logs')
        new_log_entry = f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Configuration v1.1.0 created"
        await logs_client.append_file(
            path='application.log',  # This file was already created in step 1
            content=new_log_entry
        )
        
        # Demonstrate overwrite_file - create a summary report
        summary_report = f"""# Daily Operations Summary - {datetime.now().strftime('%Y-%m-%d')}

## Files Created Today
- Sales data CSV with 9 customer records
- Customer database with 8 active customers  
- Application configuration (v1.1.0)
- System logs with 8 entries

## Operations Completed
- File creation: {operations['created'] + 1}
- Data analysis: {operations['read']}
- Directory listing: In progress

## System Status
- All services operational
- Database connections stable
- File storage: {format_file_size(1024 * 50)} available

---
Report generated automatically"""
        
        await logs_client.overwrite_file(
            path='daily-summary.md',  # This will create new or completely replace existing
            content=summary_report,
            is_base64=False
        )
        operations['created'] += 2  # append + overwrite operations
        print('✅ Updated logs with append_file and created summary with overwrite_file')

        # 4. List files in organized directories
        print('📁 Exploring organized file structure...')
        all_files = await client.list_files(directory="", limit=20)  # Lists all under demo/business-app/
        report_files = await reports_client.list_files(directory="", limit=10)  # Lists demo/business-app/reports/
        config_files = await config_client.list_files(directory="", limit=10)  # Lists demo/business-app/config/
        data_files = await data_client.list_files(directory="", limit=10)  # Lists demo/business-app/data/
        log_files = await logs_client.list_files(directory="", limit=10)  # Lists demo/business-app/logs/
        operations['listed'] += 5
        print('✅ Organized file structure explored')

        # 5. File monitoring and metadata with scoped clients
        config_metadata_response = await config_client.get_metadata(path='app-settings.json')
        config_metadata = config_metadata_response.data
        config_versions_response = await config_client.get_versions(path='app-settings.json')
        config_versions = config_versions_response.data

        # Success summary
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        print('✅ Core Integration Complete')
        print(f"📊 Operations: {operations['created']} created, {operations['read']} read, {operations['edited']} edited, {operations['listed']} listed")
        print(f"⏱️  Duration: {duration:.0f}ms")
        total_files = len(all_files.data.files or []) + len(report_files.data.files or []) + len(config_files.data.files or []) + len(data_files.data.files or []) + len(log_files.data.files or [])
        print(f"📁 Files: {total_files} total ({len(report_files.data.files or [])} reports, {len(config_files.data.files or [])} config, {len(data_files.data.files or [])} data, {len(log_files.data.files or [])} logs)")
        print(f"📋 Sales data: {sales_lines} records")
        print(f"🔧 Config: v{config_metadata.version}, {format_file_size(config_metadata.size or 0)}")
        print(f"📚 Versions tracked: {len(config_versions.versions)}")

    except Exception as error:
        operations['errors'] += 1
        error_message = str(error) if hasattr(error, '__str__') else repr(error)
        print(f'\n❌ Integration failed: {error_message}')
        sys.exit(1)


# Integration patterns you can copy:

async def create_config_manager(api_key: str, base_url: str, environment: str, session_id: str = None) -> Dict[str, Any]:
    """
    Pattern 1: Configuration Management with BasePath
    """
    # Generate session ID if not provided for test isolation
    if not session_id:
        session_id = generate_session_id()
    
    # Create environment-specific config client with session isolation
    config_client = OpenFilesClient(
        api_key=api_key,
        base_url=base_url,
        base_path=f'config-mgr/session_{session_id}/environments/{environment}/config'
    )
    
    async def save_config(config: Dict[str, Any]) -> Any:
        return await config_client.write_file(
            path='app-settings.json',
            content=json.dumps(config, indent=2),
            content_type='application/json'
        )
    
    async def load_config() -> Dict[str, Any]:
        response = await config_client.read_file(path='app-settings.json')
        content = response.data.content or "{}"
        return json.loads(content)
    
    return {
        'save': save_config,
        'load': load_config
    }


async def create_team_storage(client: OpenFilesClient, team_name: str, session_id: str = None) -> Dict[str, Any]:
    """
    Pattern 2: Team-Based Data Storage
    """
    # Generate session ID if not provided for test isolation
    if not session_id:
        session_id = generate_session_id()
    
    # Create team-specific storage client with session isolation
    team_client = client.with_base_path(f'teams/session_{session_id}/{team_name}')
    
    async def save_data(filename: str, data: Dict[str, Any]) -> Any:
        return await team_client.write_file(
            path=f'data/{filename}.json',
            content=json.dumps(data, indent=2),
            content_type='application/json'
        )
    
    async def load_data(filename: str) -> Dict[str, Any]:
        response = await team_client.read_file(path=f'data/{filename}.json')
        content = response.data.content or "{}"
        return json.loads(content)
    
    return {
        'save_data': save_data,
        'load_data': load_data
    }


async def create_logger(client: OpenFilesClient, app_name: str, session_id: str = None) -> Dict[str, Any]:
    """
    Pattern 3: Application Logging with BasePath
    """
    from datetime import datetime
    
    # Generate session ID if not provided for test isolation
    if not session_id:
        session_id = generate_session_id()
    
    # Create app-specific logger with organized log structure and session isolation
    logs_client = client.with_base_path(f'apps/session_{session_id}/{app_name}/logs')
    year_month = datetime.now().strftime('%Y-%m')  # YYYY-MM format
    
    async def log(level: str, message: str) -> Any:
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level}] {message}"
        log_file = f"{year_month}.log"
        
        try:
            # Try to append to existing monthly log
            current_log_response = await logs_client.read_file(path=log_file)
            current_log = current_log_response.data.content or ""
            return await logs_client.edit_file(
                path=log_file,
                old_string=current_log,
                new_string=current_log + '\n' + log_entry
            )
        except Exception:
            # Create new monthly log file if it doesn't exist
            return await logs_client.write_file(
                path=log_file,
                content=log_entry,
                content_type='text/plain'
            )
    
    return {
        'log': log
    }


def main() -> None:
    """Run the example if called directly"""
    load_dotenv()
    asyncio.run(core_integration_example())


if __name__ == '__main__':
    main()