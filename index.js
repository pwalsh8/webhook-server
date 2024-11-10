const express = require('express');
const app = express();
const fetch = require('node-fetch'); // You'll need to install this: npm install node-fetch

// Middleware to parse JSON bodies
app.use(express.json());

// Root path
app.get('/', (req, res) => {
    res.send('Webhook server is running!');
});

// Webhook endpoint that forwards to n8n
app.post('/webhook', async (req, res) => {
    console.log('Received webhook from Phantom:', req.body);
    
    try {
        // Forward to n8n
        const n8nResponse = await fetch('https://pwalsh.app.n8n.cloud/webhook-test/dccc9da3-ce2e-4463-bfcc-373321dce2bb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        
        console.log('Forwarded to n8n:', await n8nResponse.text());
        res.status(200).send('Webhook received and forwarded');
    } catch (error) {
        console.error('Error forwarding webhook:', error);
        res.status(500).send('Error forwarding webhook');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
