# CrowMods AI — Phase 23: Media & Asset Pipeline

Adds a structured media-asset layer for authorized release artwork.

Supported asset types:
- app icons
- screenshots
- banners
- thumbnails
- Telegram artwork
- social artwork

The pipeline stores metadata and creates processing jobs. Actual image
transformation should run in isolated workers using trusted image libraries.

Do not scrape or reuse copyrighted artwork without permission. Generated
marketing artwork must not falsely imply official endorsement.
