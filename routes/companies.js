const express = require('express')
const router = express.Router()
const db = require('../db')
const ExpressError = require('../expressError')
const slugify = require('slugify')

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies`);

        return res.json({ companies: result.rows });
    } catch(e) {
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try{
        const comp_code = req.params.code;
        const result = await db.query(
            `SELECT c.code, c.name, c.description, i.industry
            FROM companies AS c
            JOIN companies_industries AS ci 
            ON c.code = ci.comp_code
            JOIN industries AS i 
            ON i.code = ci.industry_code
            WHERE c.code=$1`,
            [comp_code]
        );
        if (result.rows.length === 0) throw new ExpressError(`Unable to locate company with code ${comp_code}`, 404);
        const { code, name, description } = result.rows[0];
        const industries = result.rows.map(res => res.industry);
        return res.json({ code, name, description, industries});
    } catch(e) {
        return next(e)
    }
})

// router.get('/:code', async (req, res, next) => {
//     try {
//         const { code } = req.params;
//         const result = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]);
//         if(result.rows.length === 0) throw new ExpressError(`Unable to locate company with code ${code}`, 404);

//         return res.json({ company: result.rows[0] })
//     }catch(e) {
//         return next(e)
//     }
// });

router.post('/', async (req, res, next) => {
    try{
        const { name, description } = req.body;
        const code = slugify(name, {remove: /[*+~.()'"!:@]/g, lower: true})
        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`, 
            [code, name, description]);

        return res.status(201).json({ company: result.rows[0] }) //following RESTful format post returns status 201
    } catch(e) {
        return next(e)
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const result = await db.query(
            `UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, code]);
        if(result.rows.length === 0) throw new ExpressError(`Unable to locate company with code ${code}`, 404);

        return res.json({ company: result.rows[0] });
    } catch(e) {
        return next(e)
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(`
            DELETE FROM companies
            WHERE code=$1 RETURNING name`,
            [code])
            if(result.rows.length === 0) throw new ExpressError(`Unable to locate company with code ${code}`, 404);
            
        return res.json({ message: "Deleted" })
    } catch(e) {
        return next(e)
    }
});

module.exports = router;