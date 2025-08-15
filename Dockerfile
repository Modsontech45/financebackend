# ============= Base image =============
FROM node:22-alpine AS base

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock & config files
COPY  pnpm-lock.yaml package.json ./

# Set default NODE_ENV (can be overridden)
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# ============= Dependencies stage =============
FROM base AS deps
RUN if [ "$NODE_ENV" = "production" ]; then \
    pnpm install --frozen-lockfile --prod; \
    else \
    pnpm install --frozen-lockfile; \
    fi

# ============= Build stage (for prod only) =============
FROM deps AS build
COPY . .
RUN if [ "$NODE_ENV" = "production" ]; then \
    pnpm run build; \
    fi

# ============= Production image =============
FROM node:22-alpine AS prod
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production

COPY --from=build /app ./
RUN mkdir -p uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["pnpm", "start"]

# ============= Development image =============
FROM node:22-alpine AS dev
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=development

# Fix: Set PNPM_HOME and add it to PATH
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Copy lock & config files
COPY pnpm-lock.yaml package.json ./

# Install all deps
RUN pnpm install --frozen-lockfile

# Install nodemon globally
RUN pnpm add -g nodemon

# Copy source code
COPY . .

EXPOSE 3000

CMD ["nodemon", "--watch", "src", "src/index.ts"]
