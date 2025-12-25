'use client';

import { useEffect, useState } from 'react';
import { kernel } from '@kernel/index';
import { appManager } from '@/apps/appManager';
import { aiSystem } from '@/ai/aiSystem';
import { economySystem } from '@/economy/economySystem';
import { collaborationEngine } from '@/collaboration/collaborationEngine';
import Desktop from '@/components/Desktop';
import BootScreen from '@/components/BootScreen';

export default function Home() {
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootMessage, setBootMessage] = useState('Initializing OMNIVERSE OS...');

  useEffect(() => {
    bootSystem();
  }, []);

  const bootSystem = async () => {
    try {
      setBootMessage('🌌 Initializing kernel...');
      setBootProgress(20);
      await kernel.boot('demo-user');

      setBootMessage('📱 Loading applications...');
      setBootProgress(40);
      await appManager.initialize();

      setBootMessage('🤖 Starting AI systems...');
      setBootProgress(60);
      await aiSystem.initialize();

      setBootMessage('💰 Initializing economy...');
      setBootProgress(80);
      await economySystem.initialize();

      setBootMessage('🤝 Connecting to collaboration server...');
      setBootProgress(90);
      try {
        await collaborationEngine.initialize();
      } catch (err) {
        console.warn('Collaboration server not available, running in offline mode');
      }

      setBootMessage('✨ Welcome to OMNIVERSE OS!');
      setBootProgress(100);

      // Show welcome message briefly
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsBooting(false);

    } catch (error) {
      console.error('Boot error:', error);
      setBootMessage(`❌ Boot failed: ${error}`);
    }
  };

  if (isBooting) {
    return <BootScreen progress={bootProgress} message={bootMessage} />;
  }

  return <Desktop />;
}
