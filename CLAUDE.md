@AGENTS.md

## Project Overview  

AI-powered weekly report generator. Connects to GitHub, summarizes  commits with AI, generates shareable report pages.  

## Tech Stack  

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 for styling
- NextAuth.js for GitHub OAuth  
- DeepSeek API (via OpenAI-compatible SDK) for summarization  
- Jest for unit and integration testing  

## Code Style  

- Use server components by default, 'use client' only when needed  
- API routes in app/api/, use Route Handlers  
- Prefer named exports  
- Error handling: always use try-catch in API routes  

## Testing  

- Run `npm run lint` before committing  
- Run `npm test` before committing (unit + integration tests)  
- Test API routes with curl before building UI  
- Agent evaluation: `npm run test:eval` (mock) or `npm run test:eval:real` (real API)
