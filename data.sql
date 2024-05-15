DROP DATABASE IF EXISTS biztimedb;

CREATE DATABASE biztimedb;

\c biztimedb

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    comp_code INTEGER NOT NULL REFERENCES companies,
    industry_code INTEGER NOT NULL REFERENCES industries,
    PRIMARY KEY(comp_code, industry_code)
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries
    VALUES ('tech', 'technology')
           ('sftwr', 'software')
           ('pmtproc', 'payment processing');

INSERT INTO companies_industries
    VALUES ('apple', 'tech')
           ('apple', 'sftwr')
           ('apple', 'pmtproc')
           ('ibm', 'tech')
           ('ibm', 'sftwr');

SELECT i.code, i.industry, c.code
FROM industries AS i 
RIGHT JOIN companies_industries AS ci 
ON i.code = ci.industry_code
RIGHT JOIN companies AS c 
ON c.code = ci.comp_code;

SELECT c.code 
FROM companies AS c 
JOIN companies_industries AS ci 
ON c.code = ci.comp_code
WHERE ci.industry_code='tech';

{industries: [
    {
        code: 'sftwr',
        industry: 'software',
        company_codes: [
            apple,
            ibm
        ]
    },
    {
        code: 'tech',
        industry: 'technology',
        company_codes: [
            apple,
            ibm
        ]
    }
]};