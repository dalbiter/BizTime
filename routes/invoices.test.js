process.env.NODE_ENV = 'test' // important this be set before importing db below, as we want this set before db so the correct (test) db is used
const request = require('supertest')
const app = require('../app')
const db = require('../db')

// creates a test user and add to db before each test

const invoice2 = {
    comp_code: 'mmmt',
    amt: 9999,
};

let testCompany;
let testInvoice;
beforeEach(async () => {
    const companyResult = await db.query(`INSERT INTO companies (code, name, description) 
                                          VALUES ('mmmt', 'Mammut', 'makers of some nice climbing harnesses') 
                                          RETURNING code, name, description`);
    testCompany = companyResult.rows[0]
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt) 
                                          VALUES ('mmmt', 4444) 
                                          RETURNING id, comp_code, amt, paid, add_date, paid_date`)    
    testInvoice = invoiceResult.rows[0];
});

// deletes test companies from db after each test
afterEach(async () => {
    await Promise.all([db.query(`DELETE FROM invoices`),
                       db.query(`DELETE FROM companies`)
    ])
});

// wait for the connection to db to end for jest to be able to exit tests
afterAll(async () => {
    await db.end();
});

describe("GET /invoices", () => {
    test("Get array with one invoice", async () => {
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [{
            id: expect.any(Number),
            comp_code: testInvoice.comp_code,
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            add_date: expect.any(String), //Check this with Sonia
            paid_date: testInvoice.paid_date
        }] })
    });
});

describe("GET /invoices/:id", () => {
    test("Get a single invoice and the matching the company details", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`)
        testInvoice.company = testCompany
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: {
            id: expect.any(Number),
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            add_date: expect.any(String), //Check this with Sonia
            paid_date: testInvoice.paid_date,
            company: testCompany
        }});
    });
    test("Invalid id, responds with 404", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: {message: 'Unable to locate invoice with id 0', 
                                           status: 404}, 
                                           message: 'Unable to locate invoice with id 0'}) 
    });
});

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post('/invoices').send(invoice2);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ invoice: {
            id: expect.any(Number),
            comp_code: invoice2.comp_code,
            amt: invoice2.amt,
            paid: false,
            add_date: expect.any(String), //Check this with Sonia
            paid_date: null,
        }});
    });
});

describe("PUT /companiess/:id", () => {
    test("Updates a single invoice", async () => {
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 2424 });
        expect(res.statusCode).toBe(200);
        expect(res.body.invoice.amt).toEqual(2424)
    });
    test("Invalid id, responds with 404", async () => {
        const res = await request(app).put('/invoices/0').send({ amt: 2424});
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: {message: 'Unable to locate invoice with id 0', 
                                           status: 404}, 
                                           message: 'Unable to locate invoice with id 0'});
    });
});

// describe("DELETE /companies/:code", () => {
//     test("Deletes a single company", async () => {
//         const res = await request(app).delete(`/companies/${testCompany.code}`);
//         expect(res.statusCode).toBe(200);
//         expect(res.body).toEqual({ message: "Deleted"})
//     });
//     test("Invalid id, responds with 404", async () => {
//         const res = await request(app).delete('/companies/0');
//         expect(res.statusCode).toBe(404);
//         expect(res.body).toEqual({ error: {message: 'Unable to locate company with code 0', 
//                                            status: 404}, 
//                                            message: 'Unable to locate company with code 0'});
//     });
// });