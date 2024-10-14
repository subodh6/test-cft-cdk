import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep, CodeBuildStep } from 'aws-cdk-lib/pipelines';
import { config } from './config'; // Assuming this imports configuration values
import { MyPipelineAppStage } from './stages';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
 
export class CicdOhanaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      enableKeyRotation: true,
      pipelineName: `${id}-Pipeline`,
      synth: new CodeBuildStep('Build', {
        input: CodePipelineSource.connection(config.gitHubRepo, config.gitHubBranch, {
          connectionArn: config.codeStarConnectionArn,
        }),
        commands: [
          'cp -r CDK Ohana-Springboot/',
          'mv ./Ohana-Springboot/CDK ./Ohana-Springboot/build_artifacts',
          'cd CDK',
          'npm ci', 'npm run build', 'npx cdk synth',
          'cp -r cdk.out/* ../Ohana-Springboot/build_artifacts/',
          'cd ..',
          'cp -r aws/infra/codepipeline/* Ohana-Springboot/',
          'cd Ohana-Springboot',
          'ls',
          'chmod +x test.sh',
          './test.sh',
          'ls -al',
        ],
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
        },
        primaryOutputDirectory: './Ohana-Springboot/build_artifacts',
      }), 
      selfMutation: false,

    });
 
    const testingStage = pipeline.addStage(new MyPipelineAppStage(this, "test", {
      env: { account: "954503069243", region: "ap-south-1" }
    }));
 
    const testRole = new iam.Role(this, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        AssumeRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sts:AssumeRole'],
              resources: [
                'arn:aws:iam::954503069243:role/cdk-hnb659fds-deploy-role-954503069243-ap-south-1',
                'arn:aws:iam::954503069243:role/cdk-hnb659fds-file-publishing-role-954503069243-ap-south-1',
              ],
              
            }),
            new iam.PolicyStatement({
              actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
              resources: ['arn:aws:ssm:ap-south-1:264852106485:parameter/matson-hello-world/*'],
            }),
          ],
        }),
      },
    });


    testingStage.addPost(new CodeBuildStep("Deploy Application", {
      input: pipeline.synth,
      primaryOutputDirectory: '',
      commands: [ 'ls',
                'chmod +x test2.sh',
                './test2.sh',
      ],
      buildEnvironment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
      },
      env: {
        STAGE: 'lab',
        CROSS_ACCOUNT_S3_BUCKET: 'test-cross-teest-680-lab',
        CROSS_ACCOUNT_S3_BUCKET_PATH: "s3://test-cross-teest-680-lab"
      },
      role: testRole 
    }));

    new CfnOutput(this, 'RepositoryName', {
      value: config.gitHubRepo,
    });
  }
}