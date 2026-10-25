# nerve-sonography.org is static: nginx serves site/ as a non-root user. Coolify
# builds it from main with the Dockerfile build pack and routes to port 8080.
# Tags are pinned by digest so a rebuild starts from the same bases.

# Fails the build when an inline script isn't in the CSP; nothing from it ships.
FROM node:24.22.1-trixie-slim@sha256:43b9ba1142b8dcf33fa8f922ca1be85714adc444e0586c7cf7726daaeabc1bea AS csp
WORKDIR /app
COPY csp-check.mjs nginx.conf ./
COPY site/ site/
RUN node csp-check.mjs && touch checked

# The unprivileged image runs nginx as uid 101 on port 8080. The files are
# root's and only readable to it.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
# BuildKit skips a stage nothing copies from, so this marker makes the check run.
COPY --from=csp /app/checked /tmp/csp-checked
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
