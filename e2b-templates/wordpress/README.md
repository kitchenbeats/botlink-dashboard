# ReactWrite WordPress Pro Template

Production-ready WordPress environment with Redis caching, security hardening, and optimal PHP configuration.

## What's Included

### Core Stack
- **WordPress 6.8.2** - Latest stable (October 2025) with default Twenty Twenty-Four theme
- **PHP 8.3** with Apache web server (fully supported)
- **MySQL/MariaDB** database
- **Redis Object Cache** - Database caching (pre-installed & activated)
- **WP-CLI** - WordPress command line tool
- **Git** - Version control initialized

### Built-in Performance Features
- **PHP OPcache** - Bytecode caching (256MB)
- **Redis Object Cache Plugin** - Database query caching with PhpRedis
  - ✅ Pre-installed and activated
  - Selective flush enabled
  - Optimized TTL (24h max)
  - PhpRedis client for best performance
- PHP memory limit: 512MB
- Upload size: 64MB
- Max execution time: 300s

### Built-in Security Features
- **XML-RPC disabled** - Blocks DDoS/brute force exploits via .htaccess
- **Security headers** - XSS Protection, Frame Options, Content-Type, Referrer Policy
- **File editing disabled** in wp-admin (DISALLOW_FILE_EDIT)
- **Fresh security keys/salts** - Generated on build
- **bcrypt password hashing** - WordPress 6.8.2 feature
- **PHP hardened** - expose_php off, display_errors off
- Standard WordPress login at `/wp-admin`

## Default Credentials

- **WordPress Admin**:
  - URL: `http://localhost/wp-admin`
  - Username: `admin`
  - Password: `admin`
  - ⚠️ **Change these immediately in production!**

- **MySQL Database**:
  - Database: `wordpress`
  - User: `root`
  - Password: `root`
  - Host: `localhost`

## Quick Start

1. The WordPress site is located at `/templates/wordpress`
2. Apache serves on port 80
3. Access wp-admin at: `/wp-admin`
4. Redis caching is already active - check status with `wp redis status`

## Installed Plugin

**Performance:**
- ✅ **Redis Object Cache** - Database caching (already activated)

## Recommended Plugins to Install (Optional)

Install additional plugins as needed via WP-CLI or wp-admin:

### Security Plugins (Choose One)
```bash
# MalCare - Cloud-based scanner (recommended for performance)
wp plugin install malcare-security --activate

# OR Wordfence - Traditional security plugin
wp plugin install wordfence --activate

# Limit login attempts (recommended for all sites)
wp plugin install limit-login-attempts-reloaded --activate

# Two-Factor Authentication (highly recommended)
wp plugin install two-factor --activate

# Hide login page (optional - changes /wp-admin URL)
wp plugin install wps-hide-login --activate
```

### Performance Plugins
```bash
# W3 Total Cache - Full-page caching
wp plugin install w3-total-cache --activate

# Autoptimize - CSS/JS optimization
wp plugin install autoptimize --activate

# WP Super Cache - Alternative to W3TC
wp plugin install wp-super-cache --activate
```

### Development Tools
```bash
# Query Monitor - Debug bar
wp plugin install query-monitor --activate

# WP Migrate DB - Database migration
wp plugin install wp-migrate-db --activate
```

## Common WP-CLI Commands

```bash
# Check Redis cache status
wp redis status
wp redis info

# Flush caches
wp cache flush
wp redis flush

# List all plugins
wp plugin list

# Install a plugin
wp plugin install akismet --activate

# List themes
wp theme list

# Install a theme
wp theme install astra --activate

# Create a new post
wp post create --post_title="Hello World" --post_status=publish

# Update WordPress core
wp core update

# Update all plugins
wp plugin update --all

# Export database
wp db export backup.sql

# Search and replace URLs
wp search-replace 'old-url.com' 'new-url.com'
```

## File Structure

```
/templates/wordpress/
├── wp-admin/           # WordPress admin files
├── wp-content/        # Themes, plugins, uploads
│   ├── themes/        # Install themes here
│   │   └── twentytwentyfour/  # Default theme
│   ├── plugins/       # Plugins directory
│   │   └── redis-cache/       # Pre-installed
│   └── uploads/       # Media uploads
├── wp-includes/       # WordPress core files
├── wp-config.php      # WordPress configuration
└── .htaccess          # Apache configuration with security headers
```

## Development Tips

- Edit theme files in `/templates/wordpress/wp-content/themes/`
- Add custom plugins to `/templates/wordpress/wp-content/plugins/`
- Database changes are persisted during the sandbox session
- Use WP-CLI for quick WordPress management tasks
- Redis cache is automatically enabled - no configuration needed

## Services

- **Apache**: Automatically started on boot (port 80)
- **MySQL**: Automatically started on boot
- **Redis**: Automatically started on boot (port 6379)

## Performance Monitoring

Check cache and performance status:
```bash
# Redis cache hit/miss ratio
wp redis status

# Redis cache statistics
wp redis info

# PHP OPcache status
php -i | grep opcache

# Database queries (requires Query Monitor plugin)
wp query-monitor
```

## Security Best Practices

### Essential (Do First)
1. ✅ **Change admin password** - Never use "admin/admin" in production
2. ✅ **Change database password** - Update in wp-config.php
3. ✅ **Update site URL** - wp option update siteurl 'https://yourdomain.com'

### Recommended
4. **Install security plugin** - MalCare or Wordfence (see above)
5. **Enable 2FA** - Install two-factor plugin for admin users
6. **Limit login attempts** - Install limit-login-attempts-reloaded
7. **Hide login page** (optional) - Install wps-hide-login
8. **Keep WordPress updated** - wp core update
9. **Keep plugins updated** - wp plugin update --all

### Already Configured
- ✅ XML-RPC is disabled
- ✅ Security headers are set
- ✅ File editing is disabled in wp-admin
- ✅ Fresh security keys/salts

## Production Checklist

- [ ] Change admin username (create new admin, delete default)
- [ ] Change admin password
- [ ] Change database password in wp-config.php
- [ ] Update site URL (wp option update siteurl)
- [ ] Install SSL certificate
- [ ] Configure backups (use UpdraftPlus or similar)
- [ ] Install security plugin
- [ ] Enable Two-Factor Authentication
- [ ] Test Redis cache (wp redis status)
- [ ] Scan for vulnerabilities
- [ ] Test site performance (GTmetrix, PageSpeed Insights)
- [ ] Set up monitoring/uptime checks

## October 2025 Updates

This template follows the latest WordPress best practices:

**Core Versions:**
- **WordPress 6.8.2** (latest stable release)
- **PHP 8.3** (recommended for WordPress in 2025)
- **Redis with PhpRedis** extension (optimal performance)

**2025 Security Standards:**
- XML-RPC disabled (prevents DDoS/brute force)
- bcrypt password hashing (WordPress 6.8.2 feature)
- Modern security headers
- File editing disabled by default

**Performance Optimization:**
- Redis Object Cache with selective flush
- PHP OPcache enabled
- Optimized PHP settings (512MB memory, 64MB uploads)

## Notes

- Default theme: Twenty Twenty-Four (WordPress default)
- Login URL: Standard `/wp-admin` (change with wps-hide-login plugin if desired)
- Redis caching is active and configured - no setup needed
- File editing in wp-admin is disabled for security
- Security headers and XML-RPC blocking are automatically applied
- Git is pre-initialized with an initial commit
- This template is production-ready with core optimizations
- Additional plugins can be installed as needed

## Troubleshooting

**Redis not working?**
```bash
# Check Redis status
wp redis status

# Enable Redis
wp redis enable

# Check Redis service
service redis-server status
```

**Slow performance?**
```bash
# Check Redis hit rate
wp redis info

# Clear all caches
wp cache flush
wp redis flush
```

**Can't login?**
```bash
# Reset admin password
wp user update admin --user_pass=newpassword
```
