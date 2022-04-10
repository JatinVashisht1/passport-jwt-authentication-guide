# Passport JWT Authentication [Demo App]
## Description
- This is a demo app created solely for the purpose of practicing passport-jwt authentication
- I will try to provide a good walk-through as we proceed

## Pre-requisites
- [Express.js](https://expressjs.com/en/starter/hello-world.html)
- [MondoDB](https://www.mongodb.com/docs/manual/tutorial/getting-started/)
- [Mongoose](https://mongoosejs.com/docs/index.html)

## Step 0
### Initialize project
- Create an empty folder and initialize an npm project
    - use `npm init` to create an empty project and `npm init -y` to create the project with default settings
- Install required dependencies
```
npm i --save express mongoose dotenv passport passport-jwt modules
```
### Structure Project
- Create following folders
    - config (add passport and database configuration files)
    - lib (to add utility file for issuing jwt, password generation, etc. )
    - models (to define our mongoose models)
    - routes (to define routes of our app)
- Create following files
    - app.js (entry point of our express app)
    - generateKeypair (will act as simple script to generate public and private keys for our jwt)