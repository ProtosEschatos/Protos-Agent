# /deploy

Trigger: Ops & Docs agent

Workflow:
1. Run pre-deploy checks (build, test, lint)
2. Deploy to Railway using the railway MCP tools
3. Run post-deploy health checks
4. Notify result via Telegram

Usage: `/deploy [service_name]`
