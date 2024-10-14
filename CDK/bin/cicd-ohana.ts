#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CicdOhanaStack } from '../lib/cicd-ohana-stack';

const app = new cdk.App();

new CicdOhanaStack(app, 'cicd-v3-pipeline', {
  env: { account: '264852106485', region: 'ap-south-1' },
});

