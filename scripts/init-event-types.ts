/**
 * Script to initialize event types in the database
 * Run this to set up default event types
 * 
 * Usage: npx tsx scripts/init-event-types.ts
 * Or: npm run init-event-types (if added to package.json scripts)
 */

import mongoose from 'mongoose';
import EventType from '../lib/models/EventTypes';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://darshanx:Darshan100@cluster0.cqwfiut.mongodb.net/?appName=Cluster0';

interface EventTypeData {
    id: string;
    eventtypename: string;
}

// Default event types - customize as needed
const defaultEventTypes: EventTypeData[] = [
    {
        id: 'wedding',
        eventtypename: 'Wedding',
    },
    {
        id: 'portrait',
        eventtypename: 'Portrait',
    },
    {
        id: 'corporate',
        eventtypename: 'Corporate',
    },
    {
        id: 'event',
        eventtypename: 'Event',
    },
    {
        id: 'birthday',
        eventtypename: 'Birthday',
    },
    {
        id: 'engagement',
        eventtypename: 'Engagement',
    },
    {
        id: 'maternity',
        eventtypename: 'Maternity',
    },
    {
        id: 'newborn',
        eventtypename: 'Newborn',
    },
    {
        id: 'family',
        eventtypename: 'Family',
    },
    {
        id: 'graduation',
        eventtypename: 'Graduation',
    },
    {
        id: 'product',
        eventtypename: 'Product Photography',
    },
    {
        id: 'fashion',
        eventtypename: 'Fashion',
    },
    {
        id: 'other',
        eventtypename: 'Other',
    },
];

async function initializeEventTypes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Creating event types...');

        let created = 0;
        let skipped = 0;

        for (const typeData of defaultEventTypes) {
            // Check if event type already exists
            const existingType = await EventType.findOne({
                $or: [{ id: typeData.id }, { eventtypename: typeData.eventtypename }],
            });

            if (existingType) {
                console.log(`⏭️  Skipping "${typeData.eventtypename}" (already exists)`);
                skipped++;
                continue;
            }

            const eventType = new EventType(typeData);
            await eventType.save();
            console.log(`✅ Created: "${typeData.eventtypename}" (${typeData.id})`);
            created++;
        }

        console.log('\n📊 Summary:');
        console.log(`   Created: ${created} event types`);
        console.log(`   Skipped: ${skipped} event types (already existed)`);

        console.log('\n📋 Event Types:');
        defaultEventTypes.forEach((type, index) => {
            console.log(`   ${index + 1}. ${type.eventtypename} (${type.id})`);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing event types:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

initializeEventTypes();
