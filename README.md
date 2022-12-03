# CDK Mixins

Repo that includes some useful mixins to add to CDK deployments for quick and easy templates

```bash
yarn add catalysis-cdk-mixins
```

```ts
import * as Mixins from 'catalysis-cdk-mixins'

...

// Sample lambda function with logging, connected through api gateway
// with code bucket
new Mixins.ServerlessLambdaAPI(this)

```
