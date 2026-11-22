# Email Templates

## Guardian invitation

- File: `docs/email-templates/guardian-invitation.html`
- Purpose: Premium SkillBridge Academy parent/guardian invitation email.
- Includes placeholders for guardian name, linked learner, auto-generated login email, temporary password, login URL, and support email.

### Placeholders

Replace before sending:

- `{{guardian_name}}`
- `{{student_name}}`
- `{{login_email}}`
- `{{temporary_password}}`
- `{{login_url}}`
- `{{support_email}}`
- `{{academy_name}}` (optional; template already uses SkillBridge Academy branding)

### Integration notes

- **Neon Auth / managed invite emails**: Neon Auth organization invitations are currently sent by the configured auth provider. If Neon/Auth dashboard supports custom email templates, paste/adapt this HTML there.
- **Custom email sender**: If you add a free/approved email provider later, use this HTML as the message body and fill placeholders server-side. Never send secrets from client code.
- **Security**: Temporary passwords should be auto-generated server-side, sent only to the intended guardian email, and users should be prompted to change password after first sign-in.
