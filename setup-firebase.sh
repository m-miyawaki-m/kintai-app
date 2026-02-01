#!/bin/bash

echo "==================================="
echo "Firebase Setup Script for Kintai App"
echo "==================================="
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed."
    echo "Installing firebase-tools globally..."
    npm install -g firebase-tools
fi

echo "Firebase CLI version: $(firebase --version)"
echo ""

# Login to Firebase
echo "Step 1: Logging in to Firebase..."
firebase login

echo ""
echo "Step 2: List available projects..."
firebase projects:list

echo ""
echo "==================================="
echo "Next Steps:"
echo "==================================="
echo ""
echo "1. Create a new Firebase project (if needed):"
echo "   firebase projects:create your-project-id"
echo ""
echo "2. Set the project for this directory:"
echo "   firebase use your-project-id"
echo ""
echo "3. Enable required services in Firebase Console:"
echo "   - Authentication > Sign-in method > Email/Password"
echo "   - Firestore Database > Create database"
echo ""
echo "4. Get your web app config from Firebase Console:"
echo "   Project Settings > Your apps > Web app > Config"
echo ""
echo "5. Create .env file with your Firebase config:"
echo "   cp .env.example .env"
echo "   # Then edit .env with your actual values"
echo ""
echo "6. For local development with emulators (no Firebase setup needed):"
echo "   npm run dev:local"
echo ""
echo "7. For production deployment:"
echo "   npm run build"
echo "   npm run deploy"
echo ""
