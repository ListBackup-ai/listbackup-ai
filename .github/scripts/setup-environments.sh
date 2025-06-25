#!/bin/bash

# Script to set up GitHub environments with protection rules
# This configures staging and production environments for deployment

echo "🌍 Setting up GitHub deployment environments"
echo ""

# Check if gh is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed or not in PATH"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [ -z "$REPO" ]; then
    echo "❌ Could not determine repository. Make sure you're in a git repository."
    exit 1
fi

echo "Repository: $REPO"
echo ""

# Function to create environment
create_environment() {
    local env_name=$1
    local description=$2
    
    echo "Creating $env_name environment..."
    
    # Create environment using GitHub API
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github.v3+json" \
        "/repos/$REPO/environments/$env_name" \
        -f deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}' \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Created $env_name environment"
    else
        echo "⚠️  Environment $env_name may already exist or there was an error"
    fi
}

# Function to set environment protection rules
set_protection_rules() {
    local env_name=$1
    local require_reviewers=$2
    local deployment_branch=$3
    
    echo "Setting protection rules for $env_name..."
    
    # Build the protection rules JSON
    local protection_rules='{
        "deployment_branch_policy": {
            "protected_branches": true,
            "custom_branch_policies": false
        }'
    
    # Add wait timer for production
    if [ "$env_name" = "production" ]; then
        protection_rules='{
            "deployment_branch_policy": {
                "protected_branches": true,
                "custom_branch_policies": false
            },
            "wait_timer": 5
        }'
    fi
    
    # Apply protection rules
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github.v3+json" \
        "/repos/$REPO/environments/$env_name" \
        --input - <<< "$protection_rules" \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Applied protection rules to $env_name"
    else
        echo "⚠️  Could not apply all protection rules to $env_name"
    fi
}

# Create staging environment
echo "=== Staging Environment ==="
create_environment "staging" "Staging deployment environment"
set_protection_rules "staging" false "develop"
echo ""

# Create production environment
echo "=== Production Environment ==="
create_environment "production" "Production deployment environment"
set_protection_rules "production" true "main"
echo ""

echo "🎉 Environment setup complete!"
echo ""
echo "Environment protection rules:"
echo "- Staging: Deployments from protected branches only"
echo "- Production: Deployments from protected branches only, 5-minute wait timer"
echo ""
echo "Note: Since this is a solo project, manual review requirements are not set."
echo "You can add reviewers later if the team grows."
echo ""
echo "To view environments in GitHub:"
echo "1. Go to Settings → Environments"
echo "2. Or visit: https://github.com/$REPO/settings/environments"