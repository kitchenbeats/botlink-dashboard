# BotLink AI Coding Agent Template
# Multi-provider AI coding environment with support for all major AI providers

# Use E2B's code-interpreter base image which includes Python, Jupyter, and snapshot support
FROM e2bdev/code-interpreter:latest

# Install Node.js 24.x
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install common development tools
RUN apt-get update && apt-get install -y \
    git \
    vim \
    nano \
    build-essential \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI, AI Provider CLIs and SDKs
RUN npm install -g \
    @anthropic-ai/claude-code \
    @anthropic-ai/sdk \
    openai \
    @google/generative-ai \
    @mistralai/mistralai \
    typescript \
    tsx \
    create-next-app \
    vite \
    nodemon \
    dotenv-cli \
    && npm cache clean --force

# Install Python AI/ML libraries and development tools
RUN pip install --no-cache-dir \
    anthropic \
    openai \
    google-generativeai \
    mistralai \
    requests \
    python-dotenv \
    pytest \
    httpx

# Set working directory
WORKDIR /home/user

# Set environment variables for better terminal experience
ENV TERM=xterm-256color
ENV NODE_ENV=development

# Add helpful aliases
RUN echo 'alias ll="ls -lah"' >> /root/.bashrc && \
    echo 'alias g="git"' >> /root/.bashrc
