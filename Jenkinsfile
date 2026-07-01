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
                        env.CHANGE_NGINX   = changes.contains('nginx/')                           ? 'true' : 'false'
                        env.CHANGE_COMPOSE = changes.contains('docker-compose.yml')               ? 'true' : 'false'

                        // 前端变更只记录日志，不自动构建（需要在 Windows 上用 pnpm 手动构建）
                        def frontendChanged = changes.contains('frontend/yudao-ui-admin-vue3/') ||
                                              changes.contains('frontend/yudao-ui-admin-uniapp/')
                        if (frontendChanged) {
                            echo '⚠️ Frontend changes detected - run deploy.bat on Windows to rebuild'
                        }

                        echo """
                        |=== Change Summary ===
                        |Backend Java:    ${env.CHANGE_JAVA}
                        |Backend Python:  ${env.CHANGE_PYTHON}
                        |Nginx:           ${env.CHANGE_NGINX}
                        |Docker Compose:  ${env.CHANGE_COMPOSE}
                        |Frontend:        ${frontendChanged ? 'NEEDS MANUAL BUILD' : 'no change'}
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
                    '''
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
            echo '''
            ✅ Backend deployment succeeded!
            ⚠️ If frontend was changed, run deploy.bat on Windows to rebuild.
            '''
            sh "cd ${env.PROJECT_DIR} && git rev-parse HEAD > ${env.PROJECT_DIR}/.last-deployed-commit"
        }
        failure { echo '❌ Deployment failed!' }
    }
}
