# Deploy Workflow Skill

Step-by-step Railway deployment workflow with pre-deploy checks, build verification, post-deploy health checks, and Telegram notification.

## Pre-Deploy Checklist

1. **Verify build passes**: Run the project's build command (`npm run build`, `cargo build`, etc.)
2. **Run tests**: All tests must pass (`npm test`, `cargo test`, etc.)
3. **Run linter**: Code must be lint-clean (`npm run lint`, `ruff check .`, etc.)
4. **Run typecheck**: If applicable (`npm run typecheck`, `tsc --noEmit`, etc.)
5. **Check for exposed secrets**: Scan diff for hardcoded keys, tokens, or credentials
6. **Verify environment variables**: Ensure all required env vars are set in Railway

## Deployment Steps

1. **Link to Railway project**: Use `railway_link_environment` and `railway_link_service` if not already linked
2. **Verify service config**: Use `railway_get_service_config` to confirm build command, start command, and health check
3. **Set environment variables**: Use `railway_set_variables` to update any changed variables (with `skip_deploys: true`)
4. **Deploy**: Use `railway_deploy` with a descriptive message including version or commit hash
5. **Monitor deployment**: Use `railway_list_deployments` to track status, `railway_get_logs` for build/deploy logs

## Post-Deploy Verification

1. **Check deployment status**: Use `railway_environment_status` to verify all services are healthy
2. **Check logs**: Use `railway_get_logs` with `log_type: "http"` to verify requests are succeeding
3. **Check error rate**: Use `railway_http_error_rate` to verify error rate is within acceptable bounds
4. **Check response times**: Use `railway_http_response_time` to verify performance

## Notification

On success or failure, send a Telegram notification:
- Use `telegram_send_message` with a summary of the deployment
- Include: service name, deployment ID, status, any errors
- Format: `[Service] deployment [status] — [details]`

## Rollback

If deployment fails:
1. Check logs to identify the cause
2. If infrastructure issue, fix config and re-deploy
3. If code issue, revert the relevant commit and deploy the previous version
