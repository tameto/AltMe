FROM ghcr.io/openclaw/openclaw:latest

# SOUL.md is injected via environment variable at runtime
# The entrypoint script writes SOUL_MD env to /app/SOUL.md before starting
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV OPENCLAW_HOST=0.0.0.0
ENV OPENCLAW_PORT=18789

EXPOSE 18789

ENTRYPOINT ["/entrypoint.sh"]
