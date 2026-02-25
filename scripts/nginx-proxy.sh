#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-keepfit-nginx-proxy}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:1.27-alpine}"
LISTEN_PORT="${LISTEN_PORT:-8080}"
UPSTREAM_HOST="${UPSTREAM_HOST:-host.docker.internal}"
UPSTREAM_PORT="${UPSTREAM_PORT:-3000}"
SERVER_NAME="${SERVER_NAME:-*.macmini.home}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_PATH="${TEMPLATE_PATH:-${SCRIPT_DIR}/../docker/nginx-proxy/nginx.conf.template}"
RUNTIME_DIR="${RUNTIME_DIR:-/tmp/${CONTAINER_NAME}}"
CONF_PATH="${RUNTIME_DIR}/default.conf"

usage() {
    cat <<'EOF'
用法:
  scripts/nginx-proxy.sh start     启动代理容器
  scripts/nginx-proxy.sh stop      停止并删除代理容器
  scripts/nginx-proxy.sh restart   重启代理容器
  scripts/nginx-proxy.sh logs      查看代理日志
  scripts/nginx-proxy.sh status    查看代理状态

可用环境变量:
  CONTAINER_NAME   容器名 (默认: keepfit-nginx-proxy)
  NGINX_IMAGE      镜像名 (默认: nginx:1.27-alpine)
  LISTEN_PORT      映射到宿主机端口 (默认: 8080)
  SERVER_NAME      Nginx server_name (默认: *.macmini.home)
  UPSTREAM_HOST    反向代理目标主机 (默认: host.docker.internal)
  UPSTREAM_PORT    反向代理目标端口 (默认: 3000)
EOF
}

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "缺少命令: $1" >&2
        exit 1
    fi
}

require_docker_daemon() {
    if ! docker info >/dev/null 2>&1; then
        echo "Docker 守护进程未运行，请先启动 Docker Desktop/OrbStack。" >&2
        exit 1
    fi
}

render_config() {
    mkdir -p "$RUNTIME_DIR"
    awk \
        -v server_name="$SERVER_NAME" \
        -v upstream_host="$UPSTREAM_HOST" \
        -v upstream_port="$UPSTREAM_PORT" \
        '{
            gsub(/\$\{SERVER_NAME\}/, server_name);
            gsub(/\$\{UPSTREAM_HOST\}/, upstream_host);
            gsub(/\$\{UPSTREAM_PORT\}/, upstream_port);
            print;
        }' \
        "$TEMPLATE_PATH" > "$CONF_PATH"
}

container_exists() {
    docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"
}

start_proxy() {
    require_cmd docker
    require_docker_daemon

    if [[ ! -f "$TEMPLATE_PATH" ]]; then
        echo "未找到模板文件: $TEMPLATE_PATH" >&2
        exit 1
    fi

    render_config

    if container_exists; then
        docker rm -f "$CONTAINER_NAME" >/dev/null
    fi

    local -a extra_args=()
    if [[ "$(uname -s)" == "Linux" ]]; then
        extra_args+=(--add-host=host.docker.internal:host-gateway)
    fi

    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p "${LISTEN_PORT}:80" \
        -v "${CONF_PATH}:/etc/nginx/conf.d/default.conf:ro" \
        "${extra_args[@]}" \
        "$NGINX_IMAGE" >/dev/null

    echo "代理已启动: http://localhost:${LISTEN_PORT}"
    echo "server_name=${SERVER_NAME}"
    echo "upstream=http://${UPSTREAM_HOST}:${UPSTREAM_PORT}"
}

stop_proxy() {
    require_cmd docker
    require_docker_daemon

    if container_exists; then
        docker rm -f "$CONTAINER_NAME" >/dev/null
        echo "代理已停止并删除容器: ${CONTAINER_NAME}"
    else
        echo "未找到容器: ${CONTAINER_NAME}"
    fi
}

logs_proxy() {
    require_cmd docker
    require_docker_daemon
    docker logs -f "$CONTAINER_NAME"
}

status_proxy() {
    require_cmd docker
    require_docker_daemon
    docker ps --filter "name=^/${CONTAINER_NAME}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
}

main() {
    local action="${1:-}"
    case "$action" in
        start) start_proxy ;;
        stop) stop_proxy ;;
        restart)
            stop_proxy
            start_proxy
            ;;
        logs) logs_proxy ;;
        status) status_proxy ;;
        *)
            usage
            exit 1
            ;;
    esac
}

main "$@"
