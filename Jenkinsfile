pipeline {
    agent any

    options {
        skipDefaultCheckout()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout from GitHub') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                bat 'npm.cmd ci'
            }
        }

        stage('Run automated tests') {
            steps {
                bat 'npm.cmd test'
            }
        }

        stage('Build Docker image') {
            steps {
                bat 'docker build -t "store-ci:%BUILD_TAG%" .'
            }
        }

        stage('Check running container') {
            steps {
                powershell './docker-smoke.ps1 -Image "store-ci:$env:BUILD_TAG"'
            }
        }
    }
}