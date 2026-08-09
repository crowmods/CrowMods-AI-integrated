# CrowMods AI — Phase 45: Knowledge Base & RAG Foundation

Adds a grounded knowledge layer for community support and internal AI workflows.

Sources can include:
- approved release pages
- release intelligence
- FAQs
- community rules
- support policies
- verified documentation
- changelogs

Flow:
source -> ingestion -> chunk -> index -> retrieval -> grounded answer draft
-> source references -> confidence -> human escalation when uncertain.

This phase intentionally uses a simple PostgreSQL text-search baseline so the
system is easy to run at ₹0 during development. A production vector database
or managed embedding service can be added later.

AI should answer only from retrieved/verified material and clearly say when
the knowledge base does not contain the requested information.
