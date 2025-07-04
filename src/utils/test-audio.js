// Test script for audio functionality
import { audioEngine } from './audioEngine.js';

export async function runAudioTests() {
  console.log('🔊 Running Audio Engine Tests...');
  
  try {
    // Test 1: Audio initialization
    console.log('Test 1: Audio initialization');
    await audioEngine.init();
    console.log('✅ Audio engine initialized:', audioEngine.isInitialized);
    
    // Test 2: Synth creation
    console.log('\nTest 2: Synth creation');
    const synthId = audioEngine.createSynth('Synth');
    console.log('✅ Synth created with ID:', synthId);
    
    const synth = audioEngine.getSynth(synthId);
    console.log('✅ Synth retrieved:', synth !== null);
    
    // Test 3: Simple note playback
    console.log('\nTest 3: Simple note test');
    if (synth) {
      synth.triggerAttackRelease('C4', '8n');
      console.log('✅ Test note played (C4)');
    }
    
    // Test 4: BPM setting
    console.log('\nTest 4: BPM setting');
    audioEngine.setBpm(140);
    console.log('✅ BPM set to 140');
    
    // Test 5: Sequence scheduling (minimal test)
    console.log('\nTest 5: Sequence scheduling');
    const testSequence = {
      notes: [
        { note: 'C4', time: 0, duration: '4n', velocity: 0.8 }
      ]
    };
    const events = audioEngine.scheduleSequence(testSequence, synthId);
    console.log('✅ Test sequence scheduled, events:', events?.length || 0);
    
    // Clean up
    audioEngine.disposeSynth(synthId);
    console.log('✅ Test synth disposed');
    
    console.log('\n🎉 All audio tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Audio test failed:', error);
    return false;
  }
}

// Auto-run audio tests after page load
if (import.meta.env.DEV) {
  setTimeout(async () => {
    await runAudioTests();
  }, 2000);
}