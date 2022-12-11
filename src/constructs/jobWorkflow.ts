import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { LambdaConstruct } from './lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';

export interface JobWorkflowProps {
    name : string;
    init ?: boolean
}

export class JobWorkflowConstruct extends Construct {
    
    public jobInjestor : LambdaConstruct
    public jobProcessor : LambdaConstruct
    public jobTable : dynamodb.Table
    public jobArtifactBucket : s3.Bucket

    constructor (scope: Construct, id: string, props: JobWorkflowProps) {
        super(scope, id);

        this.jobTable = new dynamodb.Table(this, props.name + "Jobs", {
            partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'jobState', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        });

        this.jobInjestor = new LambdaConstruct(this, 
            props.name + 'Injestor', { init : props.init })

        this.jobProcessor = new LambdaConstruct(this,
            props.name + 'Processor', { init : props.init })

        this.jobInjestor.lambdaFunction.addEnvironment('JOB_TABLE', this.jobTable.tableName)
        this.jobProcessor.lambdaFunction.addEnvironment('JOB_TABLE', this.jobTable.tableName)

        this.jobTable.grantReadWriteData(this.jobInjestor.lambdaFunction)
        this.jobTable.grantReadWriteData(this.jobProcessor.lambdaFunction)

        this.jobArtifactBucket = new s3.Bucket(this, props.name + 'JobArtifacts', {
            accessControl: BucketAccessControl.PRIVATE,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

        this.jobArtifactBucket.grantReadWrite(this.jobInjestor.lambdaFunction)
        this.jobArtifactBucket.grantReadWrite(this.jobProcessor.lambdaFunction)

        this.jobProcessor.lambdaFunction.addEventSource(new DynamoEventSource(this.jobTable, {
            batchSize: 1000,
            maxBatchingWindow: Duration.seconds(30),
            startingPosition: lambda.StartingPosition.LATEST,
        }))

    }
}