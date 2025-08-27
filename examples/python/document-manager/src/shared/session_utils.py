#!/usr/bin/env python3
"""
Session Utilities for Test Isolation

Provides unique session IDs and directory prefixes to prevent conflicts
when running tests repeatedly or concurrently between different examples.
"""

import secrets
import string
import time
from typing import Dict, Any


def generate_session_id() -> str:
    """
    Generate a unique session ID for test isolation
    
    Format: 8 random alphanumeric characters + timestamp
    Example: "a7k9m2n5_1693845123"
    
    Returns:
        Unique session identifier
    """
    # Generate 8 random alphanumeric characters
    chars = string.ascii_lowercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(8))
    
    # Add timestamp for additional uniqueness
    timestamp = str(int(time.time()))
    
    return f"{random_part}_{timestamp}"


def create_session_paths(session_id: str, base_prefix: str = "test") -> Dict[str, str]:
    """
    Create session-specific paths for organized testing
    
    Args:
        session_id: Unique session identifier
        base_prefix: Base prefix for the session (e.g., "test", "demo", "ai-gen")
        
    Returns:
        Dictionary of common session paths
    """
    session_base = f"{base_prefix}/session_{session_id}"
    
    return {
        'base': session_base,
        'business_app': f"{session_base}/business-app",
        'ai_generated': f"{session_base}/ai-generated",
        'demo': f"{session_base}/demo",
        'reports': f"{session_base}/reports",
        'config': f"{session_base}/config", 
        'data': f"{session_base}/data",
        'logs': f"{session_base}/logs",
        'analytics': f"{session_base}/analytics",
        'sales_dept': f"{session_base}/sales-dept",
        'data_analytics': f"{session_base}/data-analytics",
        'tools_test': f"{session_base}/tools-test"
    }


def print_session_info(session_id: str, paths: Dict[str, str]) -> None:
    """
    Print session information for debugging and tracking
    
    Args:
        session_id: Current session identifier
        paths: Session paths dictionary
    """
    print(f"🔖 Session ID: {session_id}")
    print(f"📁 Base path: {paths['base']}")
    print("   All test files will be isolated under this session directory")