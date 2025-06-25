#!/bin/bash

# Configure GitHub Repository Script
# Run this after authenticating with: gh auth login

echo "Configuring GitHub repository..."

# Set repository description and homepage
echo "Setting repository description and homepage..."
gh repo edit ListBackup-ai/listbackup-ai \
  --description "AI-powered data backup and integration platform for modern businesses" \
  --homepage "https://listbackup.ai"

# Add topics
echo "Adding repository topics..."
gh repo edit ListBackup-ai/listbackup-ai \
  --add-topic serverless \
  --add-topic aws \
  --add-topic backup \
  --add-topic saas \
  --add-topic typescript \
  --add-topic golang \
  --add-topic nextjs

# Enable/disable features
echo "Configuring repository features..."
gh repo edit ListBackup-ai/listbackup-ai \
  --enable-issues \
  --enable-wiki=false \
  --enable-projects=false

# Create develop branch
echo "Creating develop branch..."
git checkout -b develop
git push -u origin develop
git checkout main

# Set default branch (optional - keep as main)
# gh repo edit ListBackup-ai/listbackup-ai --default-branch main

echo "Basic repository configuration complete!"
echo ""
echo "Please complete the following manually in GitHub Settings:"
echo "1. Enable branch protection for main branch"
echo "2. Enable Dependabot security alerts"
echo "3. Enable secret scanning"
echo "4. Configure deployment environments"
echo "5. Add repository secrets for AWS deployment"