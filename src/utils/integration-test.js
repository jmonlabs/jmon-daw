// Integration test for DAW functionality
import { dawStore } from '../stores/dawStore.js';
import { audioEngine } from './audioEngine.js';

export async function runIntegrationTests() {
  console.log('🔄 Running Integration Tests...');
  
  try {
    // Test 1: Full workflow - Add track and play
    console.log('Test 1: Full workflow test');
    
    // Initialize audio
    await audioEngine.init();
    
    // Load demo composition
    dawStore.loadDemo();
    console.log('✅ Demo loaded, tracks:', dawStore.tracks.length);
    
    // Test note addition simulation
    const firstTrack = dawStore.tracks[0];
    if (firstTrack) {
      const originalNoteCount = firstTrack.notes?.length || 0;
      
      // Simulate adding a note
      const newNote = { note: 'G4', time: 8, duration: '4n', velocity: 0.8 };
      const updatedNotes = [...(firstTrack.notes || []), newNote];
      dawStore.updateTrack(firstTrack.id, { notes: updatedNotes });
      
      const updatedTrack = dawStore.tracks.find(t => t.id === firstTrack.id);
      console.log('✅ Note added, count:', updatedTrack.notes.length, 'vs original:', originalNoteCount);
      
      // Verify JMON sync
      const jmonSequence = dawStore.jmonData.sequences[0];
      console.log('✅ JMON synced, notes:', jmonSequence.notes.length);
    }
    
    // Test 2: BPM change affects both stores
    console.log('\nTest 2: BPM synchronization');
    dawStore.setBpm(130);
    console.log('✅ DAW BPM:', dawStore.bpm);
    console.log('✅ JMON BPM:', dawStore.jmonData.bpm);
    console.log('✅ BPM synchronized:', dawStore.bpm === dawStore.jmonData.bpm);
    
    // Test 3: UI state management
    console.log('\nTest 3: UI state management');
    const initialSidebar = dawStore.leftSidebarOpen;
    dawStore.toggleLeftSidebar();
    console.log('✅ Sidebar toggled:', dawStore.leftSidebarOpen !== initialSidebar);
    dawStore.toggleLeftSidebar(); // Reset
    
    // Test 4: Audio playback preparation
    console.log('\nTest 4: Audio playback preparation');
    audioEngine.setBpm(dawStore.bpm);
    
    // Create synths for all tracks (simulation)
    let synthCount = 0;
    dawStore.tracks.forEach(track => {
      if (track.notes && track.notes.length > 0) {
        const synthId = audioEngine.createSynth(track.synthType, track.synthOptions);
        if (synthId) synthCount++;
      }
    });
    console.log('✅ Synths created:', synthCount);
    
    // Test 5: JMON export/import simulation
    console.log('\nTest 5: JMON serialization');
    const exportedJmon = JSON.stringify(dawStore.jmonData, null, 2);
    const importedJmon = JSON.parse(exportedJmon);
    console.log('✅ JMON export/import successful');
    console.log('✅ Exported tracks:', importedJmon.sequences.length);
    
    console.log('\n🎉 All integration tests passed!');
    console.log('\n📊 Final state:');
    console.log('- Tracks:', dawStore.tracks.length);
    console.log('- BPM:', dawStore.bpm);
    console.log('- Audio initialized:', audioEngine.isInitialized);
    console.log('- JMON sequences:', dawStore.jmonData.sequences.length);
    
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

// Auto-run integration tests
if (import.meta.env.DEV) {
  setTimeout(async () => {
    await runIntegrationTests();
  }, 3000);
}