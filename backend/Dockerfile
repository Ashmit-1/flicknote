# ---------- Stage 1: builder -- install production dependencies ----------
FROM ghcr.io/astral-sh/uv:0.9.30-python3.12-bookworm-slim AS builder

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

# Install dependencies first so Docker layer caching is effective.
# --frozen: use uv.lock as-is (reproducible builds).
# --no-group dev: skip the dev dependency group (httpx2).
# --no-install-project: only install dependencies, not the project itself.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-group dev --no-install-project

# ---------- Stage 2: runtime ----------
FROM ghcr.io/astral-sh/uv:0.9.30-python3.12-bookworm-slim

WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH" \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

# Copy the virtual environment built in stage 1 and the application source.
COPY --from=builder /app/.venv /app/.venv
COPY app ./app

EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
