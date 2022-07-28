import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { SwnApiGateway } from './apigateway';
import { SwnDatabase } from './database';
import { SwnEventBus } from './eventbus';
import { SwnMicroservices } from './microservice';
import { SwnQueue } from './queue';



export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new SwnDatabase(this, 'Database');

    const microservice = new SwnMicroservices(this, 'Microservices', {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable
    });

    const apigateway = new SwnApiGateway(this, 'ApiGateway', {
      productMicroservice: microservice.productMicroservice,
      basketMicroservice: microservice.basketMicroservice,
      orderingMicroservice: microservice.orderingMicroservice
    });

    const queue = new SwnQueue(this, 'Queue', {
      consumer: microservice.orderingMicroservice
    })

    const eventbus = new SwnEventBus(this, 'EventBus', {
      publisherFunction: microservice.basketMicroservice,
      targetQueue: queue.orderQueue
    });


  }
}
