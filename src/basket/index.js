import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { ebClient } from "./eventBridgeClient";


exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    let body;

    try{
        // switch case event.HTTP method(from API gateway) to perform CRUD operations using ddbClient
        switch (event.httpMethod) {
            case "GET":
                if(event.pathParameters != null){ // GET /basket/{userName}
                    body = await getBasket(event.pathParameters.username); 
                }
                else{ // no parameters: get all items
                    body = await getAllBaskets();
                }
                break;
            case "POST":
                if(event.path == "/basket/checkout"){ // POST /basket/checkout
                    body = await checkoutBasket(event);
                }
                else{
                    body = await createBasket(event); // POST /basket
                }
                break;
            case "DELETE": // DELETE /basket/{userName}
                body = await deleteBasket(event.pathParameters.username);
                break;
            default:
                throw new Error(`Unsupported route: "${event.httpMethod}"`);
        }
        // sending success msg
        console.log(body);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}"`,
                body: body
            })
        };

    } catch(e){
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: e.message,
                errorStack: e.stack,
            })
        };
    };


};


const getBasket = async (username) => {
    console.log("getBasket");
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ username: username })
        };
        // Async get
        const { Item } = await ddbClient.send(new GetItemCommand(params));
        console.log(Item);
        return (Item) ? unmarshall(Item) : {};

    }catch(e){
        console.error(e);
        throw e;
    }
}

const getAllBaskets = async () => {
    console.log("getAllBasket");
    try{
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
        };
        const { Items } = await ddbClient.send(new ScanCommand(params));
        console.log(Items);
        return (Items) ? Items.map((item) => unmarshall(item)) : {};

    }catch(e){
        console.error(e);
        throw e;
    }

}

const createBasket = async (event) => {
    console.log("getBasket");
    
    try {
      console.log(`createProduct function. event : "${event}"`);
      const requestBody = JSON.parse(event.body);
  
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(requestBody || {})
      };
  
      const createResult = await ddbClient.send(new PutItemCommand(params));
  
      console.log(createResult);
      return createResult;
  
    } catch(e) {
      console.error(e);
      throw e;
    }
}

const deleteBasket = async (username) => {
    console.log(`deleteBasket function. username : "${username}"`);

    try{
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ username: username }),
        };

        const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
        console.log(deleteResult);
        return deleteResult;

    }catch(e){
        console.error(e);
        throw e;
    }
}

// publish an event to enventBridge - 
// this will subscribe by order microservice, and start process order
const checkoutBasket = async (event) => {
    console.log("checkoutBasket");

    // 0. get json payload
    const checkoutRequest = JSON.parse(event.body);
    if(checkoutRequest == null || checkoutRequest.username == null){
        throw new Error(`username should exist in checkoutRequest: "${checkoutRequest}"`);
    } 

    // 1. get existed basket with items
    const basket = await getBasket(checkoutRequest.username);

    // 2. create an event json object with basket items
    var checkoutPayload = prepareOrderPayload(checkoutRequest, basket);

    // 3. publish event to event bridge
    const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);

    // 4. remove existing basket
    await deleteBasket(checkoutRequest.username);
}


const prepareOrderPayload = (checkoutRequest, basket) => {    
    console.log("prepareOrderPayload");
    
    // prepare order payload -> calculate totalprice and combine checkoutRequest and basket items
    // aggregate and enrich request and basket data in order to create order payload    
    try {
        if (basket == null || basket.items == null) {
            throw new Error(`basket should exist in items: "${basket}"`);
        }
  
        // calculate totalPrice
        let totalPrice = 0;
        basket.items.forEach(item => totalPrice = totalPrice + item.price);
        checkoutRequest.totalPrice = totalPrice;
        console.log(checkoutRequest);
    
        // copies all properties from basket into checkoutRequest
        Object.assign(checkoutRequest, basket);
        console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
        return checkoutRequest;
  
      } catch(e) {
        console.error(e);
        throw e;
    }    
}

const publishCheckoutBasketEvent = async(checkoutPayload) => {
    console.log("publishCheckoutBasketEvent with payload :", checkoutPayload);
    try {
        // eventbridge parameters for setting event to target system
        const params = {
            Entries: [
                {
                    Source: process.env.EVENT_SOURCE,
                    Detail: JSON.stringify(checkoutPayload),
                    DetailType: process.env.EVENT_DETAILTYPE,
                    Resources: [ ],
                    EventBusName: process.env.EVENT_BUSNAME
                },
            ],
        };
     
        const data = await ebClient.send(new PutEventsCommand(params));
    
        console.log("Success, event sent; requestID:", data);
        return data;
    
      } catch(e) {
        console.error(e);
        throw e;
    }
}
  



