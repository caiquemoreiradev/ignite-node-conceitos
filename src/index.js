const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const clients = [];

// middleware

function verifyIfClientExists(req, res, next) {

    const { cpf } = req.params;

    const client = clients.find((client) => client.cpf === cpf);

    if(!client) {
        return res.status(400).json({ error: "Client not found!" })
    }

    req.client = client;

    return next();
}

function getBalance(statement) {

    const balance = statement.reduce((acc, operation) => {

        if(operation.type === 'credit') {

            return acc + operation.amount;
        }

        else {

            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

// search all clients 

app.get("/accounts", (req, res) => {

    return res.status(200).json(clients);

})

// create client (id, name, cpf, statement)

app.post("/account", (req, res) => {

    const { cpf, name } = req.body;

    const clientAlreadyExists = clients.some(
        (client) => client.cpf === cpf
    )

    if(clientAlreadyExists) {
        return res.status(400).json({ error: "Client already exists!"});
    }

    const newClient = {
        id: uuidv4(),
        cpf,
        name,
        statement: []
    }

    clients.push(newClient);

    return res.status(201).json({ message: "Client added with success!"});
})

// return client statement by cpf

app.get("/statement/:cpf", verifyIfClientExists, (req, res) => {

    const { client } = req;

    return res.status(200).json(client.statement);
})

// return client statement by date

app.get("/statement/:cpf/:date", verifyIfClientExists, (req, res) => {

    const { client } = req;
    const { date } = req.params;

    const dateFormat = new Date(date + " 00:00");

    const statement = client.statement.filter(
        (statement) => 
        statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return res.status(200).json(statement);
})

// create a new deposit

app.post("/:cpf/deposit", verifyIfClientExists, (req, res) => {

    const { client } = req;
    const { description, amount } = req.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    client.statement.push(statementOperation);

    return res.status(201).json({ message: "Statement added with success!" });
})

// create a new withdraw

app.post("/:cpf/withdraw", verifyIfClientExists, (req, res) => {

    const { client } = req;
    const { amount } = req.body;

    const balance = getBalance(client.statement);

    if(balance < amount) {
        return res.status(400).json({ error: "Insufficient funds!"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    client.statement.push(statementOperation);

    return res.status(201).json({ message: "Withdraw complete!"})
})

// update client data

app.put("/account/:cpf", verifyIfClientExists, (req, res) => {

    const { client } = req;
    const { name } = req.body;

    client.name = name;

    return res.status(200).json({ message: "Client data updated with success!"});
})

// search client by cpf

app.get("/account/:cpf", verifyIfClientExists, (req, res) => {

    const { client } = req;

    return res.status(200).json(client);
})

// delete account 

app.delete("/account/:cpf", verifyIfClientExists, (req, res) => {

    const { client } = req;

    //splice
    clients.splice(client, 1);

    return res.status(200).json({ message: "Client deleted with success!"});
})

// return balance 

app.get("/balance/:cpf", verifyIfClientExists, (req, res) => {

    const { client } = req;

    const balance = getBalance(client.statement);

    return res.status(200).json(balance);
})

app.listen(3333);