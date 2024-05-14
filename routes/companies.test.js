process.env.NODE_ENV = 'test' // important this be set before importing db below, as we want this set before db so the correct (test) db is used
const request = require('supertest')
const app = require('../app')
const db = require('../db')

// creates a test user and add to db before each test

const kelty = {
    code: 'klty',
    name: 'Kelty',
    description: 'Best camping gear ever!'
};

let testCompany;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) 
        VALUES ('mmmt', 'Mammut', 'makers of some nice climbing harnesses') 
        RETURNING code, name, description`);
    testCompany = result.rows[0];
});

// deletes test companies from db after each test
afterEach(async () => {
    await db.query('DELETE FROM companies')
});

// wait for the connection to db to end for jest to be able to exit tests
afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Get array with one company", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompany] })
    });
});

describe("GET /companies/:code", () => {
    test("Get a single company", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: testCompany })
    });
    test("Invalid id, responds with 404", async () => {
        const res = await request(app).get(`/companies/0`)
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: {message: 'Unable to locate company with code 0', 
                                           status: 404}, 
                                           message: 'Unable to locate company with code 0'}) 
    });
});

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send(kelty);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ company: kelty});
    });
});

describe("PUT /companiess/:code", () => {
    test("Updates a single company", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: "Mammut!",
                                                                                    description: "This was edited through PUT"        
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: {code: testCompany.code, name: "Mammut!", description: "This was edited through PUT"}})
    });
    test("Invalid id, responds with 404", async () => {
        const res = await request(app).put('/companies/0').send({ name: "Mammut!",
                                                            description: "This was edited through PUT"        
        });
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: {message: 'Unable to locate company with code 0', 
                                           status: 404}, 
                                           message: 'Unable to locate company with code 0'});
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Deleted"})
    });
    test("Invalid id, responds with 404", async () => {
        const res = await request(app).delete('/companies/0');
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: {message: 'Unable to locate company with code 0', 
                                           status: 404}, 
                                           message: 'Unable to locate company with code 0'});
    });
});
