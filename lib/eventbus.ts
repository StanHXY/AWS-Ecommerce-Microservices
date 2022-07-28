import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction, SqsQueue } from "aws-cdk-lib/aws-events-targets";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

interface SwnEventBusProps {
    publisherFunction: IFunction;
    targetQueue: IQueue;
}

export class SwnEventBus extends Construct {
    
    constructor(scope: Construct, id: string, props: SwnEventBusProps){
        super(scope, id);

        // Event Bus initialize
        const bus = new EventBus(this, 'SwnEventBus', {
            eventBusName: 'SwnEventBus',
        });
  
        // Event Rules - patterns
        const checkoutBasketRule = new Rule(this, 'CheckoutBasketRule', {
            eventBus: bus,
            enabled: true,
            description: 'When Basket microservice checkout the basket',
            eventPattern: {
                source: ['com.swn.basket.checkoutbasket'],
                detailType: ['CheckoutBasket']
            },
            ruleName: 'CheckoutBasketRule'      
        });
  
        // Need to pass target to Ordering lambda
        // checkoutBasketRule.addTarget(new LambdaFunction(props.targetQueue));

        checkoutBasketRule.addTarget(new SqsQueue(props.targetQueue));

        // grant basket lambda function access to event bus
        bus.grantPutEventsTo(props.publisherFunction);

    }



}