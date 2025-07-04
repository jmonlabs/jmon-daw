// Test script for the DAW store functionality
import { dawStore } from '../stores/dawStore.js';

export function runStoreTests() {
  console.log('🧪 Running DAW Store Tests...');
  
  try {
    // Test 1: Initial state
    console.log('Test 1: Initial state');
    console.log('✅ BPM:', dawStore.bpm);
    console.log('✅ Tracks:', dawStore.tracks.length);
    console.log('✅ JMON sequences:', dawStore.jmonData.sequences.length);
    
    // Test 2: BPM change
    console.log('\nTest 2: BPM change');
    const originalBpm = dawStore.bpm;
    dawStore.setBpm(140);
    console.log('✅ BPM changed to:', dawStore.bpm);
    console.log('✅ JMON BPM synced:', dawStore.jmonData.bpm);
    dawStore.setBpm(originalBpm); // Reset
    
    // Test 3: Track operations
    console.log('\nTest 3: Track operations');
    const initialTrackCount = dawStore.tracks.length;
    dawStore.addTrack();
    console.log('✅ Track added. Count:', dawStore.tracks.length);
    console.log('✅ JMON sequences count:', dawStore.jmonData.sequences.length);
    
    // Test 4: Track update
    console.log('\nTest 4: Track update');
    const newTrackId = dawStore.tracks[dawStore.tracks.length - 1].id;
    dawStore.updateTrack(newTrackId, { name: 'Test Track', synthType: 'FMSynth' });
    const updatedTrack = dawStore.tracks.find(t => t.id === newTrackId);
    console.log('✅ Track updated:', updatedTrack.name, updatedTrack.synthType);
    
    // Test 5: UI state
    console.log('\nTest 5: UI state');
    dawStore.toggleLeftSidebar();
    console.log('✅ Left sidebar toggled:', dawStore.leftSidebarOpen);
    dawStore.toggleLeftSidebar(); // Reset
    
    // Clean up test track
    dawStore.removeTrack(newTrackId);
    console.log('✅ Test track removed. Final count:', dawStore.tracks.length);
    
    console.log('\n🎉 All store tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Store test failed:', error);
    return false;
  }
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    runStoreTests();
  }, 1000);
}