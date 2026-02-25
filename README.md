This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker Caddy 反向代理（局域网访问）

如果您已经在局域网 DNS（如 `dnsmasq`）把 `*.macmini.home` 指到本机，可用以下命令快速起一个 Caddy 代理容器：

```bash
# 启动（默认监听 18080，反向代理到 host.docker.internal:3000）
npm run proxy:up

# 停止
npm run proxy:down

# 状态
npm run proxy:status

# 日志
npm run proxy:logs
```

也可以按需覆盖变量：

```bash
LISTEN_PORT=80 \
UPSTREAM_HOST=host.docker.internal \
UPSTREAM_PORT=4792 \
SERVER_NAME=*.macmini.home \
npm run proxy:up
```

默认配置文件模板在 `docker/caddy-proxy/Caddyfile.template`，启动脚本在 `scripts/caddy-proxy.sh`。
