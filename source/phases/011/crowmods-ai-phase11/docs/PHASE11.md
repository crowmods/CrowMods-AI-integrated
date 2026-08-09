# Phase 11

The PostgreSQL model now represents the full lifecycle.

Release:
upload -> processing -> approval -> publication -> analytics

Campaign:
campaign -> targets -> publishing jobs -> platform result

Security:
users -> roles -> approvals -> audit events

Production requirements:
- managed PostgreSQL;
- TLS;
- least-privilege database user;
- migrations instead of editing production schema manually;
- automated backups;
- point-in-time recovery where available;
- connection pooling;
- secret manager;
- database monitoring;
- tested restore procedure.
