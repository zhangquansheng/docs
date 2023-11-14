# Docker 实战 

## Docker 简介

Docker 是一个开源的应用**容器引擎**，基于`Go`语言进行开发实现，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的`Linux`或`Windows`操作系统的机器上，
也可以实现**虚拟化**，容器是完全使用**沙箱机制**，相互之间不会有任何接口。

## 为什么要用 Docker

### 一致的运行环境

开发过程中一个常见的问题是环境一致性问题。由于开发环境、测试环境、生产环境不一致，导致有些`bug`并未在开发过程中被发现。而`Docker`的镜像提供了除内核外完整的运行时环境，确保了应用运行环境一致性，
从而不会再出现`这代码在我机器上没问题啊`，这类问题。

### 持续交付和部署

对开发和运维 (`DevOps`) 人员来说，最希望的就是一次创建或配置，可以在任意地方正常运行 使用`Docker`可以通过定制应用镜像来实现持续集成、持续交付、部署。开发人员可以通过`Dockerfile`来 进行镜像构建，
并结合持续集成(`Continuous Integration`) 系统进行集成测试，而运维人员则可以直接在生产环境中快速部署该镜像，甚至结合持续部署(`Continuous Delivery/Deployment`) 系统进行自动部署。
而且使用`Dockerfile`使镜像构建透明化，不仅仅开发团队可以理解应用运行环境，也方便运维团队理解 应用运行所需条件，帮助更好的生产环境中部署该镜像。

### 更高效的利用系统资源

由于容器不需要进行硬件虚拟以及运行完整操作系统等额外开销， `Docker`对系统资源的利用率更高。无 论是应用执行速度、内存损耗或者文件存储速度，都要比传统虚拟机技术更高效。因此，相比虚拟机技术，一个相同配置的主机，往往可以运行更多数量的应用。

## Docker 安装 

::: tip
- [CentOS Docker 安装](https://www.runoob.com/docker/centos-docker-install.html)
- [Linux命令大全(手册)](https://www.linuxcool.com/)
- [MobaXterm](https://mobaxterm.mobatek.net/) 一款强大好用的远程终端登录利器
  :::

### 使用官方安装脚本自动安装

安装命令如下（大概需要几分钟，耐心等待一下）：
```curl
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
```

启动 Docker。
```shell
systemctl start docker
```

## Docker 重要概念、基本操作

### Docker 镜像

镜像就是一个只读的模板，镜像可以用来创建`Docker`容器，一个镜像可以创建多个容器。

1. 构建`Dockerfile`

`Dockerfile` 是用来定义`Docker`镜像内容的文件，通常是`JSON`格式。其中包含了基础镜像、操作指令（`RUN`、`CMD`、`EXPOSE` 等）、环境变量、工作目录等。例如：
```
FROM ubuntu:18.04
RUN apt-get update && apt-get install -y python3
CMD ["python3", "app.py"]
EXPOSE 8080
```

2. 构建`Docker`镜像

使用`docker build`命令构建`Docker`镜像，例如：

```shell
docker build -t my-image
```

3. 运行`Docker`镜像

使用 `docker run` 命令运行`Docker`镜像，例如：

```shell
docker run -p 8080:80 my-image
```

### Docker 容器

容器是用镜像创建的运行实例，`Docker`利用容器独立运行一个或一组应用。它可以被启动、开始、停止、删除，每个容器都是相互隔离的、保证安全的平台。
可以把容器看作是一个简易的 Linux 环境和运行在其中的应用程序。容器的定义和镜像几乎一模一样，也是一堆层的统一视角，唯一区别在于容器的最上面那一层是可读可写的。

1. 创建 Docker 容器

使用 `docker create` 命令创建`Docker`容器，例如：
```shell
docker create -it my-container my-image
```

2. 启动 Docker 容器

使用 `docker start` 命令启动已创建的`Docker`容器，例如：
```shell
docker start my-container
```

3. 进入 Docker 容器内部操作

使用 `docker exec` 命令进入`Docker`容器内部操作，例如：
```shell
docker exec -it my-container /bin/bash  #进入容器内部，并启动bash终端（-it`选项允许交互式会话）`bash`命令启动bash shell。`my-container`是容器的名称或ID。现在你可以在bash shell中运行任何命令。`exit`退出shell。现在你已经退出了容器。你可以用`docker ps`查看当前运行的容器列表。看到你的容器已经停止运行（状态为Exited）。
