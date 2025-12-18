import amqp, { Connection, Channel } from 'amqplib';

// RabbitMQ configuration from environment variables
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = parseInt(process.env.RABBITMQ_PORT || '5672');
const RABBITMQ_USER = process.env.RABBITMQ_USER || 'admin';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'admin';
const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'enroll_jobs';

let connection: Connection | null = null;
let channel: Channel | null = null;

/**
 * Connect to RabbitMQ and create channel
 */
async function connect(): Promise<void> {
    try {
        if (connection && channel) {
            return; // Already connected
        }

        // Build connection URL
        const connectionUrl = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

        connection = await amqp.connect(connectionUrl);

        channel = await connection.createChannel();
        await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });

        console.log('✅ Connected to RabbitMQ');

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
            connection = null;
            channel = null;
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
            connection = null;
            channel = null;
        });
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        connection = null;
        channel = null;
        throw error;
    }
}

/**
 * Publish a message to the enroll_jobs queue
 */
export async function publishEnrollJob(data: {
    photoId: string;
    uploadedBy: string;
    imageUri: string;
    downloadUrl: string;
}): Promise<boolean> {
    try {
        // Ensure connection
        if (!connection || !channel) {
            await connect();
        }

        if (!channel) {
            throw new Error('Failed to establish RabbitMQ channel');
        }

        // Publish message
        const message = JSON.stringify(data);
        const sent = channel.sendToQueue(
            RABBITMQ_QUEUE,
            Buffer.from(message),
            { persistent: true }
        );

        if (sent) {
            console.log('📤 Published enroll job:', data);
            return true;
        } else {
            console.warn('⚠️ Failed to send message to queue (buffer full)');
            return false;
        }
    } catch (error) {
        console.error('❌ Error publishing enroll job:', error);
        // Reset connection on error
        connection = null;
        channel = null;
        return false;
    }
}

/**
 * Close RabbitMQ connection gracefully
 */
export async function closeConnection(): Promise<void> {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('RabbitMQ connection closed gracefully');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
}

// Graceful shutdown handlers
if (typeof process !== 'undefined') {
    process.on('SIGINT', closeConnection);
    process.on('SIGTERM', closeConnection);
}
