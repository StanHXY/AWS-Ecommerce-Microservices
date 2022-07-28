import { PutItemCommand, ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";



exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    if(event.Records != null){
        // Sqs Invocation
        await sqsInvocation(event);
    }
    else if(event['detail-type'] !== undefined){
        await eventBridgeInvocation(event);
    }
    else{
        return await apiGatewayInvocation(event);
    }
};

const sqsInvocation = async(event) => {
    console.log(`sqsInvocation function. event : "${event}"`);

    event.Records.forEach(async (record) => {
        console.log('Record: %j', record);

        const checkoutEventRequest = JSON.parse(record.body);
        await createOrder(checkoutEventRequest.detail);
    });
}

const eventBridgeInvocation = async (event) => {
  console.log(`eventBridgeInvocation function. event : "${event}"`);

  // create order item into db
  await createOrder(event.detail);
}

const createOrder = async (basketCheckoutEvent) => {
  try {
    console.log(`createOrder function. event : "${basketCheckoutEvent}"`);

    // set orderDate for SK of order dynamodb
    const orderDate = new Date().toISOString();
    basketCheckoutEvent.orderDate = orderDate;
    console.log(basketCheckoutEvent);
    
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketCheckoutEvent || {})
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log(createResult);
    return createResult;

  } catch(e) {
    console.error(e);
    throw e;
  }
}

const apiGatewayInvocation = async (event) => {
  // GET /order	
	// GET /order/{username}
  let body;

  try {
    switch (event.httpMethod) {
        case "GET":
            if (event.pathParameters != null) {
            body = await getOrder(event);
            } else {
            body = await getAllOrders();
            }
            break;
        default:
            throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }

    console.log(body);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Successfully finished operation: "${event.httpMethod}"`,
            body: body
        })
    };
  }
  catch(e) {
      console.error(e);
      return {
      statusCode: 500,
      body: JSON.stringify({
          message: "Failed to perform operation.",
          errorMsg: e.message,
          errorStack: e.stack,
        })
      };
  }
}

const getOrder = async (event) => {
  console.log("getOrder");
    
  try {
    // expected request : xxx/order/swn?orderDate=timestamp
    const username = event.pathParameters.username;  
    const orderDate = event.queryStringParameters.orderDate; 

    const params = {
      KeyConditionExpression: "username = :username and orderDate = :orderDate",
      ExpressionAttributeValues: {
        ":username": { S: username },
        ":orderDate": { S: orderDate }
      },
      TableName: process.env.DYNAMODB_TABLE_NAME
    };
 
    const { Items } = await ddbClient.send(new QueryCommand(params));

    console.log(Items);
    return Items.map((item) => unmarshall(item));
  } catch(e) {
    console.error(e);
    throw e;
  }
}

const getAllOrders = async () => {  
  console.log("getAllOrders");    
  try {
      const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME
      };
  
      const { Items } = await ddbClient.send(new ScanCommand(params));

      console.log(Items);
      return (Items) ? Items.map((item) => unmarshall(item)) : {};

  } catch(e) {
      console.error(e);
      throw e;
  }
}


