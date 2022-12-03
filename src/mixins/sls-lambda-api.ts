import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import { ResponseType } from 'aws-cdk-lib/aws-apigateway';

let sourceCodeBucket : s3.Bucket
let lambdaFunction : lambda.Function
let serviceEvents : logs.LogGroup
let serviceEventStream : logs.LogStream
let apiRestGateway : apiGateway.LambdaRestApi

export interface CreatedResources {
    sourceCodeBucket : s3.Bucket
    lambdaFunction : lambda.Function
    serviceEvents : logs.LogGroup
    serviceEventStream : logs.LogStream
    apiRestGateway : apiGateway.LambdaRestApi
}

export interface ConstructorProps {
    readonly function_has_code : boolean
}

export class ServerlessLambdaAPI {
    
    public resources : CreatedResources

    constructor (stack: cdk.Stack, props?: ConstructorProps) {

        // Bucket for storing source code
        construct_sourceCodeBucket(stack)

        // Logs into a log group in cloudwatch
        construct_logs(stack)

        // Lambda function itself
        construct_lambdaFunction(stack)

        // API Gateway to expose the lambda function
        construct_apiGateway(stack)

        // Populate the resources object
        this.resources = {
            sourceCodeBucket : sourceCodeBucket,
            lambdaFunction : lambdaFunction,
            serviceEvents : serviceEvents,
            serviceEventStream : serviceEventStream,
            apiRestGateway : apiRestGateway
        }
        
    }
}


function construct_sourceCodeBucket (stack: cdk.Stack) {

    sourceCodeBucket = new s3.Bucket(stack, 'ServerlessFunctionSource', {
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

}

function construct_logs (stack: cdk.Stack) {

    serviceEvents = new logs.LogGroup(stack, 'ServerlessLogGroup', {
        retention: logs.RetentionDays.INFINITE
    });

    serviceEventStream = serviceEvents.addStream('root', {
        logStreamName : 'root'
    })

}

function construct_lambdaFunction (stack: cdk.Stack, useCodeFromBucket : boolean = false) {

    const logGroupAccess = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:PutLogEvents', 'logs:DescribeLogStreams'],
        resources: [serviceEvents.logGroupArn],
    });

    lambdaFunction = new lambda.Function(stack, 'Function', {
        functionName: 'LambdaFunction',
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: 'index.handler',
        code: useCodeFromBucket
            ? lambda.Code.fromBucket(sourceCodeBucket, 'lambda.zip') 
            : lambda.Code.fromInline('exports.handler = async e => ({ statusCode: 200, body: "Hello World" })'),
    });

    lambdaFunction.addToRolePolicy( logGroupAccess )

}

function construct_apiGateway (stack: cdk.Stack) {

    apiRestGateway = new apiGateway.LambdaRestApi(stack, 'api', {
        handler : lambdaFunction,
        proxy: false,
    });

    apiRestGateway.addGatewayResponse('DEFAULT_5XX', {
        type: ResponseType.DEFAULT_5XX,
        responseHeaders : {
            "Access-Control-Allow-Origin": "'*'"
        }
    })

    apiRestGateway.addGatewayResponse('DEFAULT_4XX', {
        type: ResponseType.DEFAULT_4XX,
        responseHeaders : {
            "Access-Control-Allow-Origin": "'*'"
        }
    })

    let lambdaIntegration = new apiGateway.LambdaIntegration(lambdaFunction)
    let rootRoute = apiRestGateway.root.addResource('{any+}', {
        defaultCorsPreflightOptions: {
            allowOrigins: ['*'],
            allowHeaders: ['Authorization'],
            allowMethods: ['GET', 'POST']
        }
    });

    rootRoute.addMethod('GET', lambdaIntegration, {});

    rootRoute.addMethod('POST', lambdaIntegration, {});

}


