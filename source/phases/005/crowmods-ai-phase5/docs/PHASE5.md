# Phase 5 Notes

The prototype creates a public listing but intentionally does not expose the
quarantined APK binary.

Production publishing should:
- authenticate the publisher;
- verify approval and authorization;
- move/copy only approved files to private object storage;
- serve downloads through controlled URLs/CDN;
- use short-lived signed URLs where appropriate;
- keep database and object storage separate;
- record publication and takedown events;
- support rights-holder/takedown workflows;
- never expose quarantine paths.

The next phase will add the Telegram publishing job after the website
publication gate is working.
