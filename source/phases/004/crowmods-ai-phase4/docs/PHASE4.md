# Phase 4 Security Notes

Prototype approval workflow:
PENDING_REVIEW -> APPROVED
PENDING_REVIEW -> REJECTED

Production requirements:
- Authenticate every admin endpoint.
- Add RBAC (owner/reviewer/publisher).
- Require re-authentication or passkey for approval.
- Record actor identity in every audit event.
- Add CSRF protection.
- Move data to PostgreSQL.
- Use a durable audit/event store.
- Add an explicit publishing gate so approval alone cannot bypass
  authorization or security checks.
