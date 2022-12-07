import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BucketAccessControl } from 'aws-cdk-lib/aws-s3';

export interface ConstructorProps {}

export class CloudfrontS3Website extends Construct {
    
    public readonly websiteBucket : s3.Bucket
    public readonly cloudfrontDistribution : cloudfront.Distribution

    constructor (scope: Construct, id: string, props: ConstructorProps = {}) {
        super(scope, id);


        // Bucket itself
        
        this.websiteBucket = new s3.Bucket(this, "website-bucket", {
            accessControl: BucketAccessControl.PRIVATE,
        })

        // Logging bucket

        const loggingBucket = new s3.Bucket(this, "logging-bucket", {
            accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
        })


        // Cloudfront distribution

        const originAccessIdentity = new cloudfront.OriginAccessIdentity(
            this, 'OriginAccessIdentity');

        this.websiteBucket.grantRead(originAccessIdentity);    
        
        this.cloudfrontDistribution = new cloudfront.Distribution(this, "distro", {
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: new origins.S3Origin(this.websiteBucket, {originAccessIdentity}),
            },
            enableLogging: true,
            logBucket: loggingBucket
        })



    }
}