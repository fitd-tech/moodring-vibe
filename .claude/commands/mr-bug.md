Perform this request using the bug-investigator subagent: $ARGUMENTS

If you are having trouble finding the cause of the bug, always try to run the development servers with debug logs and check their output yourself before asking for the user to do it.
Then use the pre-commit-quality-guard subagent to check for compliance.
DO NOT stage, commit, or push the changes. This will be performed by the user in a separate request when the bug is resolved.