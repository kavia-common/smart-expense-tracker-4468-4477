#!/bin/bash
cd /home/kavia/workspace/code-generation/smart-expense-tracker-4468-4477/expense_tracker_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

