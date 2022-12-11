import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BucketAccessControl } from 'aws-cdk-lib/aws-s3';

export interface LambdaProps {
    // if true, the lambda function will be created with inline code
    init ?: boolean
}

export class LambdaConstruct extends Construct {
    
    public readonly codeBucket : s3.Bucket
    public readonly lambdaFunction : lambda.Function

    constructor (scope: Construct, id: string, props: LambdaProps) {
        super(scope, id);

        this.codeBucket = new s3.Bucket(this, 'CodeBucket', {
            accessControl: BucketAccessControl.PRIVATE,
        });

        const code = lambda.Code.fromInline(`exports.handler = async function(event) { return 'From Lambda Construct'; }`);
        const fromBucket = lambda.Code.fromBucket(this.codeBucket, 'lambda.zip');

        this.lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
            code: props.init ? code : fromBucket,
            handler: 'index.handler',
            runtime: lambda.Runtime.NODEJS_14_X,
        });

    }
}