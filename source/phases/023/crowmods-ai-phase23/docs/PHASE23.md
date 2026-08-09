# Phase 23 Notes

Media flow:

source asset
-> private quarantine
-> validation
-> isolated image processor
-> optimization/resizing
-> metadata/alt text
-> READY
-> website/CDN
-> platform-specific campaign assets

Recommended variants:
- web card thumbnail
- release-page icon
- Open Graph image
- Telegram preview
- Discord preview
- square social image
- landscape social image

Security:
- validate file signatures;
- cap dimensions and decompressed pixel count;
- prevent decompression bombs;
- use maintained libraries;
- strip unnecessary EXIF metadata;
- keep originals private;
- use immutable object keys;
- scan uploaded images where appropriate.

AI-generated marketing artwork should be reviewed for factual accuracy and
should not imitate trademarks or imply endorsement without authorization.
