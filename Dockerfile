# build stage
FROM node:14.15.5

# 设置维护者
LABEL maintainer=naixes

# 在镜像内部创建工作目录
WORKDIR /app
# 拷贝文件，用到了ignore文件的配置
COPY . .
RUN npm install --registry=https://registry.npm.taobao.org
# 构建
RUN npm run build

EXPOSE 12005

VOLUME [ "/app/public" ]

CMD [ "node", "dist/server.bundle.js" ]