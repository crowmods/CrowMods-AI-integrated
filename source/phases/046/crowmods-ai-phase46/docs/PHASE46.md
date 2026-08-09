# Phase 46 Notes

## Growth loop

visitor
-> release view
-> campaign click
-> download
-> community join
-> purchase
-> revenue attribution
-> analytics
-> AI recommendation
-> reviewed optimization

## Privacy

Use pseudonymous analytics IDs instead of unnecessary direct identifiers.
Do not collect precise location, contacts, message contents or other personal
data unless genuinely necessary and lawfully handled.

Provide:
- privacy notice;
- consent controls where required;
- retention limits;
- deletion mechanisms;
- access controls;
- audit logs.

## Revenue

Revenue is stored as integer minor units (for example, paise for INR) to avoid
floating-point money errors.

Never store payment-card data in this analytics service. Use a compliant
payment provider and store only provider transaction references and permitted
metadata.

## AI growth recommendations

Recommendations should be evidence-based and advisory. Avoid automatically
changing campaign frequency, pricing, targeting or community behavior without
appropriate review.

## Next

Connect analytics events to the campaign connector results, website download
events, community manager events and an attribution model.
