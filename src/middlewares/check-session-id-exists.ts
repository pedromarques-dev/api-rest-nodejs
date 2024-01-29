import { FastifyRequest, FastifyReply } from 'fastify';

export const checkSessionIdExists = async (
    request: FastifyRequest,
    response: FastifyReply,
) => {
    const { sessionId } = request.cookies;

    if (!sessionId) {
        return response.status(401).send({
            error: 'Unauthorized',
        });
    }
};
