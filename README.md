# Confidential Chat

A private, developer-friendly chat application focused on security, local control, and extensibility.

## Overview

Confidential Chat keeps sensitive conversations local-first and configurable. It supports pluggable model providers and storage backends with a simple developer experience for extending prompts, tools, and UI components.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` with your config (see examples below), then start the dev server:
```bash
npm run dev
```

3. Build and run for production:
```bash
npm run build
npm start
```

## Configuration

Create a `.env` in the repo root. Common variables:
```bash
# model providers
OPENAI_API_KEY=your_key_here
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/

# storage / database (examples)
DATABASE_URL=postgres://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379

# app
PORT=3000
NODE_ENV=development
```
If available, copy from sample:
```bash
cp .env.example .env
```

## Scripts

Check `package.json` for available scripts. Common ones:
- dev: start the development server
- build: compile/build the application
- start: run the production server
- lint: run linters
- test: run tests

Example:
```bash
npm run lint
```

## Project Structure (typical)

```
/ (repo root)
  README.md
  package.json
  .env.example
  src/
    server/           # API / server logic
    client/           # UI / frontend
    lib/              # shared utilities
    models/           # provider integrations, model configs
    storage/          # DB / vector / file adapters
```

## Extending

- Add tools/agents under `src/lib` or dedicated directories
- Add a provider by implementing an adapter and wiring configuration
- Add a storage backend via an adapter under `src/storage`, configured via env

## Security

- Prefer local/self-hosted providers for sensitive data
- Keep API keys in `.env` and never commit them
- Review network egress and redact PII before sending to third parties

## Troubleshooting

- Ensure required env vars are set
- Reinstall deps: `rm -rf node_modules && npm install`
- Use Node.js >= 18
- Check terminal logs for stack traces

## License

Proprietary. All rights reserved. Update this section if needed.

## Contributing

- Open an issue for proposals or bugs
- Follow code style and conventions
- Include tests when adding functionality
