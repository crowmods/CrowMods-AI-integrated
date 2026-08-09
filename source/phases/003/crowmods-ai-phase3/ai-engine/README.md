# Crow AI Engine

The AI engine consumes structured metadata rather than executing APK code.

Target interface:

processRelease(metadata) -> {
  title,
  shortDescription,
  description,
  category,
  tags,
  features,
  whatsNew,
  seoTitle,
  seoDescription,
  socialCaptions
}

For a ₹0-first setup, use a local/open-source model where practical.
If using an external provider later, keep API keys server-side.
