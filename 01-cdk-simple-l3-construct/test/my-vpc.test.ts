import { MyVpc, MyVpcProps } from '../lib/vpc/my-vpc';
import '@aws-cdk/assert/jest';
import { App, Stack, StackProps } from "@aws-cdk/core";
import { RetentionDays } from "@aws-cdk/aws-logs";


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




