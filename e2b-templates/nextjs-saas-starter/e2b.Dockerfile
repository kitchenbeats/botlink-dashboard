# ReactWrite Next.js SaaS Starter Template
# Pre-installed with Vercel's Next.js SaaS Starter (https://github.com/nextjs/saas-starter)

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

# Install Claude Code CLI, PM2 process manager, and global packages
RUN npm install -g \
    pnpm \
    pm2 \
    @anthropic-ai/claude-code \
    @anthropic-ai/sdk \
    openai \
    @google/generative-ai \
    typescript \
    tsx \
    nodemon \
    dotenv-cli \
    && npm cache clean --force

# Clone and install SaaS starter in one layer
WORKDIR /templates/nextjs-saas
RUN git clone --depth 1 https://github.com/nextjs/saas-starter.git . \
    && rm -rf .git \
    && pnpm install \
    && pnpm store prune

# Create a default .env.local with local PostgreSQL connection
RUN echo 'POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/saas' > .env.local && \
    echo 'AUTH_SECRET=development-secret-key-change-in-production-min-32-chars' >> .env.local && \
    echo '# Add your own environment variables above this line' >> .env.local

# Copy config files from local configs directory
# Create configs directory and copy PM2 configs
RUN mkdir -p /templates/nextjs-saas/configs
COPY configs/ecosystem.config.js /templates/nextjs-saas/configs/ecosystem.config.js
COPY configs/claude-pty-manager.js /templates/nextjs-saas/configs/claude-pty-manager.js
COPY configs/claude-setup-pty.js /templates/nextjs-saas/configs/claude-setup-pty.js
COPY configs/claude-chat.js /templates/nextjs-saas/configs/claude-chat.js
COPY configs/init-saas-db.sh /usr/local/bin/init-saas-db.sh
RUN chmod +x /usr/local/bin/init-saas-db.sh

# Update next.config to add allowedDevOrigins (saas-starter uses next.config.ts)
RUN if [ -f next.config.ts ]; then \
      sed -i 's/const nextConfig: NextConfig = {/const nextConfig: NextConfig = {\n  experimental: {\n    allowedDevOrigins: ['"'"'*.ledgai.com'"'"'],\n  },/' next.config.ts; \
    elif [ -f next.config.js ]; then \
      sed -i 's/const nextConfig = {/const nextConfig = {\n  experimental: {\n    allowedDevOrigins: ['"'"'*.ledgai.com'"'"'],\n  },/' next.config.js; \
    elif [ -f next.config.mjs ]; then \
      sed -i 's/const nextConfig = {/const nextConfig = {\n  experimental: {\n    allowedDevOrigins: ['"'"'*.ledgai.com'"'"'],\n  },/' next.config.mjs; \
    fi

# Initialize git repository with initial commit
# We removed .git during clone, so always init fresh
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
    echo 'alias g="git"' >> /root/.bashrc

# Create Claude config directory in project with settings (v2025-10-20)
RUN mkdir -p /templates/nextjs-saas/.claude && \
    echo '{"theme":"dark","permissionMode":"auto"}' > /templates/nextjs-saas/.claude/settings.json

# Note: To auto-start dev server in workspace, ReactWrite will need to:
# 1. Copy /templates/nextjs-saas/ to /home/user/project/
# 2. Run: cd /home/user/project && pnpm dev --hostname 0.0.0.0
