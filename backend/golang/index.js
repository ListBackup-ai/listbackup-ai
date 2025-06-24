exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'API Gateway infrastructure placeholder',
            stage: process.env.STAGE || 'main'
        }),
    };
};