pipeline {
    agent any

    environment {
        // 项目路径（Jenkins 容器内挂载路径）
        PROJECT_DIR = '/var/jenkins_home/workspace/ai-toolkit'
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Detect Changes') {
            steps {
                script {
                    def changes = ''
                    try {
                        changes = sh(script: "git diff --name-only HEAD~1 HEAD", returnStdout: true).trim()
                    } catch (Exception e) {
                        changes = 'ALL'
                    }

                    if (changes == 'ALL') {
                        env.DEPLOY_ALL = 'true'
                        echo 'Full deployment triggered'
                    } else {
                        echo "Changed files:\n${changes}"

                        env.CHANGE_JAVA    = changes.contains('backend-java/')                    ? 'true' : 'false'
                        env.CHANGE_PYTHON  = changes.contains('backend-python/')                  ? 'true' : 'false'
                        env.CHANGE_ADMIN   = changes.contains('frontend/yudao-ui-admin-vue3/')    ? 'true' : 'false'
                        env.CHANGE_MOBILE  = changes.contains('frontend/yudao-ui-admin-uniapp/')  ? 'true' : 'false'
                        env.CHANGE_NGINX   = changes.contains('nginx/')                           ? 'true' : 'false'
                        env.CHANGE_COMPOSE = changes.contains('docker-compose.yml')               ? 'true' : 'false'

                        echo """
                        |=== Change Summary ===
                        |Backend Java:    ${env.CHANGE_JAVA}
                        |Backend Python:  ${env.CHANGE_PYTHON}
                        |Frontend Admin:  ${env.CHANGE_ADMIN}
                        |Frontend Mobile: ${env.CHANGE_MOBILE}
                        |Nginx:           ${env.CHANGE_NGINX}
                        |Docker Compose:  ${env.CHANGE_COMPOSE}
                        |========================
                        """.stripMargin()
                    }
                }
            }
        }

        stage('Git Pull') {
            steps {
                dir("${env.PROJECT_DIR}") {
                    sh 'git pull origin master'
                }
            }
        }

        stage('Deploy Spring Boot') {
            when {
                expression {
                    return env.DEPLOY_ALL == 'true' ||
                           env.CHANGE_JAVA == 'true' ||
                           env.CHANGE_COMPOSE == 'true'
                }
            }
            steps {
                echo 'Building & deploying Spring Boot...'
                dir("${env.PROJECT_DIR}") {
                    sh '''
                        docker compose build doc-springboot
                        docker compose up -d doc-springboot
                        echo "Spring Boot deployed"
                    '''
                }
            }
        }

        stage('Deploy FastAPI') {
            when {
                expression {
                    return env.DEPLOY_ALL == 'true' ||
                           env.CHANGE_PYTHON == 'true' ||
                           env.CHANGE_COMPOSE == 'true'
                }
            }
            steps {
                echo 'Building & deploying FastAPI...'
                dir("${env.PROJECT_DIR}") {
                    sh '''
                        docker compose build doc-fastapi-vision
                        docker compose up -d doc-fastapi-vision
                        echo "FastAPI deployed"
                    '''
                }
            }
        }

        stage('Deploy Admin Frontend') {
            when {
                expression {
                    return env.DEPLOY_ALL == 'true' ||
                           env.CHANGE_ADMIN == 'true' ||
                           env.CHANGE_NGINX == 'true'
                }
            }
            steps {
                echo 'Building & deploying admin frontend...'
                dir("${env.PROJECT_DIR}/frontend/yudao-ui-admin-vue3") {
                    sh '''
                        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
                        pnpm build
                    '''
                }
                dir("${env.PROJECT_DIR}") {
                    sh 'docker compose restart doc-nginx'
                }
            }
        }

        stage('Deploy Mobile Frontend') {
            when {
                expression {
                    return env.DEPLOY_ALL == 'true' ||
                           env.CHANGE_MOBILE == 'true' ||
                           env.CHANGE_NGINX == 'true'
                }
            }
            steps {
                echo 'Building & deploying mobile frontend...'
                dir("${env.PROJECT_DIR}/frontend/yudao-ui-admin-uniapp") {
                    sh '''
                        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
                        pnpm build:h5
                    '''
                }
                dir("${env.PROJECT_DIR}") {
                    sh 'docker compose restart doc-nginx'
                }
            }
        }

        stage('Reload Nginx') {
            when {
                expression {
                    return (env.CHANGE_NGINX == 'true' || env.CHANGE_COMPOSE == 'true') &&
                           env.CHANGE_ADMIN != 'true' &&
                           env.CHANGE_MOBILE != 'true'
                }
            }
            steps {
                echo 'Reloading nginx...'
                dir("${env.PROJECT_DIR}") {
                    sh 'docker compose restart doc-nginx'
                }
            }
        }

        stage('Health Check') {
            steps {
                sleep(time: 10, unit: 'SECONDS')
                dir("${env.PROJECT_DIR}") {
                    sh "docker compose ps --format 'table {{.Name}}\t{{.Status}}'"
                }
            }
        }
    }

    post {
        success { echo '✅ Deployment succeeded!' }
        failure { echo '❌ Deployment failed!' }
    }
}
