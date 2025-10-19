# 🚀 Shopify App Installation Guide

## Complete guide to install Section Store in Shopify Partners and test on dev store

---

## 📋 Prerequisites

Before you begin, ensure you have:
- ✅ Shopify Partners account
- ✅ Development store created
- ✅ App deployed and running at: `https://sectionit.indigenservices.com`
- ✅ Database seeded with sample data

---

## 🔧 Step 1: Configure Shopify Partners Dashboard

### 1.1 Create App in Partners Dashboard

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Click **Apps** → **Create app**
3. Choose **Create app manually**
4. Enter App Details:
   - **App name**: Section Store
   - **App URL**: `https://sectionit.indigenservices.com`
   - **Allowed redirection URL(s)**:
     ```
     https://sectionit.indigenservices.com/auth/callback
     https://sectionit.indigenservices.com/auth/shopify/callback
     https://sectionit.indigenservices.com/api/auth/callback
     ```

### 1.2 Configure App Settings

**Client Credentials**:
- Copy your **API key** (already set: `edb7676b0b64cfffcc342eab222baf4a`)
- Copy your **API secret key** (already configured in `.env`)

**App Setup**:
- **App URL**: `https://sectionit.indigenservices.com`
- **Embedded app**: ✅ Yes (Enabled)
- **Exit iframe**: ✅ No

### 1.3 Set API Access Scopes

Navigate to **Configuration** → **API Scopes**:

Required scopes:
```
✅ read_themes
✅ write_themes
```

Optional scopes (for future features):
```
⏸️ read_products
⏸️ write_products
⏸️ read_customers
⏸️ read_orders
```

### 1.4 Configure App Extensions

**App proxy** (optional):
- Subpath prefix: `apps`
- Subpath: `section-store`
- Proxy URL: `https://sectionit.indigenservices.com/api/proxy`

---

## 🛠️ Step 2: Update Environment Variables

### 2.1 Verify Server Environment

SSH into server and check `.env`:

```bash
ssh root@72.60.99.154
cd /var/www/sectionit
cat .env
```

Should contain:
```env
# Shopify Configuration
SHOPIFY_API_KEY=edb7676b0b64cfffcc342eab222baf4a
SHOPIFY_API_SECRET=your_api_secret_from_partners
SHOPIFY_APP_URL=https://sectionit.indigenservices.com
SCOPES=read_themes,write_themes

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/sectionit_db

# Session Storage
SESSION_SECRET=your_generated_secret

# Admin Panel
ADMIN_SECRET_KEY=your_admin_secret

# Environment
NODE_ENV=production
PORT=3001
```

### 2.2 Update if Needed

```bash
nano /var/www/sectionit/.env
# Make changes
# Save with Ctrl+X, Y, Enter

# Restart app
pm2 restart sectionit
```

---

## 🧪 Step 3: Test Installation on Development Store

### 3.1 Install App on Dev Store

**Method 1: From Partners Dashboard**
1. Go to **Apps** → **Section Store**
2. Click **Test on development store**
3. Select your development store
4. Click **Install**

**Method 2: Direct URL**
1. Get your app's installation URL from Partners
2. Or use: `https://YOUR_STORE.myshopify.com/admin/oauth/install_custom_app?client_id=edb7676b0b64cfffcc342eab222baf4a`
3. Replace `YOUR_STORE` with your dev store name

### 3.2 Grant Permissions

When prompted:
1. Review the requested permissions:
   - Read themes
   - Write themes
2. Click **Install app**

### 3.3 Verify Installation

After installation, you should:
1. Be redirected to: `https://YOUR_STORE.myshopify.com/admin/apps/section-store`
2. See the Section Store embedded app
3. See navigation in the Shopify admin sidebar

---

## ✅ Step 4: Verify Functionality

### 4.1 Check Database

Verify shop was created:

```bash
ssh root@72.60.99.154
sudo -u postgres psql -d sectionit_db -c "SELECT shopDomain, email, isActive, createdAt FROM shops ORDER BY createdAt DESC LIMIT 5;"
```

### 4.2 Check Session Storage

```bash
sudo -u postgres psql -d sectionit_db -c "SELECT id, shop, state, isOnline FROM session ORDER BY expires DESC LIMIT 5;"
```

### 4.3 Test App Features

**In Shopify Admin:**

1. **Navigate to App**:
   - Go to **Apps** → **Section Store**
   - Should load without errors

2. **Browse Sections**:
   - Click **Explore** in app navigation
   - Should see 10 sample sections

3. **View Section Details**:
   - Click on any section
   - Should show price, description, preview

4. **Test Purchase Flow** (if billing enabled):
   - Click **Purchase**
   - Should redirect to Shopify billing

5. **Check Installation**:
   - After purchase, click **Install**
   - Should install to active theme

---

## 🔍 Step 5: Troubleshooting

### Issue: "410 Client Error"

**Cause**: Missing or invalid session

**Solution**:
1. Check OAuth redirect URLs in Partners Dashboard
2. Verify `SHOPIFY_API_KEY` matches Partners Dashboard
3. Clear browser cookies
4. Reinstall app

### Issue: "Application Error"

**Cause**: Server error or missing dependencies

**Solution**:
1. Check server logs:
   ```bash
   ssh root@72.60.99.154
   pm2 logs sectionit --lines 50
   ```

2. Check build status:
   ```bash
   cd /var/www/sectionit
   npm run build
   ```

3. Restart app:
   ```bash
   pm2 restart sectionit
   ```

### Issue: "Access Denied"

**Cause**: Insufficient permissions or scope mismatch

**Solution**:
1. Verify scopes in Partners Dashboard match `.env` SCOPES
2. Uninstall and reinstall app to refresh permissions

### Issue: Embedded App Not Loading

**Cause**: Content Security Policy or iframe issues

**Solution**:
1. Ensure **Embedded app** is enabled in Partners Dashboard
2. Check that App Bridge is initialized (already done in `app.tsx`)
3. Verify domain is whitelisted

---

## 📊 Step 6: Monitor & Verify

### 6.1 Monitor Server Logs

```bash
# Real-time logs
ssh root@72.60.99.154
pm2 logs sectionit

# Recent errors
pm2 logs sectionit --err --lines 100
```

### 6.2 Monitor Database

```bash
# Check sessions
sudo -u postgres psql -d sectionit_db -c "SELECT COUNT(*) FROM session WHERE expires > NOW();"

# Check shops
sudo -u postgres psql -d sectionit_db -c "SELECT COUNT(*) FROM shops WHERE isActive = true;"

# Check purchases
sudo -u postgres psql -d sectionit_db -c "SELECT COUNT(*) FROM purchases WHERE status = 'completed';"
```

### 6.3 Check SSL Certificate

```bash
# Verify SSL expiry
echo | openssl s_client -servername sectionit.indigenservices.com -connect sectionit.indigenservices.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🎯 Step 7: Test Key Features

### Test Checklist

**Admin Panel** (https://sectionit.indigenservices.com/admin/login):
- [ ] Login works (admin@sectionstore.com / admin123)
- [ ] Dashboard shows metrics
- [ ] Can view sections
- [ ] Can create new section
- [ ] Can edit section
- [ ] Can delete section
- [ ] Can view customers
- [ ] Can view orders
- [ ] Bundle management works
- [ ] Analytics displays
- [ ] Settings can be updated

**Merchant App** (In Shopify Admin → Apps → Section Store):
- [ ] App loads in iframe
- [ ] Navigation works
- [ ] Can browse sections
- [ ] Can view section details
- [ ] Can add to favorites
- [ ] Can view bundles
- [ ] Purchase button appears
- [ ] Install button appears (after purchase)
- [ ] Reviews display
- [ ] Help center accessible

**Authentication**:
- [ ] OAuth flow completes
- [ ] Session persists across page loads
- [ ] Can access different pages without re-auth
- [ ] Logout works properly

**Database**:
- [ ] Shop record created on install
- [ ] Session stored correctly
- [ ] Purchases recorded
- [ ] Installations tracked
- [ ] Reviews saved
- [ ] Favorites saved

---

## 🔐 Security Checklist

Before going live:
- [ ] API secrets are secure and not exposed
- [ ] Session secrets are random and strong
- [ ] HTTPS is enforced (SSL active)
- [ ] Database has proper authentication
- [ ] Admin panel has secure passwords
- [ ] GDPR webhooks are configured
- [ ] Rate limiting is implemented (future)
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CSRF protection enabled (App Bridge)

---

## 📈 Performance Checklist

- [ ] Build completes in < 5 seconds
- [ ] Page loads in < 2 seconds
- [ ] Database queries are optimized
- [ ] Images are compressed
- [ ] Static assets are cached
- [ ] PM2 is running stable
- [ ] No memory leaks
- [ ] No infinite loops in logs

---

## 🚀 Go Live Checklist

Before submitting to Shopify App Store:

### App Requirements
- [ ] App functions as described
- [ ] No broken links or pages
- [ ] Professional UI/UX
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Empty states designed

### Documentation
- [ ] App description written
- [ ] Installation instructions clear
- [ ] Screenshots uploaded (6-8)
- [ ] Demo video created (optional)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support contact provided

### Testing
- [ ] Tested on multiple stores
- [ ] Tested on different themes
- [ ] Tested purchase flow end-to-end
- [ ] Tested installation flow
- [ ] Tested uninstallation
- [ ] Tested GDPR webhooks
- [ ] Load tested for performance

### Compliance
- [ ] GDPR compliant
- [ ] Privacy policy meets requirements
- [ ] Proper data handling
- [ ] Webhook responses implemented
- [ ] App uninstall cleanup works

---

## 📝 Common URLs Reference

### Production URLs
```
App URL: https://sectionit.indigenservices.com
Admin Panel: https://sectionit.indigenservices.com/admin/login
OAuth Callback: https://sectionit.indigenservices.com/auth/callback
Webhooks: https://sectionit.indigenservices.com/webhooks
API: https://sectionit.indigenservices.com/api/*
```

### Development Store URLs
```
Store Admin: https://YOUR_STORE.myshopify.com/admin
Install App: https://YOUR_STORE.myshopify.com/admin/apps
App Embed: https://YOUR_STORE.myshopify.com/admin/apps/section-store
```

### Shopify Partners URLs
```
Partners Dashboard: https://partners.shopify.com/
App Settings: https://partners.shopify.com/YOUR_ORG/apps/YOUR_APP_ID
Dev Stores: https://partners.shopify.com/YOUR_ORG/stores
```

---

## 🎊 Success Criteria

Your app is successfully installed when:

✅ **Installation Complete**:
- App appears in Shopify admin sidebar
- No errors in browser console
- Session is active and persisted

✅ **Features Working**:
- Can browse all sections
- Can view section details
- Purchase flow initiates correctly
- Database records are created

✅ **No Errors**:
- No 500 errors in logs
- No 410 client errors
- No "Application Error" pages
- SSL certificate valid

✅ **Performance Good**:
- App loads in < 3 seconds
- Navigation is smooth
- No lag or delays
- PM2 shows "online" status

---

## 📞 Support & Help

### Get Help
- **Email**: support@indigenservices.com
- **Server**: SSH root@72.60.99.154
- **Logs**: `pm2 logs sectionit`
- **Database**: `sudo -u postgres psql -d sectionit_db`

### Useful Commands
```bash
# Restart app
pm2 restart sectionit

# View logs
pm2 logs sectionit --lines 100

# Check status
pm2 status

# Rebuild app
cd /var/www/sectionit && npm run build

# Check database
sudo -u postgres psql -d sectionit_db
```

---

**Last Updated**: October 19, 2025  
**App Version**: 2.0.0  
**Status**: Production Ready ✅

---

*Follow this guide step-by-step to successfully install and test your Section Store app in Shopify! 🎉*
