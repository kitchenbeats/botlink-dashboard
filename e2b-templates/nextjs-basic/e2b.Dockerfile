# ReactWrite Next.js Basic Template
# Pre-installed with create-next-app (TypeScript + Tailwind + App Router)

# Use lightweight Node.js base for minimal image size
FROM node:24-slim

# Install all system tools
RUN apt-get update && apt-get install -y \
    git \
    vim \
    nano \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI, PM2 process manager, and global npm packages
RUN npm install -g \
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

# Create Next.js app in one layer (create-next-app already runs npm install)
WORKDIR /templates/nextjs-basic
RUN npx create-next-app@latest . \
    --typescript \
    --tailwind \
    --app \
    --no-src-dir \
    --import-alias "@/*" \
    --eslint \
    --no-git \
    --yes \
    && npm cache clean --force

# Copy config files from local configs directory
COPY configs/next.config.mjs /templates/nextjs-basic/next.config.mjs

# Create configs directory and copy PM2 configs
RUN mkdir -p /templates/nextjs-basic/configs
COPY configs/ecosystem.config.js /templates/nextjs-basic/configs/ecosystem.config.js
COPY configs/claude-pty-manager.js /templates/nextjs-basic/configs/claude-pty-manager.js
COPY configs/claude-setup-pty.js /templates/nextjs-basic/configs/claude-setup-pty.js
COPY configs/claude-chat.js /templates/nextjs-basic/configs/claude-chat.js

# Initialize git repository with initial commit
# create-next-app may already init git, so check first
RUN git config --global user.email "bot@reactwrite.com" && \
    git config --global user.name "ReactWrite Bot" && \
    (git rev-parse --git-dir 2>/dev/null || git init) && \
    git add . && \
    (git diff --cached --quiet || git commit -m "Initial template commit")

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
RUN mkdir -p /templates/nextjs-basic/.claude && \
    echo '{"theme":"dark","permissionMode":"auto"}' > /templates/nextjs-basic/.claude/settings.json

# Note: To auto-start dev server in workspace, ReactWrite will need to:
# 1. Copy /templates/nextjs-basic/ to /home/user/project/
# 2. Run: cd /home/user/project && npm run dev -- --hostname 0.0.0.0
