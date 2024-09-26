---

# BuyTrek - E-commerce API

Welcome to **BuyTrek**, a powerful and scalable E-commerce API built with NestJS. BuyTrek allows business owners to join as market owners, buyers to shop from various sellers, and customer service to manage the distribution of products. This API provides the necessary endpoints to manage products, users, orders, and more, for a seamless online shopping experience.

## Table of Contents

-   [Features](#features)
-   [Technologies](#technologies)
-   [Installation](#installation)
-   [Usage](#usage)
-   [API Endpoints](#api-endpoints)
-   [Contributing](#contributing)
-   [License](#license)

## Features

-   User authentication and authorization
-   Product management (CRUD operations)
-   Order management
-   Shopping cart functionality
-   Category management for products
-   Payment integration with Paystack
-   Pagination and filtering for product listings
-   Role-based access control for Admin, Buyer, Seller, and Customer Service
-   Warehouse management for sellers to store and track inventory
-   Buyer product rating and review system

## Technologies

-   [NestJS](https://nestjs.com/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [MySQL](https://www.mysql.com/)
-   [TypeORM](https://typeorm.io/)
-   [JWT](https://jwt.io/)
-   [Redis](https://redis.io/)
-   [Paystack](https://paystack.com/)

## Installation

### Prerequisites

-   Install [Node.js](https://nodejs.org/) (v14.x or later)
-   Install NestJS globally:

    ```bash
    npm install -g @nestjs/cli
    ```

-   Install [MySQL](https://www.mysql.com/) and create the necessary databases for development and production:

    -   Development: `buytrek-dev`
    -   Production: `buytrek`

### Steps

1. Clone the repository:

    ```bash
    git clone git@github.com:bakare-dev/BuyTrek.git
    cd buytrek
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Set up your environment variables:

    Create a `.env` file in the root directory and add the following:

    ```plaintext
    PORT=9001
    DEV_DB=buytrek-dev
    DEV_USER=
    DEV_PASSWORD=
    DEV_HOST=
    PROD_DB=buytrek
    PROD_USER=
    PROD_PASSWORD=
    PROD_HOST=
    WINSTONSOURCETOKEN=
    WINSTONSOURCEID=
    REDISPORT=
    REDISURL=
    REDISDATABASE=
    SMTP_HOST=
    SMTP_PORT=
    SMTP_USN=
    SMTP_PASSWORD=
    JWT_SECRET=
    ```

4. Start the application in production mode:

    ```bash
    npm run build
    npm run start:prod
    ```

### Frontend Setup

For frontend integration, navigate to `/src/config/main.settings.ts` and update the base URL for both development and production environments.

Make sure to implement the following payment routes in your frontend:

-   `/order/cancel`: Paystack redirects here when the user cancels the payment. You should call the backend's "cancel order payment('/api/v1/order/cancel?id=<orderId>&type=payment')" endpoint and then redirect the user back to the cart page. Note leave type=payment like that only add the order id
-   `/orders`: Paystack redirects here after payment completion.

### User Roles

When creating a user, the following roles are available:

-   `0` - Buyer
-   `1` - Admin
-   `2` - Seller
-   `3` - Customer Service

## Business Workflow

The concept of BuyTrek is to provide a platform where business owners can join as market owners, sellers can list their products, and buyers can purchase items. The workflow involves:

-   Buyers placing orders for products from different sellers.
-   Customer Service managing the orders, gathering products from the respective sellers, and ensuring all items are ready before shipping the complete order to the buyer.
-   Sellers can send products to the BuyTrek warehouse for easier distribution. They can track inventory and send additional items as needed.
-   Buyers can rate products and leave comments after receiving them, improving the buying experience.

## Usage

Once the server is running, you can access the API at:

```bash
http://localhost:9001
```

## API Endpoints

Detailed documentation for the available API endpoints can be found in the [API documentation](#api-endpoints).

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a pull request.

---
