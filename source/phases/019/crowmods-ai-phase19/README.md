# CrowMods AI — Phase 19: AI Content Engine

Adds a structured AI-content layer for authorized releases.

Capabilities:
- release metadata normalization
- title/short description/long description drafts
- feature extraction from supplied metadata
- release-notes drafts
- SEO metadata
- Telegram/Discord/social copy variants
- deterministic quality checks
- AI-provider abstraction
- human approval before public publishing

The provider adapter is intentionally generic. Add your chosen AI provider
through server-side credentials only.

Do not ask the model to invent app capabilities, security claims, download
links, ratings, licenses, or permissions. Generated content must be grounded
in verified release metadata.
