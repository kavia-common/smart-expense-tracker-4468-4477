# syntax=docker/dockerfile:1

# Use official lightweight Postgres image
FROM postgres:15-alpine

# Set default environment variables (overridable via .env or deployment env)
ENV POSTGRES_DB=expenses \
    POSTGRES_USER=expenses_user \
    POSTGRES_PASSWORD=secure_password \
    POSTGRES_PORT=5432

# Copy initialization scripts
# Any .sql or .sh in this directory will be executed on first container start
COPY init/ /docker-entrypoint-initdb.d/

# Expose the Postgres port (informational)
EXPOSE 5432

# Healthcheck to ensure DB is accepting connections
HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1
