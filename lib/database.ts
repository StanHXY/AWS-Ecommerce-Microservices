import { Construct } from "constructs";
import { AttributeType, BillingMode, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

export class SwnDatabase extends Construct{

    public readonly productTable: ITable;
    public readonly basketTable: ITable;
    public readonly orderTable: ITable;

    constructor(scope: Construct, id: string){
        super(scope, id);

        // product table
        this.productTable = this.createProductTable();
        // basket table
        this.basketTable = this.createBasketTable();
        // order table
        this.orderTable = this.createOrderTable();

    }

    // ----- create Product DynamoDB -----
    // product: PK:id -- name -- description -- imageFile -- price -- category
    private createProductTable() : ITable {
        const productTable = new Table(this, 'product', {
            partitionKey: {
              name: 'id',
              type: AttributeType.STRING
            },
            tableName: 'product',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST
        });
        return productTable;
    }

    // ----- create Basket table -----
    // basket: PK: id(username) -- items(SET-MAP object) {quality - color - price - productID - productName}
    private createBasketTable() : ITable {
        const basketTable = new Table(this, 'basket', {
            partitionKey: {
              name: 'username',
              type: AttributeType.STRING
            },
            tableName: 'basket',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST
        });
        return basketTable;
    }

    // ----- create Order table -----
    /* Order: PK: username - SortKey: orderDate - totalPrice - firstName - lastName - 
        email - address - paymentMethod - cardInfo
    */
    private createOrderTable() : ITable {
        const orderTable = new Table(this, 'order', {
            partitionKey: {
                name: 'username',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'orderDate',
                type: AttributeType.STRING,
            },
            tableName: 'order',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST 
        });
        return orderTable;
    }



}


