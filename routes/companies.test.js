process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app")
const db = require("../db")

const company1 = {
    code: "klty",
    name: "Kelty",
    description: "The best camping and outdoor gear maker"
};

let testCompany;
beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) 
        VALUES ('mmmt', 'Mammut', 'they make an awesome climbing harness')
        RETURNING code, name, description`);
        testCompany = result.rows[0];
});

afterEach( async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll( async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Get a list of one user", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies : [testCompany] })
    })
})
