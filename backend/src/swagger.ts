import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Instant Mechanic Operations API',
      version: '1.0.0',
      description: 'Live Vehicle Service Operations Dashboard API',
      contact: {
        name: 'Instant Mechanic',
        url: 'https://instantmechanic.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://your-backend.amazonaws.com'
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    tags: [
      { name: 'Dashboard', description: 'Dashboard overview and analytics' },
      { name: 'Bookings', description: 'Booking management' },
      { name: 'Mechanics', description: 'Mechanic management' },
      { name: 'Customers', description: 'Customer management' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
