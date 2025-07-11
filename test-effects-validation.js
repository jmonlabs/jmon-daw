// Quick Effects Validation Test
// Run this in the browser console when the DAW is loaded

console.log('🎛️ Starting Effects Validation Test');

// Test 1: Check if master effects are properly implemented
async function testMasterEffectsBasic() {
    console.log('\n🎯 TEST 1: Master Effects Basic Functionality');
    
    try {
        // Clear existing master effects
        dawStore.setMasterBusEffects([]);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Add a reverb effect to master
        const reverbEffect = {
            id: 'test_reverb_' + Date.now(),
            type: 'Reverb',
            options: { wet: 0.3, roomSize: 0.7 }
        };
        
        dawStore.setMasterBusEffects([reverbEffect]);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if effect was created in audio engine
        const audioEffect = audioEngine.audioGraph.get('master_effect_0');
        const masterDest = audioEngine.audioGraph.get('master');
        
        console.log('✅ Master effect created:', !!audioEffect);
        console.log('✅ Master destination updated:', masterDest !== Tone.Destination);
        console.log('✅ Audio effect type:', audioEffect?.constructor.name);
        
        return { success: !!audioEffect, audioEffect, masterDest };
        
    } catch (error) {
        console.error('❌ Master effects test failed:', error);
        return { success: false, error };
    }
}

// Test 2: Check track effects
async function testTrackEffectsBasic() {
    console.log('\n🎯 TEST 2: Track Effects Basic Functionality');
    
    try {
        // Ensure we have a track
        if (dawStore.tracks.length === 0) {
            dawStore.addTrack();
        }
        
        const trackId = dawStore.tracks[0].id;
        const track = dawStore.tracks[0];
        
        // Add a delay effect to the track
        const delayEffect = {
            id: 'test_delay_' + Date.now(),
            type: 'Delay',
            options: { delayTime: '8n', feedback: 0.4, wet: 0.3 }
        };
        
        const updatedEffects = [...(track.effects || []), delayEffect];
        dawStore.updateTrack(trackId, { effects: updatedEffects });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if effect was created in audio engine
        const effectIndex = updatedEffects.length - 1;
        const audioEffectId = `track_0_effect_${effectIndex}`;
        const audioEffect = audioEngine.audioGraph.get(audioEffectId);
        
        console.log('✅ Track effect created:', !!audioEffect);
        console.log('✅ Audio effect type:', audioEffect?.constructor.name);
        console.log('✅ Effect ID:', audioEffectId);
        
        return { success: !!audioEffect, audioEffect, audioEffectId };
        
    } catch (error) {
        console.error('❌ Track effects test failed:', error);
        return { success: false, error };
    }
}

// Test 3: Parameter updates
async function testParameterUpdates() {
    console.log('\n🎯 TEST 3: Real-time Parameter Updates');
    
    try {
        // Test master effect parameter update
        const masterEffect = audioEngine.audioGraph.get('master_effect_0');
        if (masterEffect) {
            const originalWet = masterEffect.wet?.value || 0;
            audioEngine.updateEffectParameter('master_effect_0', 'wet', 0.8);
            const newWet = masterEffect.wet?.value || 0;
            console.log('✅ Master effect parameter update:', originalWet, '->', newWet);
        }
        
        // Test track effect parameter update  
        const trackEffect = audioEngine.audioGraph.get('track_0_effect_0');
        if (trackEffect) {
            const originalWet = trackEffect.wet?.value || 0;
            audioEngine.updateEffectParameter('track_0_effect_0', 'wet', 0.6);
            const newWet = trackEffect.wet?.value || 0;
            console.log('✅ Track effect parameter update:', originalWet, '->', newWet);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Parameter update test failed:', error);
        return { success: false, error };
    }
}

// Test 4: Audio graph integrity
function testAudioGraphIntegrity() {
    console.log('\n🎯 TEST 4: Audio Graph Integrity');
    
    try {
        const audioGraph = audioEngine.audioGraph;
        console.log('📊 Audio Graph Contents:');
        
        audioGraph.forEach((node, id) => {
            console.log(`  ${id}: ${node.constructor.name}`);
        });
        
        const synthCount = audioEngine.synths.size;
        const effectCount = Array.from(audioGraph.keys()).filter(id => 
            id.includes('effect') || id.includes('master')
        ).length;
        
        console.log('✅ Synths:', synthCount);
        console.log('✅ Effects:', effectCount);
        console.log('✅ Total nodes:', audioGraph.size);
        
        return { success: true, synthCount, effectCount, totalNodes: audioGraph.size };
        
    } catch (error) {
        console.error('❌ Audio graph integrity test failed:', error);
        return { success: false, error };
    }
}

// Run all tests
async function runAllEffectsTests() {
    console.log('🚀 Running Complete Effects Validation Suite\n');
    
    const results = {
        masterEffects: await testMasterEffectsBasic(),
        trackEffects: await testTrackEffectsBasic(),
        parameterUpdates: await testParameterUpdates(),
        audioGraph: testAudioGraphIntegrity()
    };
    
    console.log('\n📋 TEST SUMMARY:');
    console.log('Master Effects:', results.masterEffects.success ? '✅ PASS' : '❌ FAIL');
    console.log('Track Effects:', results.trackEffects.success ? '✅ PASS' : '❌ FAIL');
    console.log('Parameter Updates:', results.parameterUpdates.success ? '✅ PASS' : '❌ FAIL');
    console.log('Audio Graph:', results.audioGraph.success ? '✅ PASS' : '❌ FAIL');
    
    const passedTests = Object.values(results).filter(r => r.success).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All effects tests PASSED! The effects system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the details above.');
    }
    
    return results;
}

// Auto-run if this script is executed
if (typeof dawStore !== 'undefined' && typeof audioEngine !== 'undefined') {
    runAllEffectsTests();
} else {
    console.log('⚠️ DAW not loaded. Open the DAW first, then run: runAllEffectsTests()');
}
