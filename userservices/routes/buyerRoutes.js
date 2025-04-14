const express = require('express');
const router = express.Router();
const Buyer = require('../models/Buyer');

// GET /buyers — Get all buyers
router.get('/', async (req, res) => {
    try {
        const buyers = await Buyer.find();
        res.json(buyers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch buyers' });
    }
});

// GET /buyers/:id — Get buyer by ID
router.get('/:id', async (req, res) => {
    try {
        const buyer = await Buyer.findById(req.params.id);
        if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
        res.json(buyer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch buyer' });
    }
});


// PUT /buyers/:id — Update buyer details
router.put('/:id', async (req, res) => {
    try {
        const updatedBuyer = await Buyer.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: new Date() // update timestamp
            },
            { new: true, runValidators: true }
        );

        if (!updatedBuyer) {
            return res.status(404).json({ error: 'Buyer not found' });
        }

        res.json({ message: 'Buyer updated', buyer: updatedBuyer });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
