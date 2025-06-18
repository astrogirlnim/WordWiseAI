#!/bin/bash

# Script to add GitHub secrets from .env.local file
# Usage: ./scripts/add-github-secrets.sh

set -e

echo "🔐 Adding GitHub Secrets from .env.local..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please ensure you're running this from the project root and .env.local exists."
    exit 1
fi

# Check if GitHub CLI is authenticated
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ Error: GitHub CLI not authenticated!"
    echo "Please run: gh auth login"
    exit 1
fi

# List of required environment variables to add as secrets
declare -a REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
    "NEXT_PUBLIC_FIREBASE_DATABASE_URL"
    "FIREBASE_ADMIN_PROJECT_ID"
    "FIREBASE_ADMIN_CLIENT_EMAIL"
    "FIREBASE_ADMIN_PRIVATE_KEY"
    "OPENAI_API_KEY"
)

echo "📋 Found $(echo "${REQUIRED_VARS[@]}" | wc -w) required variables to add as secrets"
echo ""

# Function to extract variable value from .env.local
get_env_value() {
    local var_name="$1"
    local value=""
    
    # Handle multi-line values (like private keys)
    if [ "$var_name" = "FIREBASE_ADMIN_PRIVATE_KEY" ]; then
        # Extract private key (starts with quote, ends with quote)
        value=$(grep "^${var_name}=" .env.local | sed 's/^[^=]*=//' | sed 's/^"//' | sed 's/"$//')
    else
        # Handle single-line values
        value=$(grep "^${var_name}=" .env.local | sed 's/^[^=]*=//' | sed 's/^"//' | sed 's/"$//')
    fi
    
    echo "$value"
}

# Add each variable as a GitHub secret
for var_name in "${REQUIRED_VARS[@]}"; do
    echo "🔑 Processing: $var_name"
    
    # Get the value from .env.local
    var_value=$(get_env_value "$var_name")
    
    if [ -z "$var_value" ]; then
        echo "⚠️  Warning: $var_name is empty or not found in .env.local"
        continue
    fi
    
    # Add the secret using GitHub CLI
    echo "$var_value" | gh secret set "$var_name" --repo astrogirlnim/WordWiseAI --body=-
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully added: $var_name"
    else
        echo "❌ Failed to add: $var_name"
    fi
    echo ""
done

echo "🎉 Finished adding GitHub secrets!"
echo ""
echo "📋 You can verify the secrets were added by running:"
echo "   gh secret list"
echo ""
echo "🚀 Next steps:"
echo "   1. Update GitHub Actions workflows to use these secrets"
echo "   2. Test the build process" 