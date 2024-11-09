require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Add this route handler for the root path
app.get('/', (req, res) => {
    res.send('Webhook server is running!');
});

// Webhook endpoint for Phantombuster
app.post('/webhook', (req, res) => {
    const phantomData = req.body;
    
    // Log the incoming webhook data
    console.log('Received webhook from Phantombuster:', phantomData);
    
    // Only check secret if it's configured in .env
    if (process.env.WEBHOOK_SECRET) {
        const secret = req.query.secret;
        if (secret !== process.env.WEBHOOK_SECRET) {
            console.error('Invalid webhook secret');
            return res.status(401).json({ error: 'Invalid secret' });
        }
    }

    // Handle different exit messages
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

    // Forward to N8n webhook if needed
    if (process.env.N8N_WEBHOOK_URL) {
        callWebhook(phantomData);
    }

    // Send response quickly (within timeout)
    res.status(200).send('Webhook received');
});

// Function to call the N8n webhook
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
