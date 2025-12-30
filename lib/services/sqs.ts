import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// AWS SQS configuration from environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_SQS_QUEUE_URL = process.env.AWS_SQS_QUEUE_URL || '';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Initialize SQS client
const sqsClient = new SQSClient({
    region: AWS_REGION,
    credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
        : undefined, // Use default credentials if not provided
});

/**
 * Publish a message to the SQS queue for face detection processing
 */
export async function publishEnrollJob(data: {
    photoId: string;
    uploadedBy: string;
    imageUri: string;
    downloadUrl: string;
    albumId: string;
}): Promise<boolean> {
    try {
        // Validate queue URL
        if (!AWS_SQS_QUEUE_URL) {
            console.error('❌ AWS_SQS_QUEUE_URL is not configured');
            return false;
        }

        // Create message
        const messageBody = JSON.stringify(data);

        // Send message to SQS
        const command = new SendMessageCommand({
            QueueUrl: AWS_SQS_QUEUE_URL,
            MessageBody: messageBody,
            MessageAttributes: {
                photoId: {
                    DataType: 'String',
                    StringValue: data.photoId,
                },
                uploadedBy: {
                    DataType: 'String',
                    StringValue: data.uploadedBy,
                },
                albumId: {
                    DataType: 'String',
                    StringValue: data.albumId,
                },
            },
        });

        const response = await sqsClient.send(command);

        if (response.MessageId) {
            console.log('📤 Published SQS job:', {
                messageId: response.MessageId,
                photoId: data.photoId,
                albumId: data.albumId,
            });
            return true;
        } else {
            console.warn('⚠️ Failed to send message to SQS (no MessageId)');
            return false;
        }
    } catch (error) {
        console.error('❌ Error publishing SQS job:', error);
        return false;
    }
}

/**
 * Get SQS client instance (for worker consumption)
 */
export function getSQSClient(): SQSClient {
    return sqsClient;
}

/**
 * Get queue URL (for worker consumption)
 */
export function getQueueUrl(): string {
    return AWS_SQS_QUEUE_URL;
}
