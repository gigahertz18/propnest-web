# Third-Party Integrations — Frontend Feature Specification

**Status:** Planned / Last phase

## Providers in roadmap

- GCash
- Maya
- Xero
- QuickBooks
- Google Calendar
- Outlook
- Drive/Dropbox
- SMS gateway

The backend roadmap explicitly delays integrations until active non-family users exist. fileciteturn5file17

## UX principle

Integrations should appear as configuration/status capabilities, not leak provider mechanics into core business screens.

Recommended conceptual page:

```text
Settings
  ↓
Integrations
  ├─ Payments
  ├─ Accounting
  ├─ Calendar
  ├─ Storage
  └─ Notifications
```

## Acceptance criteria

- Provider connection status is explicit.
- Credentials/tokens are never displayed back to the user.
- Core workflows remain usable when an integration is disconnected unless the backend explicitly requires it.
- Provider-specific UI is isolated.
