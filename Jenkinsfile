pipeline {
    agent any

    environment {
        AWS_REGION       = 'ap-south-1'
        ECR_REGISTRY     = '158160601848.dkr.ecr.ap-south-1.amazonaws.com'
        BACKEND_REPO     = 'backend'
        FRONTEND_REPO    = 'frontend'
        CLUSTER_NAME     = 'private-3tier-cluster'
        BACKEND_SERVICE  = 'backend-service'
        FRONTEND_SERVICE = 'frontend-service'
        BACKEND_TD       = 'backend-task'
        FRONTEND_TD      = 'frontend-task'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecs-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh '''
                        aws ecr get-login-password --region $AWS_REGION | \
                        docker login --username AWS --password-stdin $ECR_REGISTRY
                    '''
                }
            }
        }

        stage('Build & Push Backend') {
            steps {
                sh '''
                    docker build -t $ECR_REGISTRY/$BACKEND_REPO:$BUILD_NUMBER ./backend
                    docker push $ECR_REGISTRY/$BACKEND_REPO:$BUILD_NUMBER
                    docker tag $ECR_REGISTRY/$BACKEND_REPO:$BUILD_NUMBER $ECR_REGISTRY/$BACKEND_REPO:latest
                    docker push $ECR_REGISTRY/$BACKEND_REPO:latest
                '''
            }
        }

        stage('Build & Push Frontend') {
            steps {
                sh '''
                    docker build -t $ECR_REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER ./frontend
                    docker push $ECR_REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER
                    docker tag $ECR_REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER $ECR_REGISTRY/$FRONTEND_REPO:latest
                    docker push $ECR_REGISTRY/$FRONTEND_REPO:latest
                '''
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-ecs-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh '''
                        # ===== BACKEND =====
                        echo "Updating Backend Task Definition..."
                        TASK_DEF=$(aws ecs describe-task-definition \
                            --task-definition $BACKEND_TD \
                            --region $AWS_REGION)

                        NEW_BACKEND_TD=$(echo $TASK_DEF | jq --arg IMAGE "$ECR_REGISTRY/$BACKEND_REPO:latest" \
                            '.taskDefinition | .containerDefinitions[0].image = $IMAGE | 
                             del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

                        NEW_BACKEND_ARN=$(aws ecs register-task-definition \
                            --region $AWS_REGION \
                            --cli-input-json "$NEW_BACKEND_TD" \
                            --query 'taskDefinition.taskDefinitionArn' \
                            --output text)

                        echo "New Backend Task Definition: $NEW_BACKEND_ARN"

                        aws ecs update-service \
                            --cluster $CLUSTER_NAME \
                            --service $BACKEND_SERVICE \
                            --task-definition $NEW_BACKEND_ARN \
                            --force-new-deployment \
                            --region $AWS_REGION

                        # ===== FRONTEND =====
                        echo "Updating Frontend Task Definition..."
                        TASK_DEF=$(aws ecs describe-task-definition \
                            --task-definition $FRONTEND_TD \
                            --region $AWS_REGION)

                        NEW_FRONTEND_TD=$(echo $TASK_DEF | jq --arg IMAGE "$ECR_REGISTRY/$FRONTEND_REPO:latest" \
                            '.taskDefinition | .containerDefinitions[0].image = $IMAGE | 
                             del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

                        NEW_FRONTEND_ARN=$(aws ecs register-task-definition \
                            --region $AWS_REGION \
                            --cli-input-json "$NEW_FRONTEND_TD" \
                            --query 'taskDefinition.taskDefinitionArn' \
                            --output text)

                        echo "New Frontend Task Definition: $NEW_FRONTEND_ARN"

                        aws ecs update-service \
                            --cluster $CLUSTER_NAME \
                            --service $FRONTEND_SERVICE \
                            --task-definition $NEW_FRONTEND_ARN \
                            --force-new-deployment \
                            --region $AWS_REGION
                    '''
                }
            }
        }
    }
}