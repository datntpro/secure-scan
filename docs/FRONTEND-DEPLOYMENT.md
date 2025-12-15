# Frontend Deployment Guide - SecureScan.vn

## 🚀 Cloudflare Pages Deployment

### **Tại sao chọn Cloudflare Pages?**

✅ **Miễn phí** - Unlimited bandwidth, 500 builds/month
✅ **Performance cao** - Global CDN, Edge computing
✅ **Tích hợp Git** - Auto deploy từ GitHub
✅ **Custom domains** - SSL tự động
✅ **Analytics** - Web Analytics miễn phí

## 📋 **Prerequisites**

1. **Cloudflare Account** - Đăng ký tại [cloudflare.com](https://cloudflare.com)
2. **Domain** - Mua domain `securescan.vn` (hoặc dùng subdomain)
3. **GitHub Repository** - Code đã push lên GitHub
4. **Node.js 18+** - Để build locally

## 🔧 **Setup Cloudflare Pages**

### **Bước 1: Tạo Project**

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vào **Pages** → **Create a project**
3. Chọn **Connect to Git** → **GitHub**
4. Authorize Cloudflare và chọn repository
5. Cấu hình build settings:

```
Framework preset: Next.js
Build command: npm run build
Build output directory: out
Root directory: frontend
```

### **Bước 2: Environment Variables**

Trong Cloudflare Pages → **Settings** → **Environment variables**:

**Production:**
```
NEXT_PUBLIC_API_URL=https://api.securescan.vn
NEXT_PUBLIC_WS_URL=wss://api.securescan.vn
NEXT_PUBLIC_APP_URL=https://securescan.vn
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production
```

**Preview (Staging):**
```
NEXT_PUBLIC_API_URL=https://api-staging.securescan.vn
NEXT_PUBLIC_WS_URL=wss://api-staging.securescan.vn
NEXT_PUBLIC_APP_URL=https://staging.securescan.vn
NEXT_PUBLIC_ENVIRONMENT=staging
NODE_ENV=production
```

### **Bước 3: Custom Domain**

1. Vào **Pages** → **securescan-vn** → **Custom domains**
2. Add domain: `securescan.vn`
3. Add subdomain: `www.securescan.vn` (redirect to main)
4. Cloudflare sẽ tự động setup SSL certificate

### **Bước 4: DNS Configuration**

Trong Cloudflare DNS:
```
Type: CNAME
Name: securescan.vn
Target: securescan-vn.pages.dev
Proxy: Enabled (Orange cloud)

Type: CNAME  
Name: www
Target: securescan.vn
Proxy: Enabled
```

## 🛠️ **Local Development & Deployment**

### **Manual Deployment**

```bash
# Build và deploy staging
./scripts/deploy-frontend.sh staging

# Build và deploy production  
./scripts/deploy-frontend.sh production

# Hoặc dùng npm scripts
cd frontend
npm run deploy:staging
npm run deploy:production
```

### **Auto Deployment với GitHub Actions**

File `.github/workflows/deploy-frontend.yml` đã được tạo để:

- **Auto deploy staging** khi push lên `develop` branch
- **Auto deploy production** khi push lên `main` branch  
- **Preview deployments** cho Pull Requests
- **Performance testing** với Lighthouse CI

### **Required GitHub Secrets**

Trong GitHub repository → **Settings** → **Secrets and variables** → **Actions**:

```
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

**Lấy Cloudflare API Token:**
1. Vào [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** → **Custom token**
3. Permissions:
   - `Zone:Zone:Read`
   - `Zone:Page Rules:Edit` 
   - `Cloudflare Pages:Edit`
4. Zone Resources: `Include - All zones`

## 📊 **Performance Optimization**

### **Next.js Optimizations**

```javascript
// next.config.js optimizations đã được áp dụng:
- Static export cho Cloudflare Pages
- Image optimization disabled (dùng Cloudflare Images)
- Security headers
- Cache headers
```

### **Cloudflare Optimizations**

1. **Speed** → **Optimization**:
   - Auto Minify: CSS, HTML, JS ✅
   - Brotli compression ✅
   - Early Hints ✅

2. **Caching** → **Configuration**:
   - Browser Cache TTL: 4 hours
   - Always Online: On

3. **Page Rules** (nếu cần):
   ```
   securescan.vn/assets/*
   Cache Level: Cache Everything
   Edge Cache TTL: 1 month
   ```

## 🔒 **Security Configuration**

### **Security Headers** (đã cấu hình trong `_headers`)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff  
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: [configured]
```

### **Cloudflare Security**

1. **Security** → **WAF**:
   - Security Level: Medium
   - Bot Fight Mode: On
   - Challenge Passage: 30 minutes

2. **SSL/TLS**:
   - Encryption mode: Full (strict)
   - Always Use HTTPS: On
   - HSTS: Enabled

## 📈 **Monitoring & Analytics**

### **Cloudflare Web Analytics**

1. **Analytics** → **Web Analytics**
2. Add site: `securescan.vn`
3. Copy beacon code vào `_app.tsx`

### **Performance Monitoring**

```javascript
// Thêm vào _app.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### **Error Tracking**

Tích hợp Sentry cho error monitoring:

```bash
npm install @sentry/nextjs
```

## 🚀 **Deployment Workflow**

### **Development Flow**

```
1. Develop locally → localhost:3000
2. Push to develop branch → Auto deploy to staging.securescan.vn
3. Create PR to main → Preview deployment
4. Merge to main → Auto deploy to securescan.vn
```

### **Rollback Strategy**

```bash
# Rollback qua Cloudflare Dashboard
1. Pages → securescan-vn → Deployments
2. Chọn deployment cũ → "Rollback to this deployment"

# Hoặc deploy lại từ commit cũ
git checkout <old-commit>
./scripts/deploy-frontend.sh production
```

## 📱 **Mobile & PWA**

### **Responsive Design**

Đã được implement với Tailwind CSS:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly UI elements

### **PWA Configuration** (Optional)

```bash
npm install next-pwa
```

Thêm vào `next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
```

## 🔍 **SEO Optimization**

### **Meta Tags** (đã implement)

```javascript
// Trong mỗi page
export const metadata = {
  title: 'SecureScan.vn - Quét bảo mật website',
  description: 'Dịch vụ quét lỗ hổng bảo mật website cho SME Việt Nam',
  keywords: 'bảo mật website, quét lỗ hổng, OWASP, SME Vietnam',
  openGraph: {
    title: 'SecureScan.vn',
    description: 'Quét bảo mật website tự động',
    url: 'https://securescan.vn',
    siteName: 'SecureScan.vn',
  },
};
```

### **Sitemap & Robots**

```bash
# Tạo sitemap.xml
echo "https://securescan.vn
https://securescan.vn/pricing
https://securescan.vn/features
https://securescan.vn/about" > frontend/public/sitemap.xml

# Tạo robots.txt  
echo "User-agent: *
Allow: /
Sitemap: https://securescan.vn/sitemap.xml" > frontend/public/robots.txt
```

## 💰 **Cost Estimation**

### **Cloudflare Pages (Free Tier)**
- ✅ Unlimited bandwidth
- ✅ 500 builds/month
- ✅ 100 custom domains
- ✅ Global CDN

### **Paid Features** (nếu cần)
- **Cloudflare Pro**: $20/month
  - Advanced analytics
  - Image optimization
  - Mobile optimization
  
- **Workers**: $5/month + usage
  - Edge computing
  - API routes
  - Real-time features

## 🎯 **Next Steps**

### **Immediate (Sau khi deploy)**
1. ✅ Test website trên mobile/desktop
2. ✅ Verify SSL certificate
3. ✅ Check performance với Lighthouse
4. ✅ Setup Google Analytics
5. ✅ Configure error monitoring

### **Short-term**
1. **Custom domain**: Mua `securescan.vn`
2. **Backend API**: Deploy backend lên `api.securescan.vn`
3. **Email service**: Setup transactional emails
4. **Payment**: Tích hợp Stripe/PayPal

### **Long-term**
1. **Multi-language**: English version
2. **Mobile app**: React Native/Flutter
3. **White-label**: Custom branding cho agencies
4. **API marketplace**: Public API cho developers

## 🆘 **Troubleshooting**

### **Common Issues**

**Build fails:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache
rm -rf frontend/.next frontend/node_modules
npm install
```

**Static export issues:**
```bash
# Check for dynamic routes
# Convert to static or use generateStaticParams
```

**Environment variables not working:**
```bash
# Verify in Cloudflare Pages settings
# Must start with NEXT_PUBLIC_ for client-side
```

### **Debug Commands**

```bash
# Test build locally
cd frontend
npm run build
npm run preview

# Check bundle size
npm run build -- --analyze

# Test on different devices
npx browserslist
```

## 📞 **Support**

- **Cloudflare Docs**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **GitHub Issues**: Repository issues tab
- **Community**: [Cloudflare Discord](https://discord.cloudflare.com)

---

**Kết quả**: Frontend SecureScan.vn sẽ được deploy với performance cao, bảo mật tốt và cost thấp trên Cloudflare Pages! 🚀