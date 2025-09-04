#!/usr/bin/env python3
"""
Tools Integration Example

Shows how to integrate OpenFiles with any AI framework using function calling.
Best for: Custom AI frameworks, advanced control, multi-AI support.
"""

import asyncio
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

# Load environment variables first, before importing OpenFiles modules
load_dotenv()
from openai import OpenAI as OpenAIClient

from openfiles_ai import OpenFilesClient, OpenFilesTools
from shared.sample_data import customer_data_csv, format_file_size
from shared.session_utils import generate_session_id, create_session_paths, print_session_info


async def tools_integration_example() -> None:
    """Demonstrate tools integration with AI frameworks"""
    print('🛠️ Tools Integration Example')

    # Step 1: Generate unique session for test isolation
    session_id = generate_session_id()
    session_paths = create_session_paths(session_id, "tools-demo")
    print_session_info(session_id, session_paths)

    # Step 2: Environment validation
    if not os.getenv('OPENFILES_API_KEY'):
        print('❌ Configure OPENFILES_API_KEY in .env')
        sys.exit(1)

    # Initialize client and tools with session-specific organized structure
    client = OpenFilesClient(
        api_key=os.getenv('OPENFILES_API_KEY'),
        base_url=os.getenv('OPENFILES_BASE_URL'),  # Use local dev server if specified
        base_path=session_paths['tools_test']  # All AI-generated files organized under session
    )

    # Create single unified tool for consistent basePath context
    project_tools = OpenFilesTools(client)  # Single tool for entire conversation
    
    start_time = time.time()
    operations_completed = 0

    # Check for AI capabilities
    use_ai = os.getenv('OPENAI_API_KEY')
    openai = OpenAIClient(api_key=os.getenv('OPENAI_API_KEY')) if use_ai else None
    model = 'gpt-4o-mini'

    print(f'🔧 Mode: {"AI-powered" if use_ai else "Manual execution"}')
    print(f'🛠️  Available tools: {len(project_tools.openai.definitions)}')

    try:
        if openai:
            # Maintain conversation context across all AI interactions
            conversation: List[Dict[str, Any]] = [
                {
                    'role': 'system',
                    'content': 'You are a helpful business assistant. When working with files, always use the EXACT file paths I specify or that you create. Remember all previous operations in our conversation.'
                }
            ]

            # Step 1: Create sales report
            print('💬 User: "Create a sales report for January 2024 with our key metrics"')
            conversation.append({
                'role': 'user',
                'content': 'Create a sales report for January 2024. Include revenue of $125,000, 42 new customers, top regions (North America, Europe), and next month goals. Save it in the sales department folder as january-2024-sales.md'
            })

            report_response = openai.chat.completions.create(
                model=model,
                messages=conversation,
                tools=[tool.to_dict() for tool in project_tools.openai.definitions],  # Using unified project tools
                temperature=0.3,
                parallel_tool_calls=False  # Ensure sequential execution
            )

            # Process tools and get tool messages
            report_processed = await project_tools.openai.process_tool_calls(report_response)
            
            if report_processed.handled:
                print('✅ Sales report created at ai-workspace/sales-dept/january-2024-sales.md')
                operations_completed += 1
                
                # Add BOTH AI message and tool messages to conversation
                if report_response.choices[0].message:
                    conversation.append(report_response.choices[0].message.model_dump())
                conversation.extend(report_processed.tool_messages)

            # Step 2: List files
            print('💬 User: "Show me what files we have so far"')
            conversation.append({
                'role': 'user',
                'content': 'List all the files in our project and tell me what we have created so far.'
            })

            list_response = openai.chat.completions.create(
                model=model,
                messages=conversation,
                tools=[tool.to_dict() for tool in project_tools.openai.definitions],
                temperature=0.1,
                parallel_tool_calls=False
            )

            list_processed = await project_tools.openai.process_tool_calls(list_response)
            if list_processed.handled:
                print('✅ File listing completed')
                operations_completed += 1
                
                # Add BOTH AI message and tool messages to conversation
                if list_response.choices[0].message:
                    conversation.append(list_response.choices[0].message.model_dump())
                conversation.extend(list_processed.tool_messages)

            # Step 3: Read and edit the SAME file we created
            print('💬 User: "Read the sales report and add a customer satisfaction section"')
            conversation.append({
                'role': 'user',
                'content': 'Read the sales report file we just created and add a new section called "Customer Satisfaction" with a score of 4.7/5 and key feedback points.'
            })

            read_edit_response = openai.chat.completions.create(
                model=model,
                messages=conversation,
                tools=[tool.to_dict() for tool in project_tools.openai.definitions],
                temperature=0.2,
                parallel_tool_calls=False
            )

            read_edit_processed = await project_tools.openai.process_tool_calls(read_edit_response)
            if read_edit_processed.handled:
                print('✅ Report updated with satisfaction data')
                operations_completed += 1
                
                # Add BOTH AI message and tool messages to conversation
                if read_edit_response.choices[0].message:
                    conversation.append(read_edit_response.choices[0].message.model_dump())
                conversation.extend(read_edit_processed.tool_messages)

            # Step 4: Create customer database
            print('💬 User: "Create a customer database with sample data"')
            conversation.append({
                'role': 'user',
                'content': 'Create a customer database CSV file with these columns: customer_id, company_name, industry, monthly_revenue, status. Add 8 sample customers with realistic business data. Save it in the data folder as customers.csv'
            })

            customer_response = openai.chat.completions.create(
                model=model,
                messages=conversation,
                tools=[tool.to_dict() for tool in project_tools.openai.definitions],  # Using unified project tools
                temperature=0.3,
                parallel_tool_calls=False
            )

            customer_processed = await project_tools.openai.process_tool_calls(customer_response)
            if customer_processed.handled:
                print('✅ Customer database created at ai-workspace/data-analytics/customers.csv')
                operations_completed += 1
                
                # Add BOTH AI message and tool messages to conversation
                if customer_response.choices[0].message:
                    conversation.append(customer_response.choices[0].message.model_dump())
                conversation.extend(customer_processed.tool_messages)

            # Step 5: Get metadata for specific file
            print('💬 User: "Check the details of our sales report file"')
            conversation.append({
                'role': 'user',
                'content': 'Get the file information for the sales report file we created - I want to see the version, size, and modification details.'
            })

            metadata_response = openai.chat.completions.create(
                model=model,
                messages=conversation,
                tools=[tool.to_dict() for tool in project_tools.openai.definitions],
                temperature=0.1,
                parallel_tool_calls=False
            )

            metadata_processed = await project_tools.openai.process_tool_calls(metadata_response)
            if metadata_processed.handled:
                print('✅ File metadata retrieved')
                operations_completed += 1
                
                # Add BOTH AI message and tool messages to conversation
                if metadata_response.choices[0].message:
                    conversation.append(metadata_response.choices[0].message.model_dump())
                conversation.extend(metadata_processed.tool_messages)

        else:
            # Manual tool execution - simulate step-by-step business workflow
            print('Step 1: Creating initial sales report...')
            
            # Step 1: Create sales report
            sales_report_result = await client.write_file(
                path='reports/monthly-sales.md',
                content='# Monthly Sales Report\n\n## Key Metrics\n- Revenue: $95,000\n- New Customers: 28\n\n## Next Steps\n- TBD',
                content_type='text/markdown'
            )
            
            if sales_report_result:
                print('✅ Sales report created')
                operations_completed += 1

            print('Step 2: Creating customer database...')
            
            # Step 2: Create customer data
            customer_result = await client.write_file(
                path='data/customers.csv',
                content=customer_data_csv,
                content_type='text/csv'
            )
            
            if customer_result:
                print('✅ Customer database created')
                operations_completed += 1

            print('Step 3: Reading customer data to get insights...')
            
            # Step 3: Read customer data to analyze it
            read_response = await client.read_file(path='data/customers.csv')

            if read_response and read_response.data.content:
                customer_lines = len(read_response.data.content.split('\n')) - 1
                print(f'✅ Analyzed customer data: {customer_lines} customers found')
                operations_completed += 1

            print('Step 4: Creating updated sales report with customer insights...')
            
            # Step 4: Create an updated version of the report with customer insights
            updated_report_content = f"""# Monthly Sales Report - Updated

## Key Metrics
- Revenue: $95,000
- New Customers: 28
- Total Customers: {customer_lines if read_response else 0}
- Customer Retention: 92%

## Customer Analysis
Based on our customer database analysis, we found {customer_lines if read_response else 0} active customers with diverse industry backgrounds.

## Next Steps
- Focus on customer retention strategies
- Expand into high-value customer segments
- Review monthly performance metrics"""
            
            updated_report_result = await client.write_file(
                path='reports/monthly-sales-updated.md',
                content=updated_report_content,
                content_type='text/markdown'
            )

            if updated_report_result:
                print('✅ Updated sales report created with customer metrics')
                operations_completed += 1

            print('Step 5: Checking what files we have...')
            
            # Step 5: List files to see our progress
            list_result = await client.list_files(limit=20)

            if list_result and list_result.data.files:
                file_count = len(list_result.data.files)
                print(f'✅ Current project has {file_count} files')
                operations_completed += 1

            print('Step 6: Getting report file details...')
            
            # Step 6: Get metadata of our updated report
            metadata_result = await client.get_metadata(path='reports/monthly-sales-updated.md')

            if metadata_result and metadata_result.data:
                version = metadata_result.data.version or 1
                size = format_file_size(metadata_result.data.size or 0)
                print(f'✅ Report details: v{version}, {size}')
                operations_completed += 1

            print('Step 7: Checking report version history...')
            
            # Step 7: Check version history of our updated report
            versions_result = await client.get_versions(path='reports/monthly-sales-updated.md')

            if versions_result and versions_result.data.versions:
                version_count = len(versions_result.data.versions)
                print(f'✅ Report has {version_count} versions (shows edit history)')
                operations_completed += 1

        # Success summary
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        print()
        print('✅ Tools Integration Complete')
        print(f'📊 Operations completed: {operations_completed}')
        print(f'⏱️  Duration: {duration:.0f}ms')
        print(f'🛠️  Tools available: {len(project_tools.openai.definitions)}')
        integration_mode = 'AI-powered function calling' if use_ai else 'Direct tool execution'
        print(f'🤖 Integration mode: {integration_mode}')
        
        if use_ai:
            print('💡 AI automatically selected appropriate tools for business tasks')
        else:
            print('💡 Manual tool execution - perfect for custom AI frameworks')

    except Exception as error:
        print()
        error_message = str(error) if hasattr(error, '__str__') else repr(error)
        print(f'❌ Integration failed: {error_message}')
        sys.exit(1)


# Integration patterns for custom AI frameworks:

async def create_scoped_conversation(
    openai: OpenAIClient,
    client: OpenFilesClient,
    scope: str = None,
    session_id: str = None
) -> Dict[str, Any]:
    """
    Pattern: AI Function Calling with Scoped Organization
    """
    # Generate session ID if not provided for test isolation
    if not session_id:
        session_id = generate_session_id()
    
    # Create unified tools for the conversation scope
    scoped_client = client.with_base_path(scope) if scope else client
    conversation_tools = OpenFilesTools(scoped_client)
    
    async def process(prompt: str) -> Dict[str, Any]:
        response = openai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            tools=[tool.to_dict() for tool in conversation_tools.openai.definitions],
            temperature=0.3
        )
        
        result = await conversation_tools.openai.process_tool_calls(response)
        return {
            **result.__dict__,
            'scope': scope,
            'session_id': session_id
        }
    
    return {
        'process': process,
        'tools': conversation_tools,
        'client': scoped_client
    }


def main() -> None:
    """Run the example if called directly"""
    asyncio.run(tools_integration_example())


if __name__ == '__main__':
    main()