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
        const result = await db.query(
            `SELECT code, industry
            FROM industries`
        );
        const industries = result.rows
        industries.forEach(async (r) => {
            const comp_codes = await db.query(
                `SELECT comp_code FROM companies_industries WHERE industry_code=$1`, [r.industry_code]);
            if(comp_codes) {
                r.comp_codes = comp_codes.rows
            } else {
                r.comp_codes = [];
            }
        });
        return res.json({ industries: industries })        
    } catch(e) {
        return next(e)
    }
});

module.exports = router;