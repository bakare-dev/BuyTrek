# BuyTrek - E-commerce API

Welcome to **BuyTrek**, a powerful and scalable E-commerce API built with NestJS. This API provides all the necessary endpoints to manage products, users, orders, and more for an online shopping platform.

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
-   Order management (create, update, delete)
-   Shopping cart functionality
-   Category management for products
-   Payment integration with Paystack
-   Pagination and filtering for product listings

## Technologies

-   [NestJS](https://nestjs.com/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [MySQL](https://www.mysql.com/) for database interactions
-   [TypeORM](https://typeorm.io/) (for database interactions)
-   [JWT](https://jwt.io/) for authentication
-   Redis for caching

## Installation

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
    PORT=
    DEV_DB=buytrek
    DEV_USER=
    DEV_PASSWORD=
    DEV_HOST=
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

4. Start the application:

    ```bash
    npm run start
    ```

## Usage

Once the server is running, you can access the API at `http://localhost:9001`.
