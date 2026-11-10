pipeline {
  agent any
  options { skipDefaultCheckout(true); disableConcurrentBuilds(); timestamps(); buildDiscarder(logRotator(numToKeepStr: '10')) }
  parameters {
    string(name: 'LOCAL_SOURCE', defaultValue: '', description: 'Leave empty for Git SCM. Local learning job may use the existing project folder.')
    booleanParam(name: 'RUN_DOCKER', defaultValue: true, description: 'Build and run the container. False explicitly runs application checks only.')
    booleanParam(name: 'PUBLISH_IMAGE', defaultValue: false, description: 'Push image to your public Docker Hub repository; needs dockerhub credentials.')
    string(name: 'DOCKERHUB_USER', defaultValue: '', description: 'Docker Hub username or namespace; needed for publishing.')
    booleanParam(name: 'DEPLOY_LOCAL_K8S', defaultValue: false, description: 'Deploy staging then approved production to local Kubernetes. Requires publishing.')
    choice(name: 'KUBE_CONTEXT', choices: ['docker-desktop', 'minikube'], description: 'Local Kubernetes cluster only.')
  }
  environment { PATH = "${env.SystemRoot}\\System32;${env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0;${env.PATH}"; APP_NAME = 'voltcart'; STAGING_PORT = '5202'; CI = 'true' }
  stages {
    stage('Checkout') {
      steps {
        script {
          if (params.LOCAL_SOURCE.trim()) {
            powershell '''
              $ErrorActionPreference='Stop'
              $source=(Resolve-Path -LiteralPath $env:LOCAL_SOURCE).Path
              if ($source -eq $env:WORKSPACE) { throw 'Local source must differ from Jenkins workspace.' }
              & robocopy $source $env:WORKSPACE /E /XD node_modules dist coverage data .git .docker-auth chromedriver chrome selenium /XF *.log .env .env.*
              if ($LASTEXITCODE -gt 7) { throw 'Source copy failed.' }
              exit 0
            '''
          } else { checkout scm }
          if (params.DEPLOY_LOCAL_K8S && (!params.RUN_DOCKER || !params.PUBLISH_IMAGE)) { error('Local Kubernetes requires RUN_DOCKER and PUBLISH_IMAGE.') }
          if (params.PUBLISH_IMAGE && (!params.RUN_DOCKER || !params.DOCKERHUB_USER.trim())) { error('Publishing requires Docker and a Docker Hub username.') }
          env.IMAGE_TAG = params.PUBLISH_IMAGE ? "${params.DOCKERHUB_USER}/${env.APP_NAME}:jenkins-${env.BUILD_NUMBER}" : "${env.APP_NAME}:jenkins-${env.BUILD_NUMBER}"
          currentBuild.description = params.RUN_DOCKER ? 'Application + Docker pipeline' : 'Application checks only - Docker not executed'
        }
      }
    }
    stage('Check tools') { steps { powershell './ops/jenkins.ps1 -Task Tools' } }
    stage('Install packages') { steps { powershell './ops/jenkins.ps1 -Task Install' } }
    stage('Jest tests') { steps { powershell './ops/jenkins.ps1 -Task Test' } }
    stage('Build frontend') { steps { powershell './ops/jenkins.ps1 -Task Build' } }
    stage('Build Docker image') { when { expression { params.RUN_DOCKER } }
      steps { powershell './ops/jenkins.ps1 -Task Image' } }
    stage('Run Docker staging') { when { expression { params.RUN_DOCKER } }
      steps { powershell './ops/jenkins.ps1 -Task Run' } }
    stage('Selenium checkout') { when { expression { params.RUN_DOCKER } }
      steps { powershell './ops/jenkins.ps1 -Task Browser' } }
    stage('Push Docker Hub image') {
      when { expression { params.PUBLISH_IMAGE } }
      steps { withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_TOKEN')]) { powershell './ops/jenkins.ps1 -Task Publish' } }
    }
    stage('Deploy local Kubernetes staging') {
      when { expression { params.DEPLOY_LOCAL_K8S } }
      steps { powershell './ops/local-k8s.ps1 -Environment staging -Context $env:KUBE_CONTEXT' }
    }
    stage('Approve production') {
      when { expression { params.DEPLOY_LOCAL_K8S } }
      steps { timeout(time: 15, unit: 'MINUTES') { input message: 'Staging browser checks passed. Switch local production to this image?', ok: 'Deploy production' } }
    }
    stage('Deploy local Kubernetes production') {
      when { expression { params.DEPLOY_LOCAL_K8S } }
      steps { powershell './ops/local-k8s.ps1 -Environment production -Context $env:KUBE_CONTEXT' }
    }
  }
  post { always { archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true } }
}



