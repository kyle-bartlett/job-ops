# Job-Ops Napkin

## Session: 2026-02-12 - Initial Setup

### What was done
- Explored full project structure and understood architecture
- Created `.env` file with Kyle's profile-tailored search terms and location settings
- Started Colima Docker runtime (was stopped, had stale disk lock - fixed with `colima stop --force`)
- Pulled `ghcr.io/dakheera47/job-ops:latest` image and started container
- Container is healthy at http://localhost:3005
- Configured 11 job search terms matching Kyle's skills
- Set location to Texas, country to USA
- Set LLM provider to OpenAI with gpt-4o model

### LLM Provider Fix
- Added `openai_compatible` provider to job-ops that uses standard `/v1/chat/completions` format with API key support
- The built-in `openai` provider uses the newer `/v1/responses` API which the Anker proxy doesn't support
- Modified files (copied into running container via `docker cp`):
  - `orchestrator/src/server/services/llm/types.ts` - added `openai_compatible` to LlmProvider type
  - `orchestrator/src/server/services/llm/providers/openai-compatible.ts` - new provider strategy
  - `orchestrator/src/server/services/llm/providers/index.ts` - registered new strategy
  - `orchestrator/src/server/services/llm/service.ts` - updated normalizeProvider()
- LLM validation passed with Anker proxy!

### What still needs doing
- **RxResume Account**: Kyle needs to create an account at https://v4.rxresu.me and upload his resume. Then configure credentials via the web UI onboarding at http://localhost:3005
- **Base Resume Selection**: After RxResume account is set up, select a base resume template in the onboarding wizard
- **Docker rebuild**: The code changes were copied into the running container with `docker cp` - if the container is recreated from the image, changes will be lost. Need to rebuild the image eventually with `docker compose build`.

### Mistakes / Learnings
- Docker context was set to `colima` but Colima wasn't running - needed `colima stop --force` then `colima start` to clear stale disk lock
- Kyle uses Anker's AI Router proxy (OpenAI-compatible, routes through AWS Bedrock). The token IS shorter than normal - this is expected, not expired.
- The built-in `openai` provider uses `/v1/responses` (new API) not `/v1/chat/completions`. Had to create `openai_compatible` provider.
- The app is primarily configured through the web UI onboarding wizard, not just env vars
- Profile/resume data comes from RxResume v4 API, not local files
- The OpenAI key from LinkedIn machine was an old project-scoped key, not relevant - Anker proxy is the correct key

### Key paths
- App URL: http://localhost:3005
- .env: /Users/kylebartlett/Personal/Career/job-ops/.env
- Data dir: ./data (bind-mounted into container)
- Docker: Colima runtime, `colima` context
