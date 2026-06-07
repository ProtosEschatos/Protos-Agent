# /run-plan

Trigger: Protos agent

Workflow:
1. Read the plan file (default: latest plan in `.kilo/plans/` or `~/.local/share/kilo/plans/`)
2. Identify actionable tasks (checkbox items, numbered lists, markdown headings)
3. For each task, determine the best agent from the roster using the Agent Selection Strategy
4. Present the task-to-agent mapping to the user for confirmation
5. Execute tasks sequentially via the matched agents, reporting progress after each
6. Report completion summary with outcomes per agent

Usage: `/run-plan [plan_file_path]`
