# Manus Built-in Hosting Deployment Guide

## Overview

This guide walks you through deploying the Investment Outlook 2026 platform using Manus's built-in hosting infrastructure. This is the **recommended deployment method** due to its simplicity, zero DevOps overhead, and seamless integration with the development environment.

---

## Prerequisites

- ✅ Project initialized with `webdev_init_project`
- ✅ All features implemented and tested
- ✅ At least one checkpoint saved
- ✅ No critical bugs or errors

---

## Deployment Steps

### 1. Save a Checkpoint

Before deploying, you must create a checkpoint to snapshot your current project state.

**Via Chat:**
```
"Save a checkpoint with message: Production release v1.0"
```

**What happens:**
- Project files are committed to Git
- Database schema is captured
- Environment variables are recorded
- A version ID is generated (e.g., `12a13f89`)

**Checkpoint Card appears in chat** with:
- Screenshot preview
- "Dashboard" button → Opens Management UI
- "Publish" button → Triggers deployment

---

### 2. Configure Environment (Optional)

#### Custom Domain Setup

**Option A: Purchase Domain in Manus**
1. Open Management UI → Settings → Domains
2. Click "Purchase Domain"
3. Search for available domain (e.g., `investmentoutlook2026.com`)
4. Complete purchase within Manus
5. Domain automatically configured with SSL

**Option B: Bind Existing Domain**
1. Open Management UI → Settings → Domains
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `www.yourcompany.com`)
4. Copy DNS records (CNAME or A record)
5. Update DNS settings with your domain registrar
6. Wait for DNS propagation (5-60 minutes)
7. SSL certificate automatically provisioned

**Default Domain:**
If you don't configure a custom domain, your site will be available at:
```
https://[your-prefix].manus.space
```

You can customize the prefix in Settings → Domains.

#### Environment Variables

**Built-in Variables (Auto-configured):**
- `BUILT_IN_FORGE_API_KEY` - Manus API authentication
- `JWT_SECRET` - Session management
- `OAUTH_SERVER_URL` - OAuth provider
- `VITE_APP_TITLE` - Website title
- `VITE_APP_LOGO` - Logo URL
- Database connection strings

**Custom Variables:**
If you need additional environment variables (e.g., third-party API keys):

1. Open Management UI → Settings → Secrets
2. Click "Add Secret"
3. Enter key-value pairs
4. Save changes
5. Restart deployment

---

### 3. Publish to Production

#### Via Management UI (Recommended)

1. **Open Management UI**
   - Click the header icon in the chatbox
   - Or click "Dashboard" button on checkpoint card

2. **Navigate to Latest Checkpoint**
   - Checkpoints are listed chronologically
   - Latest checkpoint shows "Publish" button

3. **Click "Publish"**
   - Deployment starts automatically
   - Progress indicator shows build status

4. **Monitor Deployment**
   - Build logs appear in real-time
   - Typical deployment time: 2-5 minutes

5. **Deployment Complete**
   - Green checkmark indicates success
   - Live URL displayed
   - Site is now publicly accessible

#### Deployment Process (Behind the Scenes)

1. **Build Phase**
   - Frontend assets compiled (Vite build)
   - TypeScript compiled to JavaScript
   - Assets optimized and minified
   - Static files uploaded to CDN

2. **Database Migration**
   - Schema changes applied to production database
   - Migrations run automatically
   - Rollback available if migration fails

3. **Server Deployment**
   - Node.js server deployed to Manus infrastructure
   - Environment variables injected
   - Health checks performed

4. **DNS & SSL**
   - Domain routing configured
   - SSL certificate provisioned (Let's Encrypt)
   - HTTPS enforced automatically

5. **Go Live**
   - Traffic routed to new deployment
   - Old version kept for rollback
   - Zero-downtime deployment

---

### 4. Verify Deployment

#### Check Website

1. **Open Live URL**
   ```
   https://your-domain.manus.space
   ```

2. **Test Key Features**
   - Homepage loads correctly
   - Stock quotes fetching works
   - News feed displays articles
   - Sentiment analysis shows data
   - All navigation links work

3. **Test API Endpoints**
   ```bash
   # Stock quote
   curl https://your-domain.manus.space/api/stock-quote/AAPL
   
   # Chart data
   curl https://your-domain.manus.space/api/stock-chart/AAPL?period=1mo
   
   # Multiple quotes
   curl -X POST https://your-domain.manus.space/api/stock-quotes \
     -H "Content-Type: application/json" \
     -d '{"tickers":["AAPL","MSFT","GOOGL"]}'
   ```

#### Check Database

1. Open Management UI → Database
2. Verify tables exist
3. Check data integrity
4. Test CRUD operations

#### Monitor Analytics

1. Open Management UI → Dashboard
2. View real-time analytics:
   - Page views (PV)
   - Unique visitors (UV)
   - Geographic distribution
   - Traffic sources

---

## Post-Deployment

### Monitoring

**Built-in Analytics:**
- Management UI → Dashboard
- Real-time visitor tracking
- No external analytics service needed

**Custom Monitoring:**
If you need advanced monitoring:
1. Integrate Sentry for error tracking
2. Add New Relic for APM
3. Use LogRocket for session replay

### Updates & Rollbacks

#### Deploy Updates

1. Make changes in development environment
2. Test thoroughly
3. Save new checkpoint
4. Click "Publish" on new checkpoint
5. Zero-downtime deployment

#### Rollback to Previous Version

1. Open Management UI
2. Find previous checkpoint
3. Click "Rollback" button
4. Confirm rollback
5. Previous version restored instantly

**Rollback is instant** - no rebuild required.

### Scaling

Manus automatically handles scaling:
- **Traffic Spikes:** Auto-scaling infrastructure
- **Database:** Managed PostgreSQL with auto-scaling
- **CDN:** Global edge network for static assets
- **Caching:** Built-in Redis caching

No manual configuration needed.

---

## Troubleshooting

### Deployment Failed

**Check Build Logs:**
1. Open Management UI → Latest checkpoint
2. View deployment logs
3. Look for error messages

**Common Issues:**
- TypeScript errors → Fix in code, save new checkpoint
- Database migration failed → Check schema changes
- Environment variable missing → Add in Settings → Secrets

### Site Not Loading

**Check Domain Configuration:**
1. Verify DNS records are correct
2. Wait for DNS propagation (up to 60 minutes)
3. Check SSL certificate status

**Check Server Status:**
1. Management UI → Dashboard → Status
2. Look for error indicators
3. Check recent deployment logs

### API Errors

**Check Environment Variables:**
1. Settings → Secrets
2. Verify all required variables are set
3. Check for typos in variable names

**Check Database Connection:**
1. Management UI → Database
2. Test connection
3. Verify credentials

### Performance Issues

**Check Analytics:**
1. Dashboard → Traffic patterns
2. Identify slow endpoints
3. Review server logs

**Optimize:**
- Enable caching for API responses
- Optimize database queries
- Use CDN for static assets (automatic)

---

## Best Practices

### Development Workflow

1. **Local Development**
   - Make changes in sandbox
   - Test thoroughly
   - Run all tests

2. **Staging (Optional)**
   - Create separate Manus project for staging
   - Deploy to staging first
   - Test in production-like environment

3. **Production**
   - Save checkpoint with descriptive message
   - Deploy during low-traffic hours
   - Monitor for 15-30 minutes post-deployment

### Checkpoint Strategy

**When to Create Checkpoints:**
- ✅ After completing a feature
- ✅ Before making risky changes
- ✅ Before deploying to production
- ✅ After fixing critical bugs

**Checkpoint Naming:**
- Use semantic versioning: `v1.0.0`, `v1.1.0`, `v2.0.0`
- Include brief description: `v1.2.0 - Add sentiment analysis`
- Date for hotfixes: `v1.1.1 - Hotfix 2025-12-26`

### Security

**Environment Variables:**
- Never commit secrets to Git
- Use Manus Secrets management
- Rotate API keys regularly

**Database:**
- Enable SSL connections (Settings → Database)
- Use strong passwords
- Limit access to production database

**API Security:**
- Implement rate limiting
- Add authentication for sensitive endpoints
- Validate all user inputs

---

## Cost Considerations

### Manus Hosting Pricing

**Included in Subscription:**
- Hosting infrastructure
- Database (PostgreSQL)
- SSL certificates
- CDN bandwidth
- Analytics
- Automatic backups

**Additional Costs:**
- Custom domains (if purchased through Manus)
- High-volume traffic (check pricing tiers)
- Additional database storage (if needed)

**No Hidden Fees:**
- No server maintenance costs
- No DevOps engineer needed
- No infrastructure management

---

## Comparison: Manus vs. Traditional Hosting

| Feature | Manus Hosting | AWS/Traditional |
|---------|---------------|-----------------|
| Setup Time | 5 minutes | Hours to days |
| DevOps Required | None | Yes |
| SSL Certificates | Automatic | Manual setup |
| Database Hosting | Included | Separate service |
| Scaling | Automatic | Manual configuration |
| Monitoring | Built-in | Requires setup |
| Rollback | One-click | Complex process |
| Cost | Predictable | Variable |
| Maintenance | Zero | Ongoing |

---

## Support

### Getting Help

**Documentation:**
- Manus Help Center: https://help.manus.im
- API Documentation: In Management UI

**Community:**
- Discord community
- GitHub discussions

**Support Tickets:**
- Submit at https://help.manus.im
- Response time: 24-48 hours

---

## Conclusion

Manus built-in hosting provides a production-ready deployment solution with zero DevOps overhead. The platform handles all infrastructure concerns, allowing you to focus on building features rather than managing servers.

**Deployment Checklist:**
- ✅ Save checkpoint
- ✅ Configure domain (optional)
- ✅ Set environment variables
- ✅ Click "Publish"
- ✅ Verify deployment
- ✅ Monitor analytics

**Your site is now live!** 🚀

---

*Last Updated: December 26, 2025*
*Manus Platform Version: Latest*
