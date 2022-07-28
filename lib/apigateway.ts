import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
    productMicroservice: IFunction;
    basketMicroservice: IFunction;
    orderingMicroservice: IFunction;
}

export class SwnApiGateway extends Construct {
    
    constructor(scope: Construct, id: string, props: SwnApiGatewayProps){
        super(scope, id);

        this.createProductApi(props.productMicroservice);
        this.createbasketApi(props.basketMicroservice);
        this.createOrderApi(props.orderingMicroservice);
    }

    private createbasketApi(basketMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'basketApi', {
            restApiName: 'Basket Service',
            handler: basketMicroservice,
            proxy: false
        });

        const basket = apigw.root.addResource('basket');
        basket.addMethod('GET'); // GET/basket
        basket.addMethod('POST'); // POST/basket

        const singleBasket = basket.addResource('{username}'); //basket/{id}
        singleBasket.addMethod('GET'); // GET/basket/{id}
        singleBasket.addMethod('DELETE'); // DELETE/basket/{id}

        // ---------------- checkout async flow ----------------
        const basketCheckout = basket.addResource('checkout');
        basketCheckout.addMethod('POST'); // POST /basket/checkout
        // expected payload: {userName : swn}

    }


    private createProductApi(productMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: productMicroservice,
            proxy: false
        });
      
        const product = apigw.root.addResource('product');
        product.addMethod('GET'); // GET/product
        product.addMethod('POST'); // POST/product
      
        const singleProduct = product.addResource('{id}'); //product/{id}
        singleProduct.addMethod('GET'); // GET/product/{id}
        singleProduct.addMethod('PUT'); // PUT/product/{id}
        singleProduct.addMethod('DELETE'); // DELETE/product/{id}
    }


    private createOrderApi(orderingMicroservice: IFunction) {
        // GET /order
        // GET /order/{username}
        // expect request : xxx/order/swn?orderDate=timestamp
            // ordering ms grap input and query parameters and filter to dynamoDB

        const apigw = new LambdaRestApi(this, 'orderApi', {
            restApiName: 'Order Service',
            handler: orderingMicroservice,
            proxy: false
        });
      
        const order = apigw.root.addResource('order');
        order.addMethod('GET'); // GET/product
      
        const singleOrder = order.addResource('{username}'); //order/{username}
        singleOrder.addMethod('GET'); // GET/order/{username}

        return singleOrder;
    }

}