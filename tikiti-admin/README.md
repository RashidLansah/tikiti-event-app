# Tikiti Admin Dashboard

A modern web-based admin dashboard for managing the Tikiti mobile app. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### 📊 Dashboard Overview
- **Real-time Statistics** - User count, events, revenue, pending approvals
- **Analytics Charts** - User growth, event creation, revenue trends
- **System Health** - Database status, API performance, error rates
- **Recent Activity** - Live feed of user actions and system events

### 👥 User Management
- **User Directory** - View all registered users (attendees & organizers)
- **User Profiles** - Edit user information, roles, and permissions
- **Account Actions** - Suspend, ban, or delete user accounts
- **Activity Logs** - Track user actions and login history
- **Bulk Operations** - Mass actions on multiple users

### 🎪 Event Management
- **Event Moderation** - Approve/reject event submissions
- **Featured Events** - Promote events on the mobile app
- **Content Moderation** - Review event descriptions and images
- **Event Analytics** - Performance metrics per event
- **Bulk Actions** - Mass approve/reject operations

### 🔔 Notification Center
- **Push Notifications** - Send targeted messages to mobile users
- **Email Campaigns** - Bulk email marketing and announcements
- **System Alerts** - Automated notifications for admin actions
- **Notification Templates** - Pre-built message templates

### ⚙️ App Configuration
- **Feature Flags** - Enable/disable mobile app features
- **App Settings** - Configure global app behavior
- **Category Management** - Add/edit event categories
- **Payment Settings** - Configure payment gateways and fees
- **Content Management** - Update app content and copy

### 📈 Analytics & Reports
- **User Analytics** - Registration trends, engagement metrics
- **Event Performance** - Ticket sales, popular events
- **Revenue Reports** - Financial tracking and projections
- **Export Data** - Download reports in CSV/Excel format

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Backend**: Firebase (shared with mobile app)
- **Authentication**: Firebase Auth with admin role checking
- **Database**: Firestore
- **Hosting**: Vercel/Netlify

## 🏗️ Project Structure

```
tikiti-admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/         # Layout components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── pages/              # Route pages
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── EventsPage.tsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   ├── services/           # API services
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities and config
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (shared with mobile app)
- Admin user accounts in Firestore

### Installation

1. **Clone and setup**:
   ```bash
   cd tikiti-admin
   npm install
   ```

2. **Environment Variables**:
   Create `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Firebase Setup**:
   ```bash
   # Create admin collection in Firestore
   # Add admin users with role: 'admin' or 'super_admin'
   ```

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

## 🔐 Authentication & Permissions

### Admin Roles
- **Super Admin**: Full access to all features
- **Admin**: Limited access, cannot manage other admins
- **Moderator**: Event moderation and user management only

### Security
- Firebase Authentication with role-based access
- Admin users stored in separate `admins` collection
- Protected routes and API endpoints
- Activity logging for audit trails

## 📱 Mobile App Integration

The admin dashboard connects to the same Firebase backend as your React Native mobile app:

### Shared Data
- **Users Collection** - All mobile app users
- **Events Collection** - All events created by organizers
- **Categories Collection** - Event categories
- **Tickets Collection** - Ticket purchases and QR codes

### Admin Actions Impact Mobile App
- **Feature Flags** - Instantly enable/disable mobile features
- **Push Notifications** - Send messages to mobile users
- **Event Approval** - Control which events appear in mobile app
- **User Management** - Suspend accounts, affecting mobile login

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## 📊 Key Features Breakdown

### Real-time Dashboard
- Live user count updates
- Event creation notifications
- Revenue tracking
- System health monitoring

### User Management Interface
- Searchable user table with filters
- User profile editing modal
- Bulk action toolbar
- Activity timeline per user

### Event Moderation Workflow
- Pending events queue
- Quick approve/reject buttons
- Event detail preview
- Bulk moderation tools

### Analytics Dashboard
- Interactive charts with date ranges
- Export functionality
- Drill-down capabilities
- Performance comparisons

### Notification System
- Rich text editor for messages
- User targeting (all, organizers, attendees)
- Schedule notifications
- Delivery tracking

## 🔧 Configuration Management

### Feature Flags
```javascript
// Example feature flags
{
  "enableEventChat": true,
  "requireEventApproval": true,
  "allowMultipleTickets": false,
  "enableSocialLogin": true
}
```

### App Settings
```javascript
// Global app configuration
{
  "maxTicketsPerUser": 10,
  "eventApprovalRequired": true,
  "commissionRate": 0.05,
  "supportEmail": "support@tikiti.com"
}
```

## 📈 Analytics Tracking

- User registration trends
- Event creation patterns
- Revenue growth
- Popular event categories
- Geographic distribution
- Mobile app usage metrics

## 🔒 Security Best Practices

- Admin authentication required
- Role-based access control
- Activity logging
- Data validation
- Rate limiting
- CORS configuration
- Environment variable protection

## 🚀 Future Enhancements

- [ ] Advanced analytics with ML insights
- [ ] A/B testing for mobile app features
- [ ] Multi-language content management
- [ ] Advanced user segmentation
- [ ] Automated fraud detection
- [ ] Integration with external analytics tools
- [ ] Mobile app remote configuration
- [ ] Advanced reporting dashboard

---

This admin dashboard gives you complete control over your Tikiti mobile app, allowing you to manage users, moderate content, analyze performance, and configure app behavior - all from a beautiful, modern web interface! 🎉
