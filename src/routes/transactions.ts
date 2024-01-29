import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'crypto';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function transactionsRoutes(app: FastifyInstance) {
    // GET

    app.get(
        '/',
        {
            preHandler: [checkSessionIdExists],
        },
        async (request, response) => {
            const { sessionId } = request.cookies;

            const transactions = await knex('transactions')
                .where('session_id', sessionId)
                .select();

            return response.status(200).send({
                transactions,
            });
        },
    );

    app.get(
        '/:id',
        {
            preHandler: [checkSessionIdExists],
        },
        async (request, response) => {
            const { sessionId } = request.cookies;

            const getTransactionParamSchema = z.object({
                id: z.string().uuid(),
            });

            const { id } = getTransactionParamSchema.parse(request.params);

            const transaction = await knex('transactions')
                .where({
                    session_id: sessionId,
                    id,
                })
                .first();

            return response.status(200).send({
                transaction,
            });
        },
    );

    app.get(
        '/summary',
        {
            preHandler: [checkSessionIdExists],
        },
        async (request, response) => {
            const { sessionId } = request.cookies;

            const summary = await knex('transactions')
                .where('session_id', sessionId)
                .sum('amount', { as: 'amount' })
                .first();

            return response.status(200).send({
                summary,
            });
        },
    );

    // POST

    app.post('/', async (request, response) => {
        const createTransactionBodySchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit']),
        });

        const { title, amount, type } = createTransactionBodySchema.parse(
            request.body,
        );

        let sessionId = request.cookies.sessionId;

        if (!sessionId) {
            sessionId = randomUUID();

            response.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });
        }

        await knex('transactions').insert({
            id: randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1,
            session_id: sessionId,
        });

        return response.status(201).send();
    });
}
