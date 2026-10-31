FROM node:24.22.1-bookworm-slim
ENV NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npx playwright install --with-deps chromium && chmod -R a+rX /ms-playwright
COPY *.js *.cjs manifest.webmanifest icon-192.png icon-512.png season-*.png index.html calm.css logo-espe-miguel.jpg supabase-public.json ./
USER node
ENV PLANES_REQUIRE_AUTH=1 PORT=10000 NODE_OPTIONS=--max-old-space-size=192
EXPOSE 10000
CMD ["node", "server.cjs"]
