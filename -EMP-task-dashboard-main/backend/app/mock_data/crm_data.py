from typing import List, Dict, Any, Optional

# 12 Deterministic CRM mock records with diverse employees, statuses, urgencies, and deadlines
CRM_RAW_TASKS: List[Dict[str, Any]] = [
    {
        "id": "101",
        "title": "Follow up with customer on enterprise contract renewal (Apex Global)",
        "description": "Discuss seat expansion for 150 additional users and confirm annual licensing terms before quarter close.",
        "employee": "Tushar Gupta",
        "status": "Pending",
        "deadline": "2026-10-28T14:00:00Z",  # Overdue (past)
        "urgency": "Urgent",
        "source": "CRM",
        "url": "/mock/crm/101"
    },
    {
        "id": "102",
        "title": "Prepare sales quotation for APAC expansion proposal (Initech Corp)",
        "description": "Draft customized multi-region rate card including 24/7 dedicated enterprise support SLA.",
        "employee": "Sarah Jenkins",
        "status": "In Progress",
        "deadline": "2026-10-29T18:00:00Z",  # Due today
        "urgency": "High",
        "source": "CRM",
        "url": "/mock/crm/102"
    },
    {
        "id": "103",
        "title": "Schedule product demo meeting with procurement team (Cyberdyne Systems)",
        "description": "Coordinate calendar availability with solution architect team for automated workflow showcase.",
        "employee": "Tushar Gupta",
        "status": "Pending",
        "deadline": "2026-10-30T11:00:00Z",  # Due tomorrow (within 48h)
        "urgency": "Medium",
        "source": "CRM",
        "url": "/mock/crm/103"
    },
    {
        "id": "104",
        "title": "Update sales opportunity stage and pipeline value (Wayne Enterprises)",
        "description": "Advance deal stage to Stage 4 (Contract Negotiation) following executive sponsor alignment.",
        "employee": "Michael Chang",
        "status": "Completed",
        "deadline": "2026-10-26T16:30:00Z",  # Past completed
        "urgency": "High",
        "source": "CRM",
        "url": "/mock/crm/104"
    },
    {
        "id": "105",
        "title": "Review customer account health score and product usage metrics (Stark Tech)",
        "description": "Analyze 30-day API call volume and identify drop in active webhooks for proactive outreach.",
        "employee": "Sarah Jenkins",
        "status": "Pending",
        "deadline": "2026-10-29T22:00:00Z",  # Due today
        "urgency": "Urgent",
        "source": "CRM",
        "url": "/mock/crm/105"
    },
    {
        "id": "106",
        "title": "Send formal master services agreement proposal (Acme Industrial)",
        "description": "Incorporate legal redlines provided by general counsel and request DocuSign signature.",
        "employee": "Tushar Gupta",
        "status": "In Progress",
        "deadline": "2026-10-31T15:00:00Z",  # Upcoming within 48h
        "urgency": "High",
        "source": "CRM",
        "url": "/mock/crm/106"
    },
    {
        "id": "107",
        "title": "Verify customer billing address and tax exemption certificate (Soylent Inc)",
        "description": "Validate updated state sales tax exemption form for annual subscription invoice dispatch.",
        "employee": "Emily Watson",
        "status": "Completed",
        "deadline": "2026-10-27T10:00:00Z",  # Past completed
        "urgency": "Low",
        "source": "CRM",
        "url": "/mock/crm/107"
    },
    {
        "id": "108",
        "title": "Contact prospective customer who registered for trial tier (Oscorp Bio)",
        "description": "Reach out to VP of Bioinformatics following self-service developer sandbox provisioning.",
        "employee": "Michael Chang",
        "status": "Pending",
        "deadline": "2026-11-04T12:00:00Z",  # Upcoming future
        "urgency": "Low",
        "source": "CRM",
        "url": "/mock/crm/108"
    },
    {
        "id": "109",
        "title": "Update customer contact information and primary billing contact (Umbrella Labs)",
        "description": "Change finance point-of-contact per notification from controller.",
        "employee": "Emily Watson",
        "status": "In Progress",
        "deadline": None,  # No deadline
        "urgency": "Low",
        "source": "CRM",
        "url": "/mock/crm/109"
    },
    {
        "id": "110",
        "title": "Complete post-onboarding sales follow-up call (Massive Dynamic)",
        "description": "Evaluate 14-day user adoption satisfaction and review open engineering requests.",
        "employee": "Sarah Jenkins",
        "status": "Pending",
        "deadline": "2026-10-27T17:00:00Z",  # Overdue (past)
        "urgency": "High",
        "source": "CRM",
        "url": "/mock/crm/110"
    },
    {
        "id": "111",
        "title": "Conduct executive quarterly business review preparation (Hooli Telecom)",
        "description": "Compile slide deck showing ROI, cost savings, and feature requests for executive team.",
        "employee": "Tushar Gupta",
        "status": "In Progress",
        "deadline": "2026-11-02T14:00:00Z",  # Upcoming future
        "urgency": "Medium",
        "source": "CRM",
        "url": "/mock/crm/111"
    },
    {
        "id": "112",
        "title": "Finalize customer reference case study approval (Globex Corp)",
        "description": "Confirm marketing release consent with customer relations VP for website publication.",
        "employee": "Michael Chang",
        "status": "Completed",
        "deadline": "2026-10-25T09:00:00Z",  # Past completed
        "urgency": "Medium",
        "source": "CRM",
        "url": "/mock/crm/112"
    }
]

def get_crm_tasks() -> List[Dict[str, Any]]:
    """Returns a deterministic copy of the raw CRM tasks list."""
    return [task.copy() for task in CRM_RAW_TASKS]

def get_crm_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
    """Lookup a single CRM task by ID."""
    for task in CRM_RAW_TASKS:
        if str(task["id"]) == str(task_id):
            return task.copy()
    return None
