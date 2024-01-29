import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/app';
import request from 'supertest';
import { execSync } from 'node:child_process';

describe('Transactions routes', () => {
    beforeAll(() => {
        app.ready();
    });

    afterAll(() => {
        app.close();
    });

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all');
        execSync('npm run knex migrate:latest');
    });

    it('should be able to create a new transaction', async () => {
        await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            })
            .expect(201);
    });

    it('should be able to list all transactions', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
        });

        const cookies = response.get('Set-Cookie');

        const transactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200);

        expect(transactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            }),
        ]);
    });

    it('should be able to get a specific transaction', async () => {
        const newTransaction = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            });

        const cookies = newTransaction.get('Set-Cookie');

        const transactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200);

        const transactionId = transactionsResponse.body.transactions[0].id;

        const getTransactionsResponseById = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies)
            .expect(200);

        expect(getTransactionsResponseById.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            }),
        );
    });

    it('should be able to get the summary', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
        });

        const cookies = response.get('Set-Cookie');

        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
                title: 'debit transaction',
                amount: 2000,
                type: 'debit',
            });

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)
            .expect(200);

        expect(summaryResponse.body.summary).toEqual({
            amount: 3000,
        });
    });
});
