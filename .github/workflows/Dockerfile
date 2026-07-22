# 1. 使用 Nginx 镜像作为基础
FROM nginx:alpine

# 2. 将打包后的 dist 目录复制到 Nginx 的静态资源目录
COPY dist/ /usr/share/nginx/html/

# 3. 复制自定义 nginx 配置（解决单页面应用路由 404 问题）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]