# ReactWrite Next.js SaaS Starter Template
# Pre-installed with ReactWrite SaaS Template (https://github.com/i-dream-of-ai/nextjs-saas-template)

# Use lightweight Node.js base for minimal image size
FROM node:24-slim

# Install all system tools and PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    vim \
    nano \
    jq \
    postgresql \
    postgresql-contrib \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 process manager and global packages
RUN npm install -g \
    pnpm \
    pm2 \
    typescript \
    tsx \
    nodemon \
    dotenv-cli \
    @anthropic-ai/claude-code \
    && npm cache clean --force

# Set NODE_PATH to allow require() to find globally installed packages
ENV NODE_PATH=/usr/local/lib/node_modules

# Copy and install ReactWrite SaaS starter template
WORKDIR /templates/nextjs-saas
COPY template-source/ .
RUN pnpm install \
    && pnpm store prune

# Create a default .env.local with local PostgreSQL connection
RUN echo 'POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/saas' > .env.local && \
    echo 'AUTH_SECRET=development-secret-key-change-in-production-min-32-chars' >> .env.local && \
    echo '# Add your own environment variables above this line' >> .env.local

# Copy config files from local configs directory
# Create configs directory and copy PM2 config and DB init script
RUN mkdir -p /templates/nextjs-saas/configs
COPY configs/ecosystem.config.js /templates/nextjs-saas/configs/ecosystem.config.js
COPY configs/.mcp.json /templates/nextjs-saas/.mcp.json
COPY configs/init-saas-db.sh /usr/local/bin/init-saas-db.sh
RUN chmod +x /usr/local/bin/init-saas-db.sh

# No config changes needed - Next.js 16 Fast Refresh works in iframes by default
# Just need: iframe with allow-same-origin + dev server on 0.0.0.0 (both already configured)

# Initialize git repository with initial commit
RUN git config --global user.email "bot@reactwrite.com" && \
    git config --global user.name "ReactWrite Bot" && \
    git init && \
    git add . && \
    git commit -m "Initial template commit"

# Fix permissions - allow user to write to templates directory
RUN chmod -R 777 /templates

# Set working directory
WORKDIR /home/user

# Set environment variables for better terminal experience
ENV TERM=xterm-256color
ENV NODE_ENV=development

# Add helpful aliases
RUN echo 'alias ll="ls -lah"' >> /root/.bashrc && \
    echo 'alias g="git"' >> /root/.bashrc && \
    echo 'alias claude="claude-code"' >> /root/.bashrc

# Note: To auto-start dev server in workspace, ReactWrite will need to:
# 1. Copy /templates/nextjs-saas/ to /home/user/project/
# 2. Run: cd /home/user/project && pnpm dev --hostname 0.0.0.0
