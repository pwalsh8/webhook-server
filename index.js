require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const phantomData = req.body;
    console.log('Received webhook from Phantombuster:', phantomData);
    
    if (process.env.WEBHOOK_SECRET) {
        const secret = req.query.secret;
        if (secret !== process.env.WEBHOOK_SECRET) {
            console.error('Invalid webhook secret');
            return res.status(401).json({ error: 'Invalid secret' });
        }
    }

    switch (phantomData.exitMessage) {
        case 'finished':
            console.log(`Agent ${phantomData.agentName} completed successfully`);
            break;
        case 'killed':
            console.log(`Agent ${phantomData.agentName} was killed`);
            break;
        case 'global timeout':
        case 'org timeout':
        case 'agent timeout':
            console.log(`Agent ${phantomData.agentName} timed out`);
            break;
        default:
            console.log(`Agent ${phantomData.agentName} ended with status: ${phantomData.exitMessage}`);
    }

    if (process.env.N8N_WEBHOOK_URL) {
        callWebhook(phantomData);
    }

    res.status(200).send('Webhook received');
});

async function callWebhook(data) {
    try {
        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.N8N_AUTH_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('N8n webhook response:', result);
        return result;
    } catch (error) {
        console.error('Error calling N8n webhook:', error);
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});