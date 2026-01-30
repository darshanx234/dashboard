/**
 * Script to initialize sample events in the database
 * Run this to add test events for development
 * 
 * Usage: npx ts-node scripts/init-events.ts
 * Or: npm run init-events (if added to package.json scripts)
 */

import mongoose from 'mongoose';
import Event, { EventType, EventStatus } from '../lib/models/Event';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://darshanx:Darshan100@cluster0.cqwfiut.mongodb.net/?appName=Cluster0';

interface EventData {
    photographerId: string;
    clientId: string;
    albumId?: string;
    title: string;
    description?: string;
    type: EventType;
    status: EventStatus;
    startDate: Date;
    endDate: Date;
    location?: string;
    notes?: string;
}

// Sample events data - customize as needed
const sampleEvents: EventData[] = [
    {
        photographerId: 'photographer_001',
        clientId: 'client_001',
        title: 'Smith Wedding Ceremony',
        description: 'Beautiful outdoor wedding ceremony at Garden Villa',
        type: 'wedding',
        status: 'scheduled',
        startDate: new Date('2026-02-15T10:00:00'),
        endDate: new Date('2026-02-15T18:00:00'),
        location: 'Garden Villa, Mumbai',
        notes: 'Client prefers candid shots. Bring extra batteries.',
    },
    {
        photographerId: 'photographer_001',
        clientId: 'client_002',
        title: 'Corporate Annual Meet',
        description: 'Annual corporate event photography',
        type: 'corporate',
        status: 'scheduled',
        startDate: new Date('2026-03-10T09:00:00'),
        endDate: new Date('2026-03-10T17:00:00'),
        location: 'Tech Park Convention Center',
        notes: 'Focus on keynote speakers and networking sessions.',
    },
    {
        photographerId: 'photographer_001',
        clientId: 'client_003',
        title: 'Family Portrait Session',
        description: 'Indoor studio portrait session for family of 5',
        type: 'portrait',
        status: 'completed',
        startDate: new Date('2026-01-10T14:00:00'),
        endDate: new Date('2026-01-10T16:00:00'),
        location: 'Studio A',
        notes: 'Delivered 50 edited photos.',
    },
    {
        photographerId: 'photographer_001',
        clientId: 'client_004',
        title: 'Birthday Celebration',
        description: '50th birthday party photography',
        type: 'event',
        status: 'scheduled',
        startDate: new Date('2026-04-20T18:00:00'),
        endDate: new Date('2026-04-20T23:00:00'),
        location: 'Royal Banquet Hall',
    },
    {
        photographerId: 'photographer_002',
        clientId: 'client_005',
        title: 'Product Photoshoot',
        description: 'E-commerce product photography for fashion brand',
        type: 'other',
        status: 'scheduled',
        startDate: new Date('2026-02-25T10:00:00'),
        endDate: new Date('2026-02-25T15:00:00'),
        location: 'Studio B',
        notes: '100+ products to shoot. White background.',
    },
];

async function initializeEvents() {
    try {
        console.log('Connecting to MongoDB...');
        console.log(MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Creating sample events...');

        let created = 0;
        let skipped = 0;

        for (const eventData of sampleEvents) {
            // Check if event with same title and photographerId already exists
            const existingEvent = await Event.findOne({
                photographerId: eventData.photographerId,
                title: eventData.title,
            });

            if (existingEvent) {
                console.log(`⏭️  Skipping "${eventData.title}" (already exists)`);
                skipped++;
                continue;
            }

            const event = new Event(eventData);
            await event.save();
            console.log(`✅ Created: "${eventData.title}" (${eventData.type})`);
            created++;
        }

        console.log('\n📊 Summary:');
        console.log(`   Created: ${created} events`);
        console.log(`   Skipped: ${skipped} events (already existed)`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing events:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

initializeEvents();
