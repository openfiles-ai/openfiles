#!/usr/bin/env python3
"""
OpenAI Wrapper Integration Example

Shows how to integrate OpenFiles with OpenAI for AI-powered file operations.
Best for: AI apps, chatbots, natural language interfaces.
"""

import asyncio
import json
import os
import sys
import time
from typing import Any, Dict

from dotenv import load_dotenv

from openfiles_ai import OpenAI
from shared.session_utils import generate_session_id, create_session_paths, print_session_info


async def openai_integration_example() -> None:
    """Demonstrate OpenAI wrapper integration with automatic file operations"""
    print('🤖 OpenAI Wrapper Integration')

    # Step 1: Generate unique session for test isolation
    session_id = generate_session_id()
    session_paths = create_session_paths(session_id, "openai-demo")
    print_session_info(session_id, session_paths)

    # Step 2: Setup validation
    if not os.getenv('OPENFILES_API_KEY') or not os.getenv('OPENAI_API_KEY'):
        print('❌ Configure API keys in .env:')
        print('   OPENFILES_API_KEY, OPENAI_API_KEY')
        sys.exit(1)

    # Step 3: Initialize OpenAI wrapper with session-specific organized structure
    ai = OpenAI(
        openfiles_api_key=os.getenv('OPENFILES_API_KEY'),
        api_key=os.getenv('OPENAI_API_KEY'),
        base_path=session_paths['ai_generated']  # Organize all AI files under session
    )

    model = 'gpt-4o-mini'  # Cost-effective model
    start_time = time.time()

    try:
        # AI-powered business file operations

        print('📊 Creating business reports with AI...')
        
        # Create scoped AI client for reports
        reports_ai = ai.with_base_path('reports')
        await reports_ai.chat.completions.create(
            model=model,
            messages=[{
                'role': 'user',
                'content': 'Create a monthly sales report for January 2024 with sample data. Include revenue of $125,000, 85 new customers, and top regions. Save as january-2024-sales.md'
            }],
            temperature=0.3
        )
        print('✅ Sales report created at ai-generated/business-docs/reports/january-2024-sales.md')

        print('⚙️  Setting up configuration with AI...')
        
        # Create scoped AI client for config
        config_ai = ai.with_base_path('config')
        await config_ai.chat.completions.create(
            model=model,
            messages=[{
                'role': 'user',
                'content': 'Create an application configuration file with database settings (PostgreSQL on localhost), API rate limits (1000/hour), and feature flags for analytics. Save as app-config.json'
            }],
            temperature=0.2
        )
        print('✅ Configuration created at ai-generated/business-docs/config/app-config.json')

        print('📈 Generating analytics data with AI...')
        
        # Create scoped AI client for analytics data
        data_ai = ai.with_base_path('analytics')
        await data_ai.chat.completions.create(
            model=model,
            messages=[{
                'role': 'user',
                'content': 'Create a CSV file with user analytics data for the past week. Include columns for date, user_id, page_views, session_duration, and actions_taken. Generate 20 sample records. Save as user-metrics.csv'
            }],
            temperature=0.3
        )
        print('✅ Analytics data generated at ai-generated/business-docs/analytics/user-metrics.csv')

        print('🔍 Checking created files with AI...')
        list_response = await ai.chat.completions.create(
            model=model,
            messages=[{
                'role': 'user',
                'content': 'List all the files we have created and provide a brief summary of each file\'s purpose and size.'
            }]
        )
        response_content = list_response.choices[0].message.content if list_response.choices else 'No response'
        summary = response_content[:100] + '...' if response_content and len(response_content) > 100 else response_content
        print(f'✅ Files reviewed: {summary or "No response"}')

        print('📝 Creating documentation with AI...')
        await ai.chat.completions.create(
            model=model,
            messages=[{
                'role': 'user',
                'content': 'Create a README.md file that documents all the files we created - the sales report, configuration, and analytics data. Explain what each file contains and how to use them. Save in the root directory.'
            }],
            temperature=0.2
        )
        print('✅ Documentation created')

        # Success summary
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        print('✅ OpenAI Integration Complete')
        print(f'⏱️  Duration: {duration:.0f}ms')
        print(f'🤖 Model: {model}')
        print('💡 AI automatically created business files through natural language')
        print('📁 Created: Sales reports, configurations, analytics data, documentation')

    except Exception as error:
        print()
        error_message = str(error) if hasattr(error, '__str__') else repr(error)
        print(f'❌ Integration failed: {error_message}')
        sys.exit(1)


# Integration patterns for your AI applications:

def create_project_ai(
    api_key: str,
    openfiles_api_key: str,
    base_url: str,
    project_name: str,
    session_id: str = None
) -> Dict[str, Any]:
    """
    Pattern 1: Project-Based AI Organization
    """
    # Generate session ID if not provided for test isolation
    if not session_id:
        session_id = generate_session_id()
    
    # Create AI client scoped to specific project with session isolation
    project_ai = OpenAI(
        api_key=api_key,
        openfiles_api_key=openfiles_api_key,
        openfiles_base_url=base_url,
        base_path=f'projects/session_{session_id}/{project_name}'
    )
    
    async def create_docs(prompt: str) -> Any:
        """Create project documentation"""
        docs_ai = project_ai.with_base_path('docs')
        return await docs_ai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.3
        )
    
    async def create_reports(prompt: str) -> Any:
        """Create project reports and analysis"""
        reports_ai = project_ai.with_base_path('reports')
        return await reports_ai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.2
        )
    
    async def create_policies(prompt: str) -> Any:
        """Create business policies and procedures"""
        policies_ai = project_ai.with_base_path('policies')
        return await policies_ai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.2
        )
    
    return {
        'create_docs': create_docs,
        'create_reports': create_reports,
        'create_policies': create_policies,
        'client': project_ai
    }


def create_environment_ai(
    ai: OpenAI,
    environment: str,
    session_id: str = None
) -> Dict[str, Any]:
    """
    Pattern 2: Environment-Based AI Management
    """
    # Generate session ID if not provided for test isolation
    if not session_id:
        session_id = generate_session_id()
    
    # Create environment-specific AI client with session isolation
    env_ai = ai.with_base_path(f'environments/session_{session_id}/{environment}')
    
    async def deploy_config(config: Dict[str, Any]) -> Any:
        """Deploy configuration for environment"""
        config_ai = env_ai.with_base_path('config')
        return await config_ai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{
                'role': 'user',
                'content': f'Create a {environment} configuration file with settings: {json.dumps(config)}. Save as app-config.json'
            }],
            temperature=0.1
        )
    
    async def generate_secrets() -> Any:
        """Generate secure environment variables"""
        secrets_ai = env_ai.with_base_path('secrets')
        return await secrets_ai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{
                'role': 'user',
                'content': f'Generate secure environment variables for {environment}. Save as .env.{environment}'
            }],
            temperature=0.1
        )
    
    return {
        'deploy_config': deploy_config,
        'generate_secrets': generate_secrets,
        'client': env_ai
    }


async def analyze_and_document(ai: OpenAI, file_path: str) -> Any:
    """
    Pattern 3: Code Analysis and Documentation
    """
    return await ai.chat.completions.create(
        model='gpt-4o-mini',
        messages=[{
            'role': 'user',
            'content': f'Read the file at {file_path}, analyze it, and create documentation explaining what it does. Save the documentation as docs/{file_path.replace(".", "-")}-guide.md'
        }],
        temperature=0.2
    )


async def update_config(ai: OpenAI, config_path: str, updates: str) -> Any:
    """
    Pattern 4: Configuration Management
    """
    return await ai.chat.completions.create(
        model='gpt-4o-mini',
        messages=[{
            'role': 'user',
            'content': f'Update the configuration file at {config_path} with these changes: {updates}. Maintain the existing format and structure.'
        }],
        temperature=0.1
    )


def main() -> None:
    """Run the example if called directly"""
    load_dotenv()
    asyncio.run(openai_integration_example())


if __name__ == '__main__':
    main()