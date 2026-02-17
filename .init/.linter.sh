#!/bin/bash
cd /home/kavia/workspace/code-generation/secure-database-access-platform-53123-53137/mcp_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

