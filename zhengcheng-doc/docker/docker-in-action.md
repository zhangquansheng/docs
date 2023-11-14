# Docker 实战指南
=========

本篇文档将介绍 Docker 的基本概念、镜像、容器、数据卷和网络等实战内容，并提供了实际操作示例，帮助大家更好地理解和应用 Docker。

## 一、Docker 简介
--------

Docker 是一种开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。

## 二、Docker 镜像
--------

Docker 镜像是 Docker 容器运行时的只读模板，可以理解为 Docker 容器之母。在 Docker 镜像中，可以进行环境变量的设置、启动命令的设置、暴露端口号、映射本地目录等等操作。

### 1. 构建 Dockerfile

Dockerfile 是用来定义 Docker 镜像内容的文件，通常是 JSON 格式。其中包含了基础镜像、操作指令（RUN、CMD、EXPOSE 等）、环境变量、工作目录等。例如：

```
FROM ubuntu:18.04
RUN apt-get update && apt-get install -y python3
CMD ["python3", "app.py"]
EXPOSE 8080
```

### 2. 构建 Docker镜像

使用 `docker build` 命令构建 Docker 镜像，例如：

```shell
docker build -t my-image .
```

### 3. 运行 Docker 镜像

使用 `docker run` 命令运行 Docker 镜像，例如：

```shell
docker run -p 8080:80 my-image
```

三、Docker 容器
--------

Docker 容器是 Docker 镜像运行时的实例，类似于虚拟机。每个容器都有自己的文件系统、独立的网络配置、进程空间等。在容器中运行的应用程序会受到沙箱机制的保护，彼此之间不会产生任何接口。

### 1. 创建 Docker 容器

使用 `docker create` 命令创建 Docker 容器，例如：

```shell
docker create -it my-container my-image
```

### 2. 启动 Docker 容器

使用 `docker start` 命令启动已创建的 Docker 容器，例如：

```shell
docker start my-container
```

### 3. 进入 Docker 容器内部操作

使用 `docker exec` 命令进入 Docker 容器内部操作，例如：

```shell
docker exec -it my-container /bin/bash  #进入容器内部，并启动bash终端（-it`选项允许交互式会话）`bash`命令启动bash shell。`my-container`是容器的名称或ID。现在你可以在bash shell中运行任何命令。`exit`退出shell。现在你已经退出了容器。你可以用`docker ps`查看当前运行的容器列表。看到你的容器已经停止运行（状态为Exited）。
