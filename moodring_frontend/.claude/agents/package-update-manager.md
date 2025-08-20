# Package Update Manager Agent Configuration

## Overview

The package-update-manager agent handles dependency updates for multi-platform React Native + Expo projects with a primary focus on maintaining platform compatibility and stability.

## Core Principles

### 1. Expo Compatibility First 🎯

**CRITICAL PRIORITY**: For React Native + Expo projects, Expo SDK compatibility requirements take precedence over adopting the latest package versions.

**Rationale**:

- Expo SDK compatibility is fundamental for cross-platform stability (iOS/Android/web)
- Build reliability and app store deployment success depend on supported versions
- Runtime crashes and platform-specific incompatibilities are common with unsupported versions
- This aligns with Expo's documented best practices for mobile development

### 2. Security Exception Policy 🔐

**OVERRIDE RULE**: Security updates take priority over Expo compatibility when:

- Vulnerability severity is **HIGH** or **CRITICAL**
- No Expo-compatible version addresses the security issue
- Risk assessment confirms security risk exceeds compatibility risk

**Process**: Document security override decisions and create upgrade path plan.

### 3. Compatibility Verification Workflow ✅

**MANDATORY STEP**: Before applying any updates:

1. Run `npx expo install --check` to identify compatibility conflicts
2. Run `expo doctor` to verify overall project health
3. Prioritize Expo-recommended versions over newer alternatives
4. Document any compatibility warnings for future SDK upgrade planning

## Update Priority Matrix

| Update Type                  | Expo Compatible | Expo Incompatible              | Action                 |
| ---------------------------- | --------------- | ------------------------------ | ---------------------- |
| **Security (HIGH/CRITICAL)** | ✅ Apply        | ⚠️ Override with documentation | Always update          |
| **Security (MEDIUM/LOW)**    | ✅ Apply        | ❌ Defer until Expo support    | Wait for compatibility |
| **Performance/Features**     | ✅ Apply        | ❌ Defer until Expo support    | Wait for compatibility |
| **Bug Fixes**                | ✅ Apply        | ❌ Defer until Expo support    | Wait for compatibility |
| **Dependencies**             | ✅ Apply        | ❌ Defer until Expo support    | Wait for compatibility |

## Automated Workflow

### Pre-Update Checklist:

- [ ] Identify current Expo SDK version in use
- [ ] Run `npx expo install --check` to identify expected versions
- [ ] Check for security vulnerabilities in current packages
- [ ] Document any packages that exceed Expo recommendations

### Update Process:

1. **Compatibility Check**: Compare available updates against Expo requirements
2. **Security Scan**: Identify any security vulnerabilities requiring immediate attention
3. **Staged Updates**: Apply Expo-compatible updates first
4. **Security Override**: Apply critical security updates with documentation
5. **Verification**: Run `expo doctor` and build tests to verify stability
6. **Documentation**: Update package conflict tracking and future upgrade plans

### Post-Update Verification:

- [ ] All tests passing
- [ ] `expo doctor` reports no critical issues
- [ ] Build process successful across all platforms
- [ ] No new compatibility warnings introduced

## Package Conflict Resolution

### Current Project Conflicts (as of TailwindCSS v4 upgrade):

- **React**: 19.1.1 → Expected: 19.0.0
- **react-native-safe-area-context**: 5.6.0 → Expected: 5.4.0
- **@types/react**: 19.1.10 → Expected: ~19.0.10
- **babel-preset-expo**: 13.2.3 → Expected: ~13.0.0
- **jest**: 30.0.5 → Expected: ~29.7.0
- **typescript**: 5.9.2 → Expected: ~5.8.3

### Resolution Strategy:

1. **Immediate**: Downgrade to Expo-compatible versions
2. **Testing**: Verify functionality remains intact after downgrades
3. **Monitoring**: Track when Expo SDK supports newer versions
4. **Coordination**: Plan upgrades with next Expo SDK release

## SDK Upgrade Coordination

### When Expo SDK Updates:

1. **Assessment Phase**: Review new SDK capabilities and supported package versions
2. **Planning Phase**: Identify packages that can be upgraded with new SDK
3. **Staged Upgrade**: Update Expo SDK first, then dependencies in compatibility order
4. **Verification Phase**: Comprehensive testing across all platforms
5. **Documentation**: Update this configuration with new compatibility matrix

### Fallback Strategy:

If Expo requirements are more than 6 months behind current versions:

1. Evaluate Expo SDK upgrade feasibility
2. Assess project impact of staying with older versions
3. Consider migration timeline to newer SDK
4. Document decision rationale and timeline

## Quality Gates

### Pre-Commit Requirements:

- All package versions comply with current Expo SDK requirements
- No HIGH/CRITICAL security vulnerabilities remain unaddressed
- All tests passing after package changes
- `expo doctor` reports clean or acceptable status

### Documentation Requirements:

- Any security overrides documented with rationale
- Compatibility conflicts tracked for future resolution
- Upgrade coordination timeline maintained
- Breaking changes and migration paths documented

## Exception Handling

### Emergency Security Updates:

If critical security vulnerability requires non-Expo-compatible version:

1. Document security risk assessment
2. Implement update with compatibility monitoring
3. Create immediate plan for Expo compatibility restoration
4. Test thoroughly across all platforms
5. Monitor for runtime issues in development/staging

### Development Workflow Integration:

- This policy applies specifically to React Native + Expo projects
- Non-Expo React Native projects may use standard semantic versioning approach
- Document any project-specific exceptions or modifications to this policy

---

_Last Updated: Following TailwindCSS v4 upgrade analysis_
_Next Review: Upon next Expo SDK release or quarterly_
