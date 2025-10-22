# ReactWrite Simple HTML Site Template
# Pre-installed with a clean HTML/CSS/JS starter using Tailwind CSS

# Use lightweight Node.js base for minimal image size
FROM node:24-slim

# Install all tools in one layer to reduce size
RUN apt-get update && apt-get install -y \
    git \
    vim \
    nano \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI and Node.js development tools
RUN npm install -g \
    @anthropic-ai/claude-code \
    @anthropic-ai/sdk \
    openai \
    @google/generative-ai \
    typescript \
    tsx \
    nodemon \
    dotenv-cli \
    http-server \
    pm2 \
    ioredis \
    && npm cache clean --force

# Create simple HTML starter template
WORKDIR /templates/simple-html

# Copy template files from template-files directory
COPY template-files/index.html .
COPY template-files/style.css .
COPY template-files/script.js .
COPY template-files/README.md .

# Copy PM2 configuration and PTY manager
COPY configs/ ./configs/

# Initialize git repository with initial commit
RUN git config --global user.email "bot@reactwrite.com" && \
    git config --global user.name "ReactWrite Bot" && \
    git init && \
    git add . && \
    git commit -m "Initial template commit"

# Fix permissions - allow all users to write to templates directory
RUN chmod -R 777 /templates

# Set working directory
WORKDIR /home/user

# Set environment variables
ENV TERM=xterm-256color
ENV NODE_ENV=development

# Add helpful aliases
RUN echo 'alias ll="ls -lah"' >> /root/.bashrc && \
    echo 'alias g="git"' >> /root/.bashrc

# Create Claude config directory in project with settings (v2025-10-20)
RUN mkdir -p /templates/simple-html/.claude && \
    echo '{"theme":"dark","permissionMode":"auto"}' > /templates/simple-html/.claude/settings.json
