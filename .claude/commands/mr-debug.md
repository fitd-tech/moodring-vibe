Perform this request using the bug-investigator subagent: $ARGUMENTS

Iterate over the problem until it is solved or you determine you need user input. 
Use the ios-simulator MCP server to resolve the problem, if necessary. Use describe-elements to view the page and the results of your interactions - you work with that information better and more quickly. Run the development servers yourself and monitor the logs to get more information about the issue.

MANDATORY: Make sure your bugfix changes don't break other parts of the app. Look at areas that might be affected and proactively update them to match your changes.
DO NOT stage, commit, or push the changes. This will be performed by the user in a separate request when the bug is resolved.