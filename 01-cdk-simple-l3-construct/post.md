## Steps

### Basic Skeleton

```
mkdir my-vpc-construct
cdk init lib --language=typescript
```

```
.                                                                                                                     
├── jest.config.js                                                                                                    
├── lib                                                                                                               
│   └── index.ts                                                                                                      
├── package.json                                                                                                      
├── post.md                                                                                                           
├── README.md                                                                                                         
├── test                                                                                                              
│   └── 01-cdk-simple-l3-construct.test.ts                                                                            
└── tsconfig.json
```

```
rm -Rf node_modules
rm package-lock.json
yarn
```


```
cd my-vpc-construct
```


```
yarn add --peer @aws-cdk/core @aws-cdk/aws-ec2 @aws-cdk/aws-logs
```


```
yarn add --dev @aws-cdk/core @aws-cdk/aws-ec2 @aws-cdk/aws-logs
```

```
yarn add --dev @aws-cdk/assert@^1.100.0
```

```
cd lib
mkdir vpc
cd vpc
touch my-vpc.ts
```

```zsh
.                                                                                                                     
├── jest.config.js                                                                                                    
├── lib                                                                                                               
│   ├── index.ts                                                                                                      
│   └── vpc                                                                                                           
│       └── my-vpc.ts
├── package.json                                                                                                      
├── README.md                                                                                                         
├── test                                                                                                              
│   └── 01-cdk-simple-l3-construct.test.ts                                                                            
├── tsconfig.json                                                                                                     
└── yarn.lock
```

```typescript
export interface MyVpcProps {
    cidr: string;
    maxAzs: number;
    dmzSubnetName?: string;
    dmzSubnetCidrMask?: number;
    isolatedSubnetName?: string;
    isolatedSubnetCidrMask?: number;
    vpcFlowLogGroupName: string;
    vpcFlowLogRetention?: RetentionDays;
}
```

```typescript
import { Construct } from "@aws-cdk/core";

export class MyVpc extends Construct {
    readonly cidr: string
    readonly maxAzs: number
    readonly dmzSubnetName: string
    readonly isolatedSubnetName: string
    readonly dmzSubnetCidrMask: number
    readonly isolatedSubnetCidrMask: number
    readonly vpcFlowLogGroupName: string
    readonly vpcFlowLogRetention: RetentionDays;

    constructor(scope: Construct, id: string, props: MyVpcProps) {
        super(scope, id);
    }
}
```

```typescript
constructor(scope: Construct, id: string, props: MyVpcProps) {
    super(scope, id);

    this.cidr = props.cidr
    this.maxAzs = props.maxAzs

    // Assign default values to optional props
    this.dmzSubnetName = (!props.dmzSubnetName ? 'DMZ' : props.dmzSubnetName)
    this.isolatedSubnetName = (!props.isolatedSubnetName ? 'APPLICATION' : props.isolatedSubnetName)
    this.dmzSubnetCidrMask = (!props.dmzSubnetCidrMask ? 24 : props.dmzSubnetCidrMask)
    this.isolatedSubnetCidrMask = (!props.isolatedSubnetCidrMask ? 24 : props.isolatedSubnetCidrMask)
    this.vpcFlowLogRetention = (!props.vpcFlowLogRetention ? RetentionDays.ONE_WEEK : props.vpcFlowLogRetention)

    this.vpcFlowLogGroupName = props.vpcFlowLogGroupName
}
```

```
cd ../test
```

```typescript
describe('Validate props', () => {

    it('DMZ Subnet defaults are set', () => {
        expect(vpc.dmzSubnetName).toBe('DMZ');
        expect(vpc.dmzSubnetCidrMask).toBe(24);
    });

    it('Isolated Subnet defaults are set', () => {
        expect(vpc.isolatedSubnetName).toBe('APPLICATION');
        expect(vpc.isolatedSubnetCidrMask).toBe(24);
    })

    it('VPC flow logs will be retained for 1 week by default', () => {
        expect(vpc.vpcFlowLogRetention).toBe(RetentionDays.ONE_WEEK);
    })

});
```

```typescript
const testApp: App = new App();
const testStackProps: StackProps = { env: { region: "ap-south-1" } }
const testStack: Stack = new Stack(testApp, "TestStack", testStackProps);
const vpcProps: MyVpcProps = {
    cidr: '10.0.0.0/21',
    maxAzs: 2,
    vpcFlowLogGroupName: '/my/vpc/flowLogs'
}
const vpcSubnetMaxAzs = 2
const vpc: MyVpc = new MyVpc(testStack, 'TestMyVpc', vpcProps)
```

```typescript
import { MyVpc, MyVpcProps } from '../lib/vpc/my-vpc';
import '@aws-cdk/assert/jest';
import { App, Stack, StackProps } from "@aws-cdk/core";
import { RetentionDays } from "@aws-cdk/aws-logs";
```

```
cd ..
```

```typescript
export * as vpc from "./vpc/my-vpc"
```

```bash
$ yarn build                          
yarn run v1.22.5                                                                                                      
warning package.json: No license field                                                                                
$ tsc                                                                                                                 
Done in 2.98s.
```

```bash
$ yarn test                          
yarn run v1.22.5                                                                                                      
warning package.json: No license field                                                                                
$ jest                                                                                                                
 PASS  test/my-vpc.test.ts                                                                                            
  Validate props                                                                                                      
    ✓ DMZ Subnet defaults are set (1 ms)                                                                             
    ✓ Isolated Subnet defaults are set (1 ms)                                                                        
    ✓ VPC flow logs will be retained for 1 week by default                                                            
Test Suites: 1 passed, 1 total                                                                                        
Tests:       3 passed, 3 total                                                                                        
Snapshots:   0 total                                                                                                  
Time:        2.216 s, estimated 3 s                                                                                   
Ran all test suites.                                                                                                  
Done in 2.63s.
```

```
cd ../lib
```

## Lets add some meat

```typescript
const vpc = new Vpc(this, `${id}`, {
    cidr: this.cidr,
    maxAzs: this.maxAzs,
    natGateways: 0,
    subnetConfiguration: [
        {
            subnetType: SubnetType.ISOLATED,
            name: this.isolatedSubnetName,
            cidrMask: props.isolatedSubnetCidrMask,
        },
        {
            subnetType: SubnetType.PUBLIC,
            name: this.dmzSubnetName,
            cidrMask: this.dmzSubnetCidrMask,
        },
    ],
    gatewayEndpoints: {
        S3: {
            service: GatewayVpcEndpointAwsService.S3,
        },
    }
});
```


```typescript
const vpcFlowLogGroup = new LogGroup(this, `${id}.VpcFlowLogGroup`, {
    logGroupName: this.vpcFlowLogGroupName,
    retention: this.vpcFlowLogRetention
});

vpc.addFlowLog(id, {
    destination: FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup)
});
```

```typescript
describe('Validate stack', () => {

    it('Total subnet count check - twice number of AZs', () => {
        expect(testStack).toCountResources('AWS::EC2::Subnet', 2 * vpcSubnetMaxAzs);
    });

    it('Atleast one subnet is a DMZ', () => {
        expect(testStack).toHaveResourceLike('AWS::EC2::Subnet', {
            Tags: [
                { Key: "aws-cdk:subnet-name", Value: "DMZ" },
                { Key: "aws-cdk:subnet-type", Value: "Public" }
            ]
        });
    });

    it('A flow log will capture all VPC traffic', () => {
        expect(testStack).toHaveResource('AWS::EC2::FlowLog', { ResourceType: "VPC", TrafficType: "ALL", LogDestinationType: "cloud-watch-logs" });
    });
});
```

```
yarn run v1.22.5                                                                                                      
warning package.json: No license field                                                                                
$ jest                                                                                                                
 PASS  test/my-vpc.test.ts                                                                                            
  Validate props                                                                                                      
    ✓ DMZ Subnet defaults are set (1 ms)                                                                              
    ✓ Isolated Subnet defaults are set                                                                                
    ✓ VPC flow logs will be retained for 1 week by default                                                            
  Validate stack                                                                                                      
    ✓ Total subnet count check - twice number of AZs (59 ms)                                                          
    ✓ Atleast one subnet is a DMZ (29 ms)                                                                             
    ✓ A flow log will capture all VPC traffic (26 ms)                                                                 
                                                                                                                      
Test Suites: 1 passed, 1 total                                                                                        
Tests:       6 passed, 6 total                                                                                        
Snapshots:   0 total                                                                                                  
Time:        2.322 s                                                                                                  
Ran all test suites.                                                                                                  
Done in 2.74s.
```

## Some final tests




