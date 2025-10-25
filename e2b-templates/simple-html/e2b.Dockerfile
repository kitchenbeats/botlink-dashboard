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

# Install Node.js development tools
RUN npm install -g \
    typescript \
    tsx \
    nodemon \
    dotenv-cli \
    http-server \
    pm2 \
    && npm cache clean --force

# Set NODE_PATH to allow require() to find globally installed packages
ENV NODE_PATH=/usr/local/lib/node_modules

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
