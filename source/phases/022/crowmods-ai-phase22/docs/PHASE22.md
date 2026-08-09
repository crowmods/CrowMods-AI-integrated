# Phase 22 Notes

Discovery ranking currently uses explainable signals:
- downloads
- views
- freshness

Later AI ranking can add semantic similarity between a user's search and
verified release metadata.

Privacy:
- use anonymous session identifiers where possible;
- avoid collecting sensitive personal traits;
- provide appropriate privacy controls;
- do not create hidden behavioral profiles;
- respect opt-out/consent requirements.

Search quality improvements:
- PostgreSQL full-text search/trigram indexes;
- synonyms;
- typo tolerance;
- category facets;
- package-name matching;
- version filters;
- language metadata;
- AI semantic search.
