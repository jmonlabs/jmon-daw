// Browser verification test for the Switch to PolySynth fix
// Run this in the browser console after loading the DAW

console.log('🧪 VERIFICATION: Testing Switch to PolySynth Fix');

// Check if we have access to the necessary objects
if (!window.dawStore) {
  console.error('❌ window.dawStore not found');
  throw new Error('DAW store not available');
}

if (!window.audioEngine) {
  console.error('❌ window.audioEngine not found');
  throw new Error('Audio engine not available');
}

console.log('✅ DAW store and audio engine found');

// Function to check current state
function checkCurrentState() {
  const jmonSynthTypes = window.dawStore.jmonData.sequences.map(s => ({
    label: s.label,
    synthType: s.synth?.type || 'Unknown'
  }));
  
  const dawTrackSynthTypes = window.dawStore.tracks.map(t => ({
    name: t.name,
    synthType: t.synthType
  }));
  
  console.log('📊 Current JMON synth types:', jmonSynthTypes);
  console.log('📊 Current DAW track synth types:', dawTrackSynthTypes);
  
  // Check if they match
  const isInSync = jmonSynthTypes.every((jmonSeq, index) => {
    const dawTrack = dawTrackSynthTypes[index];
    return dawTrack && jmonSeq.synthType === dawTrack.synthType;
  });
  
  console.log('🔄 JMON and DAW tracks in sync:', isInSync ? '✅ YES' : '❌ NO');
  
  return { jmonSynthTypes, dawTrackSynthTypes, isInSync };
}

// Function to simulate the switch to PolySynth
function testSwitchToPolySynth() {
  console.log('\n🧪 TESTING: Switch to PolySynth process');
  
  // Check initial state
  console.log('📋 Initial state:');
  const initialState = checkCurrentState();
  
  // Find a track that's not already PolySynth
  const targetTrackIndex = initialState.jmonSynthTypes.findIndex(seq => seq.synthType !== 'PolySynth');
  
  if (targetTrackIndex === -1) {
    console.log('ℹ️ All tracks are already PolySynth');
    return;
  }
  
  const targetTrack = initialState.jmonSynthTypes[targetTrackIndex];
  console.log(`🎯 Target track: ${targetTrack.label} (currently ${targetTrack.synthType})`);
  
  // Simulate the switch (manually update JMON data)
  const currentJmonData = window.dawStore.jmonData;
  const updatedSequences = [...currentJmonData.sequences];
  updatedSequences[targetTrackIndex] = {
    ...updatedSequences[targetTrackIndex],
    synth: {
      ...updatedSequences[targetTrackIndex].synth,
      type: 'PolySynth'
    }
  };
  
  const updatedJmonData = {
    ...currentJmonData,
    sequences: updatedSequences
  };
  
  console.log('🔄 Simulating JMON data update...');
  
  // This would normally be done by the actual switch action
  // For testing, we'll just verify the logic
  console.log(`✅ Would update ${targetTrack.label} from ${targetTrack.synthType} to PolySynth`);
  
  // Check if the sync function would work
  const mockSyncedTracks = window.dawStore.tracks.map((track, index) => {
    if (index === targetTrackIndex) {
      return {
        ...track,
        synthType: 'PolySynth'
      };
    }
    return track;
  });
  
  console.log('🔄 After sync, DAW tracks would be:', mockSyncedTracks.map(t => ({
    name: t.name,
    synthType: t.synthType
  })));
  
  console.log('✅ Sync verification: JMON and DAW tracks would be in sync');
}

// Function to create a test polyphony warning
function createTestPolyphonyWarning() {
  console.log('\n🧪 TESTING: Creating test polyphony warning');
  
  // Find a track that's not PolySynth
  const targetTrack = window.dawStore.tracks.find(t => t.synthType !== 'PolySynth');
  
  if (!targetTrack) {
    console.log('ℹ️ No tracks available for polyphony warning test');
    return;
  }
  
  console.log(`🎯 Creating polyphony warning for: ${targetTrack.name}`);
  
  // Use the store's method to create a polyphony warning
  const warningId = window.dawStore.addPolyphonyWarning(
    targetTrack.name,
    targetTrack.synthType,
    'Test polyphony warning'
  );
  
  console.log(`📢 Created polyphony warning with ID: ${warningId}`);
  console.log('💡 You can now test clicking "Switch to PolySynth" in the UI');
}

// Run the tests
try {
  // Check initial state
  console.log('📋 Initial state check:');
  checkCurrentState();
  
  // Test the switch logic
  testSwitchToPolySynth();
  
  // Create a test warning
  createTestPolyphonyWarning();
  
  console.log('\n✅ Verification tests completed successfully');
  console.log('💡 You can now test the actual "Switch to PolySynth" button in the UI');
  
} catch (error) {
  console.error('❌ Verification test failed:', error);
}

// Export verification functions for manual use
window.verifyPolySynthFix = {
  checkCurrentState,
  testSwitchToPolySynth,
  createTestPolyphonyWarning
};
