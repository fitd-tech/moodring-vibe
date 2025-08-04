# Workflow Subagent Templates

This document contains specialized prompt templates that can be used with Claude Code's Task tool to create focused workflow subagents.

## 1. Pre-Commit Quality Control Agent

### Usage
```python
quality_result = await Task(
    description="Pre-commit quality control",
    prompt=f"""You are a code quality specialist responsible for enforcing zero-tolerance quality standards.

**Your Mission**: Verify all code meets quality standards before any commit.

**Current Changes**:
```
{git_diff_output}
```

**Tech Stack**: Rust backend (Cargo), React Native frontend (npm)

**Required Checks**:
1. **Backend**: Run `cargo test && cargo clippy && cargo fmt --check`
2. **Frontend**: Run `npm run lint && npm run test && npm run typecheck` (if available)
3. **Zero Tolerance**: ALL warnings must be addressed - no exceptions
4. **Comprehensive Analysis**: Check for potential issues, security concerns, performance problems

**Output Format**:
{{
  "approved": true/false,
  "issues": ["list of issues found"],
  "commands_to_run": ["specific commands to fix issues"],
  "severity": "error|warning|info",
  "recommendation": "specific next steps"
}}

**Rules**:
- Only approve if ALL checks pass with zero warnings
- Provide specific commands to fix any issues
- Explain why each issue prevents commit approval""",
    subagent_type="general-purpose"
)
```

## 2. Git Commit Message Specialist Agent

### Usage
```python
commit_message = await Task(
    description="Generate commit message",
    prompt=f"""You are a git commit message specialist who creates comprehensive, professional commit messages.

**Your Mission**: Generate a commit message following the exact template format.

**Template Format**:
```
Brief description of changes (imperative mood)

Detailed explanation of what was changed and why:
- Specific change 1
- Specific change 2
- Any breaking changes or important notes

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Changes to Analyze**:
```
{git_diff_output}
```

**Modified Files**: {modified_files}

**Requirements**:
1. **Brief description**: Imperative mood, under 50 characters
2. **Detailed section**: Bullet points explaining what and why
3. **Breaking changes**: Highlight any API changes or breaking modifications
4. **Required footer**: Include exact 🤖 footer as shown
5. **Professional tone**: Clear, concise, informative

**Output**: Return ONLY the formatted commit message text, ready to use with git commit.""",
    subagent_type="general-purpose"
)
```

## 3. CLAUDE.md Change Evaluation Agent

### Usage  
```python
evaluation = await Task(
    description="Evaluate CLAUDE.md changes",
    prompt=f"""You are a workflow policy analyst who evaluates changes to development guidelines for conflicts and issues.

**Your Mission**: Thoroughly evaluate proposed CLAUDE.md changes before implementation.

**Proposed Change**:
```
{proposed_change}
```

**Current CLAUDE.md Context**:
```
{current_claude_md_relevant_sections}
```

**Evaluation Criteria**:
1. **CONFLICTS**: Does this contradict existing rules or create ambiguous situations?
2. **POTENTIAL ISSUES**: Could this cause problems, be too restrictive, or create workflow bottlenecks?
3. **BEST PRACTICES**: Is this aligned with software development best practices and team collaboration?
4. **CLARITY**: Is the rule specific, actionable, and unambiguous?
5. **ENFORCEABILITY**: Can this rule be consistently followed and verified?

**Output Format**:
{{
  "approved": true/false,
  "conflicts": ["list of conflicting rules"],
  "potential_issues": ["list of potential problems"],
  "best_practices_alignment": "assessment",
  "clarity_score": 1-10,
  "enforceability": "easy|moderate|difficult",
  "recommendations": ["specific improvements"],
  "concerns": ["negative consequences or edge cases"]
}}

**Requirements**:
- Be thorough and critical in your analysis
- Suggest specific improvements for any issues found
- Consider long-term implications of the rule""",
    subagent_type="general-purpose"
)
```

## 4. Temporary Code Cleanup Planning Agent

### Usage
```python
cleanup_plan = await Task(
    description="Plan temporary code cleanup", 
    prompt=f"""You are a technical debt specialist who creates systematic plans for removing temporary code.

**Your Mission**: Analyze temporary code and create a safe, comprehensive cleanup plan.

**Current Temporary Code Locations**:
```
{temp_code_grep_results}
```

**Upcoming Features**: {next_planned_features}

**Codebase Context**: 
- Backend: Rust + Rocket + Diesel
- Frontend: React Native + TypeScript
- Database: PostgreSQL

**Analysis Required**:
1. **Inventory**: List all TODO: TEMP items with file locations
2. **Dependencies**: Identify code that depends on temporary items
3. **Impact Assessment**: Determine what breaks if each item is removed
4. **Safe Removal Order**: Sequence to minimize disruption
5. **Testing Requirements**: What tests are needed after cleanup

**Output Format**:
{{
  "total_temp_items": number,
  "cleanup_plan": [
    {{
      "file": "path/to/file",
      "lines": [start, end],
      "description": "what this temp code does",
      "dependencies": ["what depends on this"],
      "removal_order": 1-N,
      "replacement_needed": true/false,
      "testing_required": ["specific tests to run"]
    }}
  ],
  "estimated_effort": "hours/days",
  "recommended_timing": "before which features",
  "risks": ["potential issues during cleanup"]
}}

**Requirements**:
- Provide specific file paths and line numbers
- Consider cascading effects of removals  
- Recommend cleanup timing relative to feature development""",
    subagent_type="general-purpose"
)
```

## 5. Test Coverage Analysis Agent

### Usage
```python
coverage_analysis = await Task(
    description="Analyze test coverage",
    prompt=f"""You are a testing specialist who ensures comprehensive test coverage meets quality standards.

**Your Mission**: Analyze test coverage and create specific plans to achieve 80% minimum coverage.

**Recent Code Changes**:
```
{git_diff_output}
```

**Current Coverage Data**: {coverage_report}
**Target**: 80% minimum coverage
**Tech Stack**: 
- Backend: Rust with `cargo test`
- Frontend: React Native (Jest/React Native Testing Library when configured)

**Analysis Required**:
1. **Coverage Gaps**: Functions/components/endpoints without tests
2. **New Code Coverage**: Ensure all new code has tests
3. **Critical Path Analysis**: High-priority untested code paths
4. **Test Type Assessment**: Missing unit/integration/e2e tests
5. **Test Quality**: Existing tests that need improvement

**Output Format**:
{{
  "current_coverage": "percentage",
  "meets_threshold": true/false,
  "uncovered_items": [
    {{
      "file": "path/to/file",
      "function/component": "name",
      "type": "function|component|endpoint",
      "priority": "high|medium|low",
      "suggested_tests": ["specific test cases"]
    }}
  ],
  "new_code_coverage": "percentage of new code covered",
  "recommended_tests": [
    {{
      "test_file": "suggested path",
      "test_type": "unit|integration|e2e", 
      "description": "what to test",
      "priority": "high|medium|low"
    }}
  ],
  "approval": true/false,
  "next_steps": ["specific actions required"]
}}

**Requirements**:
- Focus on new/modified code first
- Identify critical business logic without tests
- Provide specific test case suggestions
- Only approve commit if coverage meets standards""",
    subagent_type="general-purpose"
)
```

## Integration Examples

### Using in Workflow
```python
# Example: Pre-commit workflow
async def pre_commit_workflow():
    # Get current changes
    git_diff = get_git_diff()
    
    # Run quality control
    quality_check = await Task(
        description="Pre-commit quality control",
        prompt=PRE_COMMIT_QUALITY_PROMPT.format(git_diff_output=git_diff),
        subagent_type="general-purpose"
    )
    
    if not quality_check["approved"]:
        print(f"Commit blocked: {quality_check['issues']}")
        return False
    
    # Generate commit message
    commit_msg = await Task(
        description="Generate commit message", 
        prompt=COMMIT_MESSAGE_PROMPT.format(git_diff_output=git_diff),
        subagent_type="general-purpose"
    )
    
    # Execute commit
    return commit_and_push(commit_msg)
```

### Parallel Execution
```python
# Run multiple checks simultaneously
quality_task = Task(description="Pre-commit quality control", ...)
coverage_task = Task(description="Analyze test coverage", ...)

quality_result, coverage_result = await asyncio.gather(quality_task, coverage_task)
```

## Notes

- These templates use the existing `Task` tool with specialized prompts
- Each template is designed for a specific workflow responsibility
- Templates include structured output formats for programmatic use
- Can be used individually or combined in larger workflows