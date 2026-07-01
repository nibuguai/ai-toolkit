## ====== 阶段 1：Maven 编译 ======
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# 配置 Maven 国内镜像源
RUN mkdir -p /root/.m2
COPY settings.xml /root/.m2/settings.xml

# 先复制 pom 文件，利用 Docker 缓存加速依赖下载
COPY pom.xml .
COPY yudao-dependencies/pom.xml yudao-dependencies/
COPY yudao-framework/pom.xml yudao-framework/
COPY yudao-module-system/pom.xml yudao-module-system/
COPY yudao-module-infra/pom.xml yudao-module-infra/
COPY yudao-module-ai/pom.xml yudao-module-ai/
COPY yudao-server/pom.xml yudao-server/

# 下载依赖（这一层会被缓存，除非 pom 文件变化）
RUN mvn dependency:go-offline -B -pl yudao-server -am -DskipTests || true

# 复制源码并编译
COPY . .
RUN mvn clean package -pl yudao-server -am -DskipTests -Pboot -B

## ====== 阶段 2：运行 ======
FROM eclipse-temurin:21-jre

RUN mkdir -p /yudao-server
WORKDIR /yudao-server

COPY --from=builder /build/yudao-server/target/yudao-server.jar app.jar

ENV TZ=Asia/Shanghai
ENV JAVA_OPTS="-Xms512m -Xmx2048m -Djava.security.egd=file:/dev/./urandom"
ENV SPRING_PROFILES_ACTIVE=docker
ENV ARGS=""

EXPOSE 8180

CMD java  -jar app.jar 
