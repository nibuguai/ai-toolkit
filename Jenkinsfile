pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
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

        stage('Git Pull') {
            steps {
                dir("${env.PROJECT_DIR}") {
                    sh '''
                        git fetch origin master
                        git reset --hard origin/master
                    '''
                }
            }
        }

        stage('Detect Changes') {
            steps {
                script {
                    def changes = ''
                    def lastCommitFile = "${env.PROJECT_DIR}/.last-deployed-commit"

                    try {
                        // 读取上次部署的 commit
                        def lastCommit = sh(
                            script: "cat ${lastCommitFile} 2>/dev/null || echo ''",
                            returnStdout: true
                        ).trim()

                        if (lastCommit) {
                            changes = sh(
                                script: "cd ${env.PROJECT_DIR} && git diff --name-only ${lastCommit} HEAD",
                                returnStdout: true
                            ).trim()
                            echo "Comparing ${lastCommit}..HEAD"
                        } else {
                            // 首次部署，全量构建
                            changes = 'ALL'
                            echo 'First build, full deployment'
                        }
                    } catch (Exception e) {
                        changes = 'ALL'
                    }

                    if (changes == 'ALL') {
                        env.DEPLOY_ALL = 'true'
                        echo 'Full deployment triggered'
                    } else if (!changes) {
                        env.DEPLOY_ALL = 'false'
                        echo 'No changes since last deployment'
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
                        npm install --legacy-peer-deps
                        npm run build:prod
                    '''
                }
                dir("${env.PROJECT_DIR}") {
                    sh 'docker compose stop doc-nginx && docker compose up -d doc-nginx'
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
                        npm install --legacy-peer-deps
                        npm run build:h5
                    '''
                }
                dir("${env.PROJECT_DIR}") {
                    sh 'docker compose stop doc-nginx && docker compose up -d doc-nginx'
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
                    sh 'docker compose stop doc-nginx && docker compose up -d doc-nginx'
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
        success {
            echo '✅ Deployment succeeded!'
            // 构建成功后保存当前 commit，供下次对比
            sh "cd ${env.PROJECT_DIR} && git rev-parse HEAD > ${env.PROJECT_DIR}/.last-deployed-commit"
        }
        failure { echo '❌ Deployment failed!' }
    }
}
