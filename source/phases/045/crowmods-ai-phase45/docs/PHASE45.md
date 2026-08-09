# Phase 45 Notes

## RAG flow

verified source
-> chunk
-> PostgreSQL text index
-> retrieval
-> relevance filtering
-> grounded prompt
-> AI answer
-> source references
-> confidence
-> escalation if insufficient

## Source priority

Prefer:
1. approved CrowMods release pages;
2. verified internal documentation;
3. official platform/provider documentation;
4. approved support policies.

Do not treat random community messages as authoritative facts.

## Hallucination control

The answer generator should:
- receive only retrieved context;
- cite source IDs/URLs;
- distinguish facts from suggestions;
- refuse to invent missing details;
- escalate low-confidence questions.

## Production upgrade

For a larger knowledge base, replace or supplement PostgreSQL text search with
a vector/embedding index. Keep the same source IDs and audit trail so retrieval
remains explainable.

## Privacy

Do not ingest unnecessary personal information from community messages. Apply
retention, access control and deletion policies to user-generated content.
