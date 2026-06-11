# ─── Base ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─── Development ──────────────────────────────────────────────────────────────
FROM base AS dev

COPY package.json package-lock.json* ./
RUN npm ci && \
    npm install \
      clsx \
      class-variance-authority \
      tailwindcss-animate \
      lucide-react && \
    npm install --save-dev \
      jest \
      jest-environment-jsdom \
      @testing-library/react \
      @testing-library/jest-dom \
      @testing-library/user-event \
      @types/jest

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
# Use shell entrypoint for dev server startup (shadcn init + npm run dev)
# CMD here means `docker compose run frontend npx jest` cleanly overrides it
# without having to fight an ENTRYPOINT — correct pattern for CI compatibility
ENTRYPOINT ["/entrypoint.sh"]
CMD []

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM base AS builder

COPY package.json package-lock.json* ./
RUN npm ci && \
    npm install \
      clsx \
      class-variance-authority \
      tailwindcss-animate \
      lucide-react

COPY . .

RUN npx shadcn@latest init --defaults -y && \
    npx shadcn@latest add --yes \
      button input label select badge dialog table \
      dropdown-menu avatar separator tooltip alert card

RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
