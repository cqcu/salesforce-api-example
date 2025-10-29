# syntax=docker/dockerfile:1.4

FROM 420588267024.dkr.ecr.us-east-1.amazonaws.com/workplace_base:latest as builder

ARG PACKAGE_PATH=salesforce-api-svc

COPY --link --chown=100:101 .npmrc package.json tsconfig.json pnpm-workspace.yaml ./
COPY --link --chown=100:101 ./apps/${PACKAGE_PATH} ./apps/${PACKAGE_PATH}

WORKDIR /workplace_mono/apps/${PACKAGE_PATH}
RUN pnpm install --quiet
RUN pnpm run build
RUN pnpm -w prune --production --no-optional

# create final image
FROM 420588267024.dkr.ecr.us-east-1.amazonaws.com/workplace_base:latest
ARG PACKAGE_PATH=salesforce-api-svc
ARG HTTP_PORT=8081
ENV PORT=${HTTP_PORT}
ARG HTTPS_PORT=8082
ARG METRICS_PORT=9115

WORKDIR /workplace_mono/apps/${PACKAGE_PATH}
COPY --from=builder /workplace_mono/apps/${PACKAGE_PATH} .
COPY --from=builder /workplace_mono/node_modules /workplace_mono/node_modules

RUN chmod +x docker-entrypoint.sh

EXPOSE ${HTTP_PORT} ${HTTPS_PORT}

USER workplace
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
