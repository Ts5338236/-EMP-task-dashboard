from typing import List, Dict, Any, Optional

# 12 Deterministic Helpdesk mock records with overlapping IDs to demonstrate system independence
HELPDESK_RAW_TASKS: List[Dict[str, Any]] = [
    {
        "id": "101",  # Overlapping ID with CRM task 101
        "title": "Investigate production payment gateway webhook failures and 502 spikes",
        "description": "Stripe transaction callbacks returning intermittent 502 Bad Gateway errors during peak traffic.",
        "employee": "Alex Rivera",
        "status": "Pending",
        "deadline": "2026-10-29T11:30:00Z",  # Due today
        "urgency": "Urgent",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/101"
    },
    {
        "id": "102",  # Overlapping ID with CRM task 102
        "title": "Resolve SSO login loop for enterprise Azure Active Directory tenants",
        "description": "SAML token expiration offset causing continuous authentication loop for European branch users.",
        "employee": "Tushar Gupta",
        "status": "In Progress",
        "deadline": "2026-10-28T16:00:00Z",  # Overdue (past)
        "urgency": "Urgent",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/102"
    },
    {
        "id": "103",  # Overlapping ID with CRM task 103
        "title": "Troubleshoot application database connection timeout on reporting worker",
        "description": "Nightly batch report queries locking read replica tables and causing query client dropouts.",
        "employee": "Alex Rivera",
        "status": "Pending",
        "deadline": "2026-10-30T09:00:00Z",  # Due tomorrow (within 48h)
        "urgency": "High",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/103"
    },
    {
        "id": "104",  # Overlapping ID with CRM task 104
        "title": "Assist enterprise admin user with MFA hardware token reset",
        "description": "Security officer lost YubiKey; verify identity through secondary video channel before reprovisioning.",
        "employee": "Sarah Jenkins",
        "status": "Completed",
        "deadline": "2026-10-27T14:00:00Z",  # Past completed
        "urgency": "High",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/104"
    },
    {
        "id": "105",  # Overlapping ID with CRM task 105
        "title": "Investigate transactional email delivery delay and bounce spikes",
        "description": "SendGrid IP reputation degraded due to quarantine flag on marketing subaccount.",
        "employee": "Michael Chang",
        "status": "In Progress",
        "deadline": "2026-10-29T17:30:00Z",  # Due today
        "urgency": "High",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/105"
    },
    {
        "id": "106",  # Overlapping ID with CRM task 106
        "title": "Review reported UI rendering bug in Safari mobile invoice view",
        "description": "CSS flexbox collapse causing payment receipt download button to clip out of viewport.",
        "employee": "Emily Watson",
        "status": "Pending",
        "deadline": "2026-10-31T18:00:00Z",  # Within 48h
        "urgency": "Medium",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/106"
    },
    {
        "id": "107",  # Overlapping ID with CRM task 107
        "title": "Resolve internal VPN connectivity dropouts on WireGuard gateway",
        "description": "Remote engineering staff experiencing MTU fragmentation disconnects on Linux kernels.",
        "employee": "Alex Rivera",
        "status": "Completed",
        "deadline": "2026-10-26T12:00:00Z",  # Past completed
        "urgency": "Medium",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/107"
    },
    {
        "id": "108",  # Overlapping ID with CRM task 108
        "title": "Investigate push notification latency on iOS client app builds",
        "description": "APNS payload batching causing 10-minute delivery delay for high-priority alerts.",
        "employee": "Tushar Gupta",
        "status": "In Progress",
        "deadline": "2026-11-03T11:00:00Z",  # Upcoming future
        "urgency": "Medium",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/108"
    },
    {
        "id": "109",  # Overlapping ID with CRM task 109
        "title": "Resolve software configuration problem on staging environment Redis cluster",
        "description": "Eviction policy improperly set to noeviction instead of volatile-lru on cache nodes.",
        "employee": "Michael Chang",
        "status": "Pending",
        "deadline": None,  # No deadline
        "urgency": "Low",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/109"
    },
    {
        "id": "110",  # Overlapping ID with CRM task 110
        "title": "Respond to enterprise customer ticket regarding GDPR data export SLA",
        "description": "Provide secure S3 presigned archive link containing user audit log bundle.",
        "employee": "Sarah Jenkins",
        "status": "Pending",
        "deadline": "2026-10-28T10:00:00Z",  # Overdue (past)
        "urgency": "Urgent",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/110"
    },
    {
        "id": "111",  # Overlapping ID with CRM task 111
        "title": "Update internal documentation for incident response on-call rotation",
        "description": "Refresh PagerDuty escalation policies and team contact directory for November.",
        "employee": "Emily Watson",
        "status": "In Progress",
        "deadline": "2026-11-06T15:00:00Z",  # Upcoming future
        "urgency": "Low",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/111"
    },
    {
        "id": "112",  # Overlapping ID with CRM task 112
        "title": "Patch and renew SSL TLS certificates on internal monitoring dashboard",
        "description": "Let's Encrypt automated certbot renew cron job completed successfully.",
        "employee": "Alex Rivera",
        "status": "Completed",
        "deadline": "2026-10-25T14:00:00Z",  # Past completed
        "urgency": "Low",
        "source": "Helpdesk",
        "url": "/mock/helpdesk/112"
    }
]

def get_helpdesk_tasks() -> List[Dict[str, Any]]:
    """Returns a deterministic copy of the raw Helpdesk tasks list."""
    return [task.copy() for task in HELPDESK_RAW_TASKS]

def get_helpdesk_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
    """Lookup a single Helpdesk task by ID."""
    for task in HELPDESK_RAW_TASKS:
        if str(task["id"]) == str(task_id):
            return task.copy()
    return None
