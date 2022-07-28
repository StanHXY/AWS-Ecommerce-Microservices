"use strict";

// asset-input/src/basket/index.js
exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, void 0, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello from Basket ! You've hit ${event.path}
`
  };
};
