const express = require('express')
const router = express.Router()
const db = require('../db')
const ExpressError = require('../expressError')

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM invoices`);

        return res.json({ invoices: result.rows });
    } catch(e) {
        return next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoiceResult = await db.query(`SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE id=$1`, [id]);
        if(invoiceResult.rows.length === 0) throw new ExpressError(`Unable to locate invoice with id ${id}`, 404);
        const comp_code = await db.query(`SELECT comp_code FROM invoices WHERE id=$1`, [id]);
        const companyResult = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [comp_code.rows[0].comp_code]);
        const invoice = invoiceResult.rows[0];
        invoice.company = companyResult.rows[0];
        return res.json({ invoice: invoice })
    }catch(e) {
        return next(e)
    }
});

// post
router.post('/', async (req, res, next) => {
    try{
        const { comp_code, amt } = req.body;
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [comp_code, amt]);

        return res.status(201).json({ invoice: result.rows[0] }) //following RESTful format post returns status 201
    } catch(e) {
        return next(e)
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        let paidDate = null;

        const currResult = await db.query(`SELECT paid FROM invoices WHERE id=$1`, [id]);
        if(currResult.rows.length === 0) throw new ExpressError(`Unable to locate invoice with id ${id}`, 404);

        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currPaidDate;
        }

        const result = await db.query(
            `UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]);

        return res.json({ invoice: result.rows[0] });
    } catch(e) {
        return next(e)
    }
});

// router.put('/:id', async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         const { amt } = req.body;
//         const result = await db.query(
//             `UPDATE invoices
//             SET amt=$1
//             WHERE id=$2
//             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
//             [amt, id]);
//         if(result.rows.length === 0) throw new ExpressError(`Unable to locate invoice with id ${id}`, 404);

//         return res.json({ invoice: result.rows[0] });
//     } catch(e) {
//         return next(e)
//     }
// });

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            DELETE FROM invoices
            WHERE id=$1 RETURNING id`,
            [id])
            if(result.rows.length === 0) throw new ExpressError(`Unable to locate invoice with id ${id}`, 404);
            
        return res.json({ message: "Deleted" })
    } catch(e) {
        return next(e)
    }
});

// router.get('/companies/:code', async (req, res, next) => {
//     try {
//         const { code } = req.params;
//         const companyResult = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]);
//         if(companyResult.rows.length === 0) throw new ExpressError(`Unable to locate company with code ${code}`, 404);
//         const invoiceResult = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
//             FROM invoices WHERE comp_code=$1`, [code]);
        
//         return res.json({company: companyResult.rows[0], invoices: invoiceResult.rows });
//     } catch(e) {
//         return next(e)
//     }
// });

// above route but using PRomise.all()
router.get('/companies/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await Promise.all([
            db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]),
            db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
            FROM invoices WHERE comp_code=$1`, [code])   
        ]);
        if(result[0].rows.length === 0) throw new ExpressError(`Unable to locate company with code ${code}`, 404);
        const company = result[0].rows[0];
        company.invoices = result[1].rows; 
        
        return res.json({company: company });
    } catch(e) {
        return next(e)
    }
});

module.exports = router;