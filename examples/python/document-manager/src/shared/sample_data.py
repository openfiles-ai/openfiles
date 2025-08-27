"""
Sample data for integration examples - versatile business use cases
"""

from datetime import datetime
from typing import Dict, Any


def format_file_size(bytes: int) -> str:
    """
    Format file size intelligently based on size
    - >= 1MB: Show in MB (e.g., "2.5MB")
    - >= 1KB: Show in KB (e.g., "256KB") 
    - < 1KB: Show in bytes (e.g., "512 bytes")
    """
    if bytes == 0:
        return '0 bytes'
    
    if bytes >= 1024 * 1024:
        mb = bytes / (1024 * 1024)
        return f"{round(mb * 10) / 10}MB"
    elif bytes >= 1024:
        kb = round(bytes / 1024)
        return f"{kb}KB"
    else:
        return f"{bytes} bytes"


# Sample CSV data for reports
sales_data_csv = """Date,Region,Product,Revenue,Units Sold,Customer Type
2024-01-15,North America,Enterprise License,25400,12,Enterprise
2024-01-15,Europe,Professional Plan,8900,45,SMB
2024-01-15,Asia Pacific,Starter Plan,3200,28,Startup
2024-01-16,North America,Professional Plan,12300,67,SMB
2024-01-16,Europe,Enterprise License,34500,8,Enterprise
2024-01-16,Asia Pacific,Professional Plan,6700,34,SMB
2024-01-17,North America,Starter Plan,2100,15,Startup
2024-01-17,Europe,Professional Plan,15600,89,SMB
2024-01-17,Asia Pacific,Enterprise License,28900,6,Enterprise"""

customer_data_csv = """Customer ID,Company Name,Industry,Plan Type,Monthly Revenue,Status
CUST001,TechStart Inc,Technology,Professional,899,Active
CUST002,Global Manufacturing,Manufacturing,Enterprise,2500,Active
CUST003,Digital Marketing Co,Marketing,Starter,299,Active
CUST004,Healthcare Solutions,Healthcare,Enterprise,3200,Active
CUST005,Retail Chain Ltd,Retail,Professional,1299,Trial
CUST006,Financial Services,Finance,Enterprise,4500,Active
CUST007,Education Platform,Education,Starter,199,Active
CUST008,Logistics Corp,Logistics,Professional,1599,Inactive"""

# Sample JSON configurations
app_config: Dict[str, Any] = {
    "app": {
        "name": "OpenFiles Demo",
        "version": "1.0.0",
        "environment": "production"
    },
    "database": {
        "host": "localhost",
        "port": 5432,
        "name": "demo_app",
        "ssl": True
    },
    "features": {
        "analytics": True,
        "notifications": True,
        "apiRateLimit": 1000
    },
    "integrations": {
        "openai": {
            "enabled": True,
            "model": "gpt-4o-mini"
        },
        "email": {
            "provider": "sendgrid",
            "templatesEnabled": True
        }
    }
}

# Sample report template
monthly_report_template = f"""# Monthly Business Report - January 2024

## Key Performance Indicators
- Total Revenue: $125,000
- New Customers: 85
- Customer Retention: 92%
- Average Order Value: $1,470

## Sales Performance
Strong growth across all regions with North America leading at 60% of total revenue.

## Customer Insights
Enterprise customers showing highest retention rates. SMB segment growing rapidly.

## Next Month Goals
- Increase revenue to $140,000
- Expand into European markets
- Launch new enterprise features

---
Generated: {datetime.now().strftime('%Y-%m-%d')}"""

# Sample log data
application_logs = """[2024-01-20 09:15:32] INFO: Application started successfully
[2024-01-20 09:15:33] INFO: Database connection established
[2024-01-20 09:15:34] INFO: API server listening on port 3000
[2024-01-20 09:16:45] INFO: User authentication successful - user_id: 1234
[2024-01-20 09:17:12] WARN: High memory usage detected - 85% utilization
[2024-01-20 09:18:23] INFO: Background job completed - job_id: bg_001
[2024-01-20 09:19:08] ERROR: Failed to process payment - payment_id: pay_789
[2024-01-20 09:20:15] INFO: Email sent successfully - recipient: user@example.com"""

sample_reports = {
    "monthly_sales": monthly_report_template,
    
    "quarterly_financial": """# Q4 2023 Financial Report

## Financial Overview
OpenFiles achieved strong financial performance in Q4 2023, with revenue growth of 28% year-over-year.

## Revenue Breakdown
- **SaaS Subscriptions**: $890,000 (78%)
- **Professional Services**: $180,000 (16%) 
- **Training & Support**: $70,000 (6%)

## Expenses
- **Personnel**: $520,000
- **Infrastructure**: $145,000
- **Marketing**: $98,000
- **Operations**: $67,000

## Net Profit: $310,000

## 2024 Projections
Based on current growth trends, we project:
- Q1 2024 Revenue: $1,200,000
- Annual Growth: 35%
- New market expansion: 3 regions
""",

    "team_standup": """# Team Standup Meeting - January 15, 2024

**Attendees**: Sarah (PM), Mike (Dev), Lisa (Design), John (QA)  
**Duration**: 30 minutes

## Yesterday's Accomplishments
- **Mike**: Completed user authentication API
- **Lisa**: Finalized dashboard wireframes  
- **John**: Set up automated testing pipeline
- **Sarah**: Reviewed sprint backlog with stakeholders

## Today's Goals
- **Mike**: Start payment integration module
- **Lisa**: Begin dashboard UI implementation
- **John**: Write integration tests for auth API
- **Sarah**: Sprint planning for next iteration

## Blockers & Concerns
- **Mike**: Waiting for payment provider API documentation
- **Lisa**: Need approval on color palette from brand team
- **John**: Testing environment needs database reset
- **Sarah**: Stakeholder feedback still pending on user stories

## Action Items
- [ ] Sarah to follow up with payment provider (Due: Jan 16)
- [ ] Lisa to schedule brand review meeting (Due: Jan 17)
- [ ] John to request DevOps support for test DB (Due: Jan 16)
- [ ] Team retrospective scheduled for Jan 19

## Next Meeting: January 16, 2024 @ 9:00 AM
"""
}

sample_policies = {
    "remote_work": """# Remote Work Policy

**Effective Date**: January 1, 2024  
**Last Updated**: January 1, 2024  
**Policy Owner**: Human Resources

## Purpose
This policy establishes guidelines for remote work arrangements to ensure productivity, security, and team collaboration.

## Eligibility
- Full-time employees after 90-day probationary period
- Role must be suitable for remote work
- Demonstrated ability to work independently
- Manager approval required

## Work Arrangements
### Fully Remote
- Work from any location within approved time zones
- Required quarterly in-person meetings
- Home office setup stipend: $1,500

### Hybrid Schedule
- Minimum 2 days in office per week
- Core collaboration hours: 10 AM - 3 PM local time
- Flexible scheduling with manager approval

## Equipment & Technology
- Company-provided laptop and monitor
- High-speed internet requirement: 25 Mbps minimum
- VPN access for all work activities
- Security software installation mandatory

## Performance Standards
- Regular check-ins with direct manager
- Participation in team meetings and collaboration
- Adherence to company communication standards
- Deliverable-based performance measurement

## Security Requirements
- Use of company-approved software only
- Secure workspace requirements
- Data encryption for sensitive information
- Regular security training completion

## Approval Process
1. Submit remote work request form
2. Manager review and approval
3. HR policy acknowledgment
4. IT equipment and access setup
5. 30-day trial period evaluation

## Policy Review
This policy will be reviewed annually and updated as needed to reflect changing business needs and best practices.

For questions, contact HR at hr@company.com
""",

    "data_retention": """# Data Retention Policy

**Document Version**: 2.1  
**Effective Date**: December 1, 2023  
**Review Date**: December 1, 2024

## Overview
This policy defines how long different types of business data must be retained and when they can be safely disposed of.

## Data Classifications

### Customer Data
- **Personal Information**: Retain for 7 years after account closure
- **Payment Records**: Retain for 7 years per financial regulations
- **Support Interactions**: Retain for 3 years
- **Usage Analytics**: Retain for 2 years (anonymized)

### Employee Data  
- **Personnel Files**: Retain for 7 years after termination
- **Payroll Records**: Retain for 7 years per tax requirements
- **Performance Reviews**: Retain for 5 years
- **Training Records**: Retain for duration of employment + 2 years

### Business Records
- **Financial Statements**: Permanent retention
- **Tax Returns**: Retain for 7 years
- **Contracts**: Retain for 7 years after expiration
- **Audit Reports**: Retain for 7 years

### Technical Data
- **System Logs**: Retain for 1 year
- **Backup Data**: Retain for 3 months (rolling)
- **Source Code**: Permanent retention with version control
- **Documentation**: Retain while current + 2 years

## Disposal Procedures
- Secure deletion using DoD 5220.22-M standards
- Certificate of destruction for physical media
- Encrypted data must be cryptographically erased
- Third-party disposal vendors must be certified

## Exceptions
Legal holds and pending litigation may require extended retention periods. Consult legal department before disposal of any data subject to legal proceedings.

## Compliance
This policy ensures compliance with:
- GDPR (General Data Protection Regulation)
- SOX (Sarbanes-Oxley Act)
- State and federal privacy laws
- Industry-specific regulations

## Implementation
Department heads are responsible for implementing retention schedules within their areas. IT Department provides technical support for secure disposal.

**Policy Contact**: Legal Department - legal@company.com
"""
}


def get_current_timestamp() -> str:
    """Get current date in YYYY-MM-DD format"""
    return datetime.now().strftime('%Y-%m-%d')


def get_monthly_report_path(month: str, year: str) -> str:
    """Generate path for monthly report"""
    return f"reports/monthly-sales-{year}-{month.zfill(2)}.md"


def get_policy_path(policy_name: str) -> str:
    """Generate path for policy document"""
    return f"policies/{policy_name}-policy.md"


def get_meeting_note_path(date: str) -> str:
    """Generate path for meeting notes"""
    return f"meeting-notes/team-standup-{date}.md"


# Helper to create sample file paths
sample_paths = {
    "january_sales": get_monthly_report_path('01', '2024'),
    "february_sales": get_monthly_report_path('02', '2024'),
    "q4_financial": 'reports/quarterly-financial-Q4-2023.md',
    "team_standup": get_meeting_note_path('2024-01-15'),
    "remote_work_policy": get_policy_path('remote-work'),
    "data_retention_policy": get_policy_path('data-retention')
}