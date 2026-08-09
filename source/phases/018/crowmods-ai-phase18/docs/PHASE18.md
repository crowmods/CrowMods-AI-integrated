# Phase 18 Security and Autonomy Boundary

Crow AI is an orchestrator, not an unrestricted autonomous agent.

Allowed:
- inspect release state;
- create safe processing jobs;
- monitor job state;
- retry idempotent jobs;
- generate content drafts;
- produce analytics recommendations.

Approval required:
- public publishing;
- financial changes;
- account/permission changes;
- security configuration changes;
- irreversible deletion;
- content distribution where authorization is uncertain.

Never:
- execute uploaded APKs;
- bypass platform APIs/rate limits;
- create fake accounts;
- manipulate engagement;
- claim security results without evidence.

The policy engine can later be backed by an AI model, but model output must
still pass deterministic authorization and policy checks before an action is
queued.
