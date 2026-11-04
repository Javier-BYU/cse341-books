import express from 'express';
import router from './src/router.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' with { type: 'json' };

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json({ limit: '10kb' }));
app.use(router);

app.get('/', (req, res) => {
  return res.status(200).json({ message: 'Server is running' });
});

app.use((req, res) => res.status(404).json({ error: 'Resource not found' }));

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.status === 413) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['Request body must not exceed 10 KB'],
    });
  }

  if (error.status === 400 && error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['Request body must be valid JSON'],
    });
  }

  console.error('Unhandled request error:', error);
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;