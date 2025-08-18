#!/bin/bash

echo "🧪 Tikiti Admin Dashboard - Local Testing Setup"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the tikiti-admin directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️ Setting up environment file..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "🔧 IMPORTANT: Edit .env file with your Firebase configuration"
    echo "   Use the same Firebase project as your mobile app"
    echo ""
    echo "   Required variables:"
    echo "   - VITE_FIREBASE_API_KEY"
    echo "   - VITE_FIREBASE_AUTH_DOMAIN"
    echo "   - VITE_FIREBASE_PROJECT_ID"
    echo "   - VITE_FIREBASE_STORAGE_BUCKET"
    echo "   - VITE_FIREBASE_MESSAGING_SENDER_ID"
    echo "   - VITE_FIREBASE_APP_ID"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Check if Firebase config is set
if grep -q "your_api_key" .env; then
    echo ""
    echo "⚠️  WARNING: .env file still contains placeholder values"
    echo "   Please update .env with your actual Firebase configuration"
    echo ""
fi

# Start development server
echo ""
echo "🚀 Starting development server..."
echo ""
echo "📱 Dashboard will be available at: http://localhost:3001"
echo ""
echo "🔐 Demo login credentials:"
echo "   Email: admin@test.com"
echo "   Password: password123"
echo ""
echo "📋 Before logging in, make sure you have:"
echo "   1. ✅ Updated .env with Firebase config"
echo "   2. ✅ Created admin user in Firebase (see LOCAL_TESTING.md)"
echo "   3. ✅ Firebase project is active and accessible"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If login fails: Check admin user exists in Firestore 'admins' collection"
echo "   - If no data: Ensure you're using same Firebase project as mobile app"
echo "   - If build errors: Run 'npm install' and check Node.js version"
echo ""
echo "📖 For detailed setup instructions, see LOCAL_TESTING.md"
echo ""

# Start the dev server
npm run dev
