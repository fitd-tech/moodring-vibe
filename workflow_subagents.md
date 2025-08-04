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

## 6. Unified Quality Control Agent

### Usage
```python
quality_result = await Task(
    description="Unified quality control across all projects",
    prompt=f"""You are a unified quality control specialist who eliminates context switching by coordinating quality checks across both Rust backend and React Native frontend projects.

**Your Mission**: Execute all quality checks from the project root with unified reporting and zero tolerance enforcement.

**Current Changes**:
```
{git_diff_output}
```

**Project Structure**:
- **Backend**: `/moodring_backend/` (Rust + Cargo)
- **Frontend**: `/moodring_frontend/` (React Native + npm)
- **Root Directory**: `/Users/anthonypelusocook/moodring-vibe/`

**Required Quality Checks**:

### Backend Checks (run from moodring_backend/):
1. `cargo test` - All tests must pass
2. `cargo clippy` - Zero warnings allowed  
3. `cargo fmt --check` - Code must be properly formatted

### Frontend Checks (run from moodring_frontend/):
1. `npm run lint` - ESLint must pass with zero warnings
2. `npm run test` - All Jest tests must pass
3. `npm run typecheck` - TypeScript compilation must succeed

**Execution Strategy**:
1. **Parallel Execution**: Run backend and frontend checks simultaneously when possible
2. **Directory Management**: Handle `cd` operations and path context automatically
3. **Unified Reporting**: Consolidate all results into single pass/fail status
4. **Error Context**: Provide specific file paths, line numbers, and fix commands
5. **Zero Tolerance**: Block commits on ANY warnings or test failures

**Output Format**:
{{
  "overall_status": "PASS|FAIL",
  "backend_results": {{
    "status": "PASS|FAIL",
    "test_results": {{"passed": true/false, "output": "command output"}},
    "clippy_results": {{"passed": true/false, "warnings": ["list"], "output": "command output"}},
    "format_results": {{"passed": true/false, "output": "command output"}}
  }},
  "frontend_results": {{
    "status": "PASS|FAIL", 
    "lint_results": {{"passed": true/false, "warnings": ["list"], "output": "command output"}},
    "test_results": {{"passed": true/false, "coverage": "percentage", "output": "command output"}},
    "typecheck_results": {{"passed": true/false, "errors": ["list"], "output": "command output"}}
  }},
  "summary": {{
    "total_checks": 6,
    "passed_checks": 0-6,
    "failed_checks": ["list of failed check names"],
    "total_warnings": 0,
    "blocking_issues": ["critical issues preventing commit"]
  }},
  "fix_commands": [
    "cd moodring_backend && cargo clippy --fix",
    "cd moodring_frontend && npm run lint:fix",
    "specific commands to resolve each issue"
  ],
  "recommendation": "APPROVE_COMMIT|BLOCK_COMMIT|REQUIRE_FIXES",
  "next_steps": ["specific actions required before commit"]
}}

**Execution Requirements**:
1. **Run all commands from project root** using `cd` for directory changes
2. **Capture full command output** for debugging failed checks
3. **Parse warning/error counts** from tool outputs
4. **Provide specific fix commands** with correct directory context
5. **Block commits immediately** on any failures or warnings
6. **Report total execution time** for performance monitoring

**Zero Tolerance Rules**:
- ANY clippy warnings = BLOCK COMMIT
- ANY eslint warnings = BLOCK COMMIT  
- ANY test failures = BLOCK COMMIT
- ANY TypeScript errors = BLOCK COMMIT
- ANY formatting issues = BLOCK COMMIT
- Coverage below 80% = BLOCK COMMIT (when coverage reporting available)

**Performance Optimization**:
- Run backend checks (`cargo test && cargo clippy && cargo fmt --check`) in parallel with frontend checks (`npm run lint && npm run test && npm run typecheck`)
- Use `&&` operators to fail fast within each project
- Report timing for each check category

**Command Execution**:
Execute all commands from project root `/Users/anthonypelusocook/moodring-vibe/` using these exact command patterns:
- Backend: `cd moodring_backend && cargo test && cargo clippy && cargo fmt --check`
- Frontend: `cd moodring_frontend && npm run lint && npm run test && npm run typecheck`

Only approve commit if ALL checks pass with zero warnings.""",
    subagent_type="general-purpose"
)
```

### Integration with Commit Workflow
```python
# Pre-commit workflow with unified quality control
async def unified_pre_commit_workflow():
    # Get current changes
    git_diff = run_command("git diff --staged")
    
    # Run unified quality control
    quality_check = await Task(
        description="Unified quality control across all projects",
        prompt=UNIFIED_QUALITY_CONTROL_PROMPT.format(git_diff_output=git_diff),
        subagent_type="general-purpose"
    )
    
    # Parse structured response
    result = json.loads(quality_check)
    
    if result["overall_status"] == "FAIL":
        print(f"❌ Commit blocked by quality control")
        print(f"Failed checks: {result['summary']['failed_checks']}")
        print(f"Total warnings: {result['summary']['total_warnings']}")
        print(f"\nFix commands:")
        for cmd in result["fix_commands"]:
            print(f"  {cmd}")
        return False
    
    print(f"✅ All quality checks passed ({result['summary']['passed_checks']}/6)")
    return True

# Example: Automated fix application
def apply_automated_fixes(quality_result):
    """Apply automated fixes suggested by quality control"""
    for fix_cmd in quality_result["fix_commands"]:
        if "clippy --fix" in fix_cmd or "lint:fix" in fix_cmd:
            run_command(fix_cmd)
            print(f"Applied: {fix_cmd}")
```

### Parallel Execution Example
```python
# Run quality control and coverage analysis simultaneously
quality_task = Task(
    description="Unified quality control", 
    prompt=UNIFIED_QUALITY_CONTROL_PROMPT.format(git_diff_output=git_diff)
)

coverage_task = Task(
    description="Test coverage analysis",
    prompt=COVERAGE_ANALYSIS_PROMPT.format(git_diff_output=git_diff)
)

quality_result, coverage_result = await asyncio.gather(quality_task, coverage_task)

# Combine results for final approval
overall_approved = (
    quality_result["overall_status"] == "PASS" and 
    coverage_result["meets_threshold"] == True
)
```

## 7. Environment Sync Validator Agent

### Usage
```python
env_validation = await Task(
    description="OAuth environment configuration validation",
    prompt=f"""You are an environment configuration specialist who ensures OAuth consistency and prevents deployment failures across development, staging, and production environments.

**Your Mission**: Validate OAuth configuration consistency between all environments and ensure deployment readiness.

**Current Environment Files to Analyze**:
- `/moodring_frontend/.env` (development)
- `/moodring_frontend/.env.example` (template)
- `/moodring_frontend/app.config.js` (app configuration)
- `/.gitignore` (security validation)

**Target Environment Files** (if available):
- `/moodring_frontend/.env.staging`
- `/moodring_frontend/.env.production` 
- `/moodring_frontend/.env.local`

**OAuth Configuration Context**:
- **Spotify Integration**: PKCE OAuth flow
- **Client ID Variable**: `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`
- **App Scheme**: 'moodring' (from app.config.js)
- **Redirect URI Pattern**: 'moodring://auth'
- **Expected Client ID Format**: 32-character hexadecimal string

**Validation Requirements**:

### 1. Environment File Validation
- Check `.env` and `.env.example` consistency
- Verify all environment-specific .env files exist and are properly configured
- Validate environment variable naming conventions
- Ensure required OAuth variables are present in all environments

### 2. OAuth Configuration Validation  
- Verify Spotify client ID format (32-char hex string)
- Check that client IDs are different between environments (dev/staging/prod)
- Validate redirect URI consistency between app.config.js and Spotify Dashboard expectations
- Confirm app scheme configuration matches redirect URI pattern

### 3. Security Best Practices
- Ensure actual client IDs are not committed to git (only in gitignored .env files)
- Verify .env.example contains placeholder values, not real secrets
- Check gitignore includes all sensitive environment files
- Validate that EXPO_PUBLIC_ prefix is used correctly for client-side values

### 4. Cross-Environment Consistency
- Compare environment configurations for structural consistency
- Identify missing environment variables across different .env files
- Validate that all environments have the same variable names (with different values)
- Check app.config.js references to environment variables are correct

### 5. Deployment Readiness
- Confirm production environment files exist and are properly configured
- Validate that all OAuth flows will work in target deployment environments
- Check for environment-specific configuration issues that could cause runtime failures

**Analysis Process**:
1. **Read Configuration Files**: Load and parse all environment and config files
2. **Parse OAuth Settings**: Extract client IDs, redirect URIs, and app schemes
3. **Validate Formats**: Check client ID format, URI structure, scheme consistency
4. **Cross-Reference**: Compare configurations between environments  
5. **Security Scan**: Verify no secrets leaked in version control
6. **Generate Report**: Provide specific issues found and fix commands

**Output Format**:
{{
  "environment_status": "VALID|INVALID",
  "issues_found": [
    {{
      "type": "client_id_mismatch|callback_url_invalid|security_leak|missing_config|format_error|consistency_issue",
      "file": "path/to/file",
      "line": "line number if applicable",
      "description": "specific issue description",
      "fix_command": "specific command to fix",
      "severity": "error|warning|info"
    }}
  ],
  "oauth_validation": {{
    "client_id_format": "VALID|INVALID",
    "client_id_uniqueness": "VALID|INVALID",
    "redirect_uri_consistency": "VALID|INVALID",
    "scheme_configuration": "VALID|INVALID",
    "app_config_integration": "VALID|INVALID"
  }},
  "environment_consistency": {{
    "env_example_sync": true/false,
    "dev_staging_structure": true/false,
    "staging_prod_structure": true/false,
    "missing_variables": ["list of missing vars by environment"],
    "variable_naming": "CONSISTENT|INCONSISTENT",
    "all_environments_present": true/false
  }},
  "security_status": {{
    "secrets_in_git": true/false,
    "env_example_sanitized": true/false,
    "gitignore_configured": true/false,
    "public_prefix_correct": true/false,
    "client_ids_different": true/false
  }},
  "deployment_readiness": {{
    "production_config_exists": true/false,
    "oauth_flow_viable": true/false,
    "runtime_config_valid": true/false,
    "deep_linking_configured": true/false
  }},
  "recommendations": [
    "Update .env.example to match current .env variable names",
    "Add missing EXPO_PUBLIC_SPOTIFY_CLIENT_ID to .env.production",
    "Register moodring://auth redirect URI in Spotify Dashboard",
    "Generate unique client ID for production environment"
  ],
  "fix_commands": [
    "echo 'EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_prod_client_id_here' >> moodring_frontend/.env.production",
    "git rm --cached moodring_frontend/.env",
    "specific commands to resolve each issue"
  ],
  "approval": "APPROVE|BLOCK|REVIEW_REQUIRED",
  "next_steps": [
    "Configure Spotify Dashboard with redirect URIs for all environments",
    "Generate environment-specific client IDs",
    "Test OAuth flow in each environment"
  ]
}}

**Critical Validation Rules**:
1. **Block deployment if client IDs are the same across environments**
2. **Block if .env files contain placeholder values in production**
3. **Block if redirect URIs don't match app scheme configuration**
4. **Block if OAuth variables are missing from any environment**
5. **Block if security issues detected (secrets in git, improper gitignore)**

**File Analysis Commands**:
- Read all .env* files in moodring_frontend/
- Parse app.config.js for scheme and intent filter configuration  
- Check .gitignore for proper exclusion patterns
- Validate client ID format with regex: `^[a-f0-9]{{32}}$`
- Cross-reference environment variables between files

**Environment-Specific Checks**:
- **Development**: Client ID should be test/development Spotify app
- **Staging**: Should have separate client ID from development
- **Production**: Must have production-grade client ID, no placeholder values
- **All Environments**: Redirect URIs must be registered in corresponding Spotify Dashboard apps

**Spotify Dashboard Integration Notes**:
- Each environment needs separate Spotify app registration
- Redirect URIs must be added to Spotify Dashboard: `moodring://auth`
- Client IDs must match between .env files and Spotify Dashboard
- PKCE flow requires no client secret (client-side OAuth)

Only approve if ALL validations pass and deployment is safe.""",
    subagent_type="general-purpose"
)
```

### Pre-Deployment Integration
```python
# Pre-deployment environment validation workflow
async def pre_deployment_env_validation():
    """Validate environment configuration before deployment"""
    
    # Run environment sync validation
    env_check = await Task(
        description="OAuth environment configuration validation",
        prompt=ENV_SYNC_VALIDATOR_PROMPT,
        subagent_type="general-purpose"
    )
    
    # Parse structured response
    result = json.loads(env_check)
    
    if result["approval"] == "BLOCK":
        print("🚫 Deployment blocked by environment validation")
        print(f"Environment status: {result['environment_status']}")
        print(f"Critical issues found: {len([i for i in result['issues_found'] if i['severity'] == 'error'])}")
        
        print("\n🔧 Fix commands:")
        for cmd in result["fix_commands"]:
            print(f"  {cmd}")
            
        print(f"\n📋 Next steps:")
        for step in result["next_steps"]:
            print(f"  - {step}")
            
        return False
    
    elif result["approval"] == "REVIEW_REQUIRED":
        print("⚠️  Manual review required before deployment")
        warnings = [i for i in result["issues_found"] if i["severity"] == "warning"]
        for warning in warnings:
            print(f"  - {warning['description']}")
        
        # Prompt for manual approval
        user_input = input("Continue with deployment? (y/N): ")
        return user_input.lower() == 'y'
    
    else:  # APPROVE
        print("✅ Environment validation passed")
        print(f"OAuth configuration: {result['oauth_validation']}")
        print(f"Security status: {result['security_status']['secrets_in_git'] == False}")
        return True

# Example: Combined with other pre-deployment checks
async def comprehensive_pre_deployment():
    """Run all pre-deployment validations"""
    
    # Run in parallel for efficiency
    env_task = Task(description="Environment validation", prompt=ENV_SYNC_VALIDATOR_PROMPT)
    quality_task = Task(description="Quality control", prompt=UNIFIED_QUALITY_CONTROL_PROMPT)
    coverage_task = Task(description="Coverage analysis", prompt=COVERAGE_ANALYSIS_PROMPT)
    
    env_result, quality_result, coverage_result = await asyncio.gather(
        env_task, quality_task, coverage_task
    )
    
    # Check all validations passed
    deployment_approved = (
        env_result["approval"] == "APPROVE" and
        quality_result["overall_status"] == "PASS" and  
        coverage_result["meets_threshold"] == True
    )
    
    if deployment_approved:
        print("🚀 All pre-deployment checks passed - ready for deployment")
        return True
    else:
        print("❌ Deployment blocked - fix issues and retry")
        return False
```

### Environment File Management
```python
# Automated environment file management
def create_missing_env_files(env_validation_result):
    """Create missing environment files based on validation results"""
    
    missing_configs = env_validation_result["environment_consistency"]["missing_variables"]
    
    for env_name, missing_vars in missing_configs.items():
        env_file = f"moodring_frontend/.env.{env_name}"
        
        if not os.path.exists(env_file):
            # Create base environment file
            with open(env_file, 'w') as f:
                f.write(f"# {env_name.title()} Environment Configuration\n")
                f.write(f"# Generated automatically - update with real values\n\n")
                
                for var in missing_vars:
                    if "CLIENT_ID" in var:
                        f.write(f"{var}=your_{env_name}_spotify_client_id_here\n")
                    else:
                        f.write(f"{var}=your_{var.lower()}_value_here\n")
            
            print(f"Created {env_file} - update with real values")

# Environment synchronization helper
def sync_env_structure():
    """Ensure all environment files have consistent structure"""
    
    # Read .env.example as template
    with open("moodring_frontend/.env.example", 'r') as f:
        template_vars = [line.split('=')[0] for line in f if '=' in line and not line.startswith('#')]
    
    # Check each environment file
    env_files = glob.glob("moodring_frontend/.env.*")
    
    for env_file in env_files:
        if env_file.endswith('.example'):
            continue
            
        # Read existing variables
        with open(env_file, 'r') as f:
            existing_vars = [line.split('=')[0] for line in f if '=' in line and not line.startswith('#')]
        
        # Add missing variables
        missing_vars = set(template_vars) - set(existing_vars)
        
        if missing_vars:
            with open(env_file, 'a') as f:
                f.write(f"\n# Added missing variables\n")
                for var in missing_vars:
                    f.write(f"{var}=your_value_here\n")
            
            print(f"Added {len(missing_vars)} missing variables to {env_file}")
```

### Spotify Dashboard Integration
```python
# Helper for Spotify Dashboard validation
def validate_spotify_dashboard_config(client_ids, redirect_uris):
    """Validate that client IDs and redirect URIs are properly configured in Spotify Dashboard"""
    
    validation_checklist = {
        "client_ids_unique": len(set(client_ids)) == len(client_ids),
        "redirect_uris_registered": all(uri.startswith('moodring://') for uri in redirect_uris),
        "pkce_compatible": True,  # No client secret needed for PKCE
        "environment_separation": len([cid for cid in client_ids if cid != 'placeholder']) >= 2
    }
    
    # Generate dashboard configuration instructions
    instructions = []
    
    for i, client_id in enumerate(client_ids):
        env_name = ['development', 'staging', 'production'][i] if i < 3 else f'environment_{i}'
        instructions.append({
            "environment": env_name,
            "client_id": client_id,
            "redirect_uris": redirect_uris,
            "dashboard_url": "https://developer.spotify.com/dashboard",
            "required_settings": {
                "redirect_uri": "moodring://auth",
                "app_type": "Mobile/Desktop App",
                "oauth_flow": "Authorization Code with PKCE"
            }
        })
    
    return validation_checklist, instructions
```

## Notes

- These templates use the existing `Task` tool with specialized prompts
- Each template is designed for a specific workflow responsibility
- Templates include structured output formats for programmatic use
- Can be used individually or combined in larger workflows