/**
 * Script to initialize default album plans in the database
 * Run this once to set up the four pricing tiers
 * 
 * Usage: node scripts/init-album-plans.js
 * Or: npm run init-plans (if added to package.json scripts)
 */

import mongoose from 'mongoose';
import { AlbumPlanService } from '../lib/services/album-plan.service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://darshanx:Darshan100@cluster0.cqwfiut.mongodb.net/?appName=Cluster0';

async function initializePlans() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Initializing album plans...');
    await AlbumPlanService.initializeDefaultPlans();
    console.log('✅ Album plans initialized successfully!');

    console.log('\nCreated plans:');
    console.log('1. Basic - ₹99 (25 GB)');
    console.log('2. Standard - ₹149 (50 GB) [Recommended]');
    console.log('3. Premium - ₹199 (100 GB)');
    console.log('4. Enterprise - ₹249 (200 GB)');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing plans:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initializePlans();
