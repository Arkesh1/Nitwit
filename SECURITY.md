# Security

## API keys and secrets

Never commit `.env`, Discord bot tokens, Groq API keys, or other credentials to GitHub.

Use `.env.example` as the template for local configuration.

If a secret is accidentally committed, revoke/rotate it immediately and remove it from the repository history.

## Reporting a security issue

For a private security report, use GitHub's private vulnerability reporting if it is enabled for the repository. Do not publish active credentials in an issue.
