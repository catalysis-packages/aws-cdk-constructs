import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BucketAccessControl } from 'aws-cdk-lib/aws-s3';

let websiteBucket : s3.Bucket
let cloudfrontDistribution : cloudfront.Distribution

export interface CreatedResources {
    websiteBucket : s3.Bucket
    cloudfrontDistribution : cloudfront.Distribution
}

export interface ConstructorProps {
    name : string
}

export class CloudfrontS3Website {
    
    public resources : CreatedResources

    constructor (stack: cdk.Stack, props?: ConstructorProps) {

        let useName = props ? props.name : "CloudfrontS3Website"

        construct_bucket(stack, useName)
        construct_distribution(stack, useName)

        this.resources = {
            websiteBucket : websiteBucket,
            cloudfrontDistribution : cloudfrontDistribution
        }
        
    }
}


function construct_bucket (stack: cdk.Stack, name : string) {

    websiteBucket = new s3.Bucket(stack, name + "-bucket", {
        accessControl: BucketAccessControl.PRIVATE,
    })
    
}

function construct_distribution (stack: cdk.Stack, name : string ) {

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
        stack, 'OriginAccessIdentity');
    
    websiteBucket.grantRead(originAccessIdentity);
    
    new cloudfront.Distribution(stack, name + "-distro", {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {originAccessIdentity}),
      },
    })

}
