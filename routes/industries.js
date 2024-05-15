const express = require('express')
const router = express.Router();
const db = require('../db')
const ExpressError = require('../expressError')
const slugify = require('slugify')

router.post('/', async (req, res, next) => {
    try {
        const { industry } = req.body;
        const code = slugify(industry, {remove: /[*+~.()'"!:@]/g, lower: true})
        const result = await db.query(
            `INSERT INTO industries ( code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
        [code, industry])
        return res.json({ industry: result.rows[0]})
    } catch(e) {
        return next(e)
    }
});

router.get('/', async (req, res, next) => {
    try {
        
    } catch(e) {
        return next(e)
    }
})

module.exports = router;