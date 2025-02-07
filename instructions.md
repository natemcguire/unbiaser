## Admin Access
- URL: `/admin/logs`
- Username: `admin`
- Password: `unbiaser-admin-2024`

## Build Commands
```bash
# Development build with watch mode
npm run ext:dev

# Production build
npm run ext:build

# Package for distribution
npm run ext:package
```

## Extension Features
1. Page Analysis:
   - Click extension icon
   - Keyboard shortcut: Ctrl+Shift+U (Cmd+Shift+U on Mac)
   - Context menu for selected text

2. Background Processing:
   - Queue-based analysis
   - Progress tracking
   - Desktop notifications
   - Status page

3. Admin Features:
   - Job monitoring
   - Error tracking
   - Performance metrics

## Troubleshooting
1. Extension not loading:
   - Check manifest.json
   - Verify all files are built
   - Check Chrome console for errors

2. Analysis failing:
   - Check API endpoints
   - Verify environment variables
   - Check admin logs

3. Common Issues:
   - CORS errors: Check host permissions
   - Auth errors: Verify Supabase setup
   - Build errors: Run `npm run ext:build`

## Security Notes
1. API Protection:
   - Rate limiting implemented
   - Request validation
   - Error sanitization

2. Data Handling:
   - Screenshots stored securely
   - User data encrypted
   - 30-day retention policy

## Support
Contact: nate.mcguire@gmail.com
