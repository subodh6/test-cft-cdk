import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { Infra } from './main-stack';

export class MyPipelineAppStage extends cdk.Stage {
    
    constructor(scope: Construct, stageName: string, props?: cdk.StageProps) {
      super(scope, stageName, props);
  
      new Infra(this, 'cross-teest-680', stageName);      
    }
}