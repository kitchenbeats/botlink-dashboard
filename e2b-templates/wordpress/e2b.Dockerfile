# ReactWrite WordPress Pro Template
# Production-ready WordPress with caching, security, and performance optimizations

FROM php:8.3-apache

# Install system dependencies including Redis
RUN apt-get update && apt-get install -y \
    git \
    vim \
    nano \
    jq \
    wget \
    curl \
    unzip \
    supervisor \
    mariadb-server \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions required by WordPress
RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable mysqli

# Install additional useful PHP extensions including OPcache and Redis
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd zip mbstring xml opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# Configure PHP for production (OPcache, memory, security)
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=60'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'memory_limit=512M'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'max_execution_time=300'; \
    echo 'max_input_time=300'; \
    echo 'expose_php=Off'; \
    echo 'display_errors=Off'; \
    echo 'log_errors=On'; \
} > /usr/local/etc/php/conf.d/wordpress-performance.ini

# Install WP-CLI (WordPress command line tool)
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Enable Apache modules for rewrite and headers
RUN a2enmod rewrite headers

# Create WordPress installation directory
WORKDIR /templates/wordpress

# Download and extract WordPress 6.8.2 (latest stable as of Oct 2025)
RUN wp core download --version=6.8.2 --allow-root

# Create WordPress config with database credentials
RUN wp config create \
    --dbname=wordpress \
    --dbuser=root \
    --dbpass=root \
    --dbhost=localhost \
    --allow-root

# Set up MySQL database
RUN service mariadb start && \
    mysql -e "CREATE DATABASE IF NOT EXISTS wordpress;" && \
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';" && \
    mysql -e "FLUSH PRIVILEGES;"

# Install WordPress with default theme
RUN service mariadb start && service redis-server start && \
    wp core install \
        --url=localhost:8080 \
        --title="ReactWrite WordPress Site" \
        --admin_user=admin \
        --admin_password=admin \
        --admin_email=admin@example.com \
        --allow-root

# Install and configure Redis Object Cache (core performance feature)
RUN service mariadb start && service redis-server start && \
    wp plugin install redis-cache --activate --allow-root && \
    wp redis enable --allow-root

# Note: Additional plugins are NOT pre-installed.
# Users can install security/performance plugins as needed.
# See README.md for recommended plugins

# Security hardening - disable file editing and XML-RPC
RUN echo "define('DISALLOW_FILE_EDIT', true);" >> /templates/wordpress/wp-config.php && \
    echo "define('DISALLOW_FILE_MODS', false);" >> /templates/wordpress/wp-config.php

# Security hardening - add security keys
RUN KEYS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/) && \
    sed -i "/AUTH_KEY/,/NONCE_SALT/d" /templates/wordpress/wp-config.php && \
    sed -i "/table_prefix/i ${KEYS}" /templates/wordpress/wp-config.php

# Configure wp-config for Redis with optimal settings
RUN echo "define('WP_REDIS_HOST', '127.0.0.1');" >> /templates/wordpress/wp-config.php && \
    echo "define('WP_REDIS_PORT', 6379);" >> /templates/wordpress/wp-config.php && \
    echo "define('WP_CACHE', true);" >> /templates/wordpress/wp-config.php && \
    echo "define('WP_REDIS_CLIENT', 'phpredis');" >> /templates/wordpress/wp-config.php && \
    echo "define('WP_REDIS_MAXTTL', 86400);" >> /templates/wordpress/wp-config.php && \
    echo "define('WP_REDIS_SELECTIVE_FLUSH', true);" >> /templates/wordpress/wp-config.php

# Additional security headers in .htaccess
RUN echo '<IfModule mod_headers.c>\n\
    Header set X-XSS-Protection "1; mode=block"\n\
    Header set X-Frame-Options "SAMEORIGIN"\n\
    Header set X-Content-Type-Options "nosniff"\n\
    Header set Referrer-Policy "strict-origin-when-cross-origin"\n\
    Header set Permissions-Policy "geolocation=(self), microphone=()"\n\
</IfModule>\n\
\n\
# Disable XML-RPC (2025 best practice - prevents DDoS/brute force)\n\
<Files xmlrpc.php>\n\
    Order Deny,Allow\n\
    Deny from all\n\
</Files>' >> /templates/wordpress/.htaccess

# Configure Apache to serve WordPress
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /templates/wordpress\n\
    <Directory /templates/wordpress>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# Initialize git repository
RUN git config --global user.email "bot@reactwrite.com" && \
    git config --global user.name "ReactWrite Bot" && \
    git init && \
    git add . && \
    git commit -m "Initial WordPress template commit"

# Fix permissions
RUN chown -R www-data:www-data /templates/wordpress && \
    chmod -R 755 /templates/wordpress

# Create startup script to start MySQL, Redis, and Apache
RUN echo '#!/bin/bash\n\
service mariadb start\n\
service redis-server start\n\
apache2ctl -D FOREGROUND' > /start.sh && \
    chmod +x /start.sh

# Set working directory
WORKDIR /home/user

# Set environment variables
ENV TERM=xterm-256color
ENV APACHE_RUN_USER=www-data
ENV APACHE_RUN_GROUP=www-data
ENV APACHE_LOG_DIR=/var/log/apache2

# Add helpful aliases
RUN echo 'alias ll="ls -lah"' >> /root/.bashrc && \
    echo 'alias g="git"' >> /root/.bashrc && \
    echo 'alias wp="wp --allow-root"' >> /root/.bashrc

# Expose port 80 for Apache
EXPOSE 80

# Start services
CMD ["/start.sh"]
