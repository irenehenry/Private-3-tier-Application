pipeline {
    agent any

    environment {
        AWS_REGION     = 'ap-south-1'
        ECR_REGISTRY   = '158160601848.dkr.ecr.ap-south-1.amazonaws.com'
        BACKEND_REPO   = 'backend'
        FRONTEND_REPO  = 'frontend'
        CLUSTER_NAME   = 'private-3tier-cluster'
        BACKEND_SERVICE  = 'backend-service'
        FRONTEND_SERVICE = 'frontend-service'
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
                aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
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
                aws ecs update-service \
                    --cluster $CLUSTER_NAME \
                    --service $BACKEND_SERVICE \
                    --force-new-deployment \
                    --region $AWS_REGION

                aws ecs update-service \
                    --cluster $CLUSTER_NAME \
                    --service $FRONTEND_SERVICE \
                    --force-new-deployment \
                    --region $AWS_REGION
            '''
        }
    }
}
}
}
