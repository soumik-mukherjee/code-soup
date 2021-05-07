import { Construct } from "@aws-cdk/core";
import { Vpc, SubnetType, GatewayVpcEndpointAwsService, FlowLogDestination } from "@aws-cdk/aws-ec2";
import { LogGroup, RetentionDays } from "@aws-cdk/aws-logs";

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

        this.cidr = props.cidr
        this.maxAzs = props.maxAzs

        // Assign default values to optional props
        this.dmzSubnetName = (!props.dmzSubnetName ? 'DMZ' : props.dmzSubnetName)
        this.isolatedSubnetName = (!props.isolatedSubnetName ? 'APPLICATION' : props.isolatedSubnetName)
        this.dmzSubnetCidrMask = (!props.dmzSubnetCidrMask ? 24 : props.dmzSubnetCidrMask)
        this.isolatedSubnetCidrMask = (!props.isolatedSubnetCidrMask ? 24 : props.isolatedSubnetCidrMask)
        this.vpcFlowLogRetention = (!props.vpcFlowLogRetention ? RetentionDays.ONE_WEEK : props.vpcFlowLogRetention)

        this.vpcFlowLogGroupName = props.vpcFlowLogGroupName

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

        const vpcFlowLogGroup = new LogGroup(this, `${id}.VpcFlowLogGroup`, {
            logGroupName: this.vpcFlowLogGroupName,
            retention: this.vpcFlowLogRetention
          });
      
          vpc.addFlowLog(id, {
            destination: FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup)
          });
    }
}