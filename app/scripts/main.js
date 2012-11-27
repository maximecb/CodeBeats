/*****************************************************************************
*
*                  CodeBeats : Online Music Coding Platform
*
*  This file is part of the CodeBeats project. The project is distributed at:
*  https://github.com/maximecb/CodeBeats
*
*  Copyright (c) 2012, Maxime Chevalier-Boisvert
*  All rights reserved.
*
*  This software is licensed under the following license (Modified BSD
*  License):
*
*  Redistribution and use in source and binary forms, with or without
*  modification, are permitted provided that the following conditions are
*  met:
*    * Redistributions of source code must retain the above copyright
*      notice, this list of conditions and the following disclaimer.
*    * Redistributions in binary form must reproduce the above copyright
*      notice, this list of conditions and the following disclaimer in the
*      documentation and/or other materials provided with the distribution.
*    * Neither the name of the Universite de Montreal nor the names of its
*      contributors may be used to endorse or promote products derived
*      from this software without specific prior written permission.
*
*  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
*  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
*  TO, THE IMPLIED WARRANTIES OF MERCHApNTABILITY AND FITNESS FOR A
*  PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL UNIVERSITE DE
*  MONTREAL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
*  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
*  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
*  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
*  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
*  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
*  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*****************************************************************************/

//============================================================================
// Page interface code
//============================================================================

/**
Called after page load to initialize needed resources
*/
function init()
{
    // Create a global audio context
    if (this.hasOwnProperty('AudioContext') === true)
    {
        //console.log('Audio context found');
        audioCtx = new AudioContext();
    }
    else if (this.hasOwnProperty('webkitAudioContext') === true)
    {
        //console.log('WebKit audio context found');
        audioCtx = new webkitAudioContext();
    }
    else
    {
        audioCtx = undefined;
    }

    // If an audio context was created
    if (audioCtx !== undefined)
    {
        // Get the sample rate for the audio context
        var sampleRate = audioCtx.sampleRate;

        console.log('Sample rate: ' + audioCtx.sampleRate);

        // Size of the audio generation buffer
        var bufferSize = 2048;
    }
    else
    {
        alert(
            'No Web Audio API support. Sound will be disabled. ' +
            'Try this page in the latest version of Chrome'
        );

        var sampleRate = 44100;
    }

    // Create the global audio graph
    graph = new AudioGraph(sampleRate);

    // Create the global piece
    piece = new Piece(graph);

    // Initialize the synth network
    initSynth();

    // Create an audio generation event handler
    var genAudio = piece.makeHandler();

    // JS audio node to produce audio output
    var jsAudioNode = undefined;

    playAudio = function ()
    {
        // Order the audio graph nodes
        graph.orderNodes();

        // If audio is disabled, stop
        if (audioCtx === undefined)
            return;

        // If the audio isn't stopped, stop it
        if (jsAudioNode !== undefined)
            stopAudio()

        // Set the playback time on the piece to 0 (start)
        piece.setTime(0);

        // Create a JS audio node and connect it to the destination
        jsAudioNode = audioCtx.createJavaScriptNode(bufferSize, 2, 2);
        jsAudioNode.onaudioprocess = genAudio;
	    jsAudioNode.connect(audioCtx.destination);
    }

    stopAudio = function ()
    {
        // If audio is disabled, stop
        if (audioCtx === undefined)
            return;

        if (jsAudioNode === undefined)
            return;

        // Notify the piece that we are stopping playback
        piece.stop();

        // Disconnect the audio node
        jsAudioNode.disconnect();
        jsAudioNode = undefined;
    }


    // TODO: temporary
    playAudio();


}

// Attach the init function to the load event
if (window.addEventListener)
    window.addEventListener('load', init, false); 
else if (document.addEventListener)
    document.addEventListener('load', init, false); 
else if (window.attachEvent)
    window.attachEvent('onload', init); 

// Create an alias of the eval function so as to
// evaluate code in the global context
var globalEval = eval;

/**
Initialize the basic synthesizer configuration
*/
function initSynth()
{  
    // Sound output node
    var outNode = graph.addNode(new OutNode(2));

    // Drum kit instrument
    drumKit = addNode(new SampleKit());

    // Synth piano
    var piano = addNode(new VAnalog(2));
    piano.name = 'piano';
    piano.oscs[0].type = 'sawtooth';
    piano.oscs[0].detune = 0;
    piano.oscs[0].volume = 0.75;

    piano.oscs[0].env.a = 0;
    piano.oscs[0].env.d = 0.67;
    piano.oscs[0].env.s = 0.25;
    piano.oscs[0].env.r = 0.50;
    
    piano.oscs[1].type = 'pulse';
    piano.oscs[1].duty = 0.15;
    piano.oscs[1].detune = 1400;
    piano.oscs[1].volume = 1;

    piano.oscs[1].sync = true;
    piano.oscs[1].syncDetune = 0;

    piano.oscs[1].env = piano.oscs[0].env;
    
    piano.cutoff = 0.1;
    piano.resonance = 0;
    
    piano.filterEnv.a = 0;
    piano.filterEnv.d = 5.22;
    piano.filterEnv.s = 0;
    piano.filterEnv.r = 5;
    piano.filterEnvAmt = 0.75;

    // Bass patch
    bass = addNode(new VAnalog(3));
    bass.name = 'bass';

    bass.oscs[0].type = 'pulse';
    bass.oscs[0].duty = 0.5;
    bass.oscs[0].detune = -1195;
    bass.oscs[0].volume = 1;

    bass.oscs[1].type = 'pulse';
    bass.oscs[1].duty = 0.5;
    bass.oscs[1].detune = -1205;
    bass.oscs[1].volume = 1;

    bass.oscs[2].type = 'sawtooth';
    bass.oscs[2].detune = 0;
    bass.oscs[2].volume = 1;

    bass.oscs[0].env.a = 0;
    bass.oscs[0].env.d = 0.3;
    bass.oscs[0].env.s = 0.1;
    bass.oscs[0].env.r = 0.2;

    bass.oscs[1].env = bass.oscs[0].env;
    bass.oscs[2].env = bass.oscs[0].env;

    bass.cutoff = 0.3;
    bass.resonance = 0;
   
    bass.filterEnv.a = 0;
    bass.filterEnv.d = 0.25;
    bass.filterEnv.s = 0.25;
    bass.filterEnv.r = 0.25;
    bass.filterEnvAmt = 0.85;

    // Lead patch
    lead = addNode(new VAnalog(2));
    lead.name = 'lead';

    lead.oscs[0].type = 'pulse';
    lead.oscs[0].duty = 0.5;
    lead.oscs[0].detune = -1195;
    lead.oscs[0].volume = 1;

    lead.oscs[1].type = 'pulse';
    lead.oscs[1].duty = 0.5;
    lead.oscs[1].detune = -1205;
    lead.oscs[1].volume = 1;

    lead.oscs[0].env.a = 0;
    lead.oscs[0].env.d = 0.1;
    lead.oscs[0].env.s = 0;
    lead.oscs[0].env.r = 0;

    lead.oscs[1].env = lead.oscs[0].env;

    lead.cutoff = 0.3;
    lead.resonance = 0;
   
    lead.filterEnv.a = 0;
    lead.filterEnv.d = 0.2;
    lead.filterEnv.s = 0;
    lead.filterEnv.r = 0;
    lead.filterEnvAmt = 0.85;

    // Mixer with 32 channels
    mixer = addNode(new Mixer(32));
    mixer.inVolume[0] = 1.5;
    mixer.inVolume[1] = 0.2;
    mixer.inVolume[2] = 0.5;
    mixer.inVolume[3] = 0.5;
    mixer.outVolume = 0.7;

    // Connect all synth nodes and topologically order them
    drumKit.output.connect(mixer.input0);
    piano.output.connect(mixer.input1);
    bass.output.connect(mixer.input2);
    lead.output.connect(mixer.input3);
    mixer.output.connect(outNode.signal);

    // Default piece configuration
    piece.beatsPerMin = 137;
    piece.beatsPerBar = 4;
    piece.noteVal = 4;

    // Create tracks for the instruments
    drumTrack = newTrack(drumKit);
    pianoTrack = newTrack(piano);
    bassTrack = newTrack(bass);
    leadTrack = newTrack(lead);

    // Load all the drum samples available
    var noteNo = 0;
    for (var i = 0; i < sampleList.length; ++i)
    {
        var path = sampleList[i];

        console.log(path);

        if (path.indexOf('/drum') != -1)
            drumKit.mapSample(noteNo++, path, 1);

        // TODO: temporary, demo the notes
        //piece.makeNote(drumTrack, 2 * noteNo, noteNo-1);
    }

    /*
    drumKit.mapSample('C4', 'samples/drum/biab_trance_kick_4.wav', 2.2);
    drumKit.mapSample('C#4', 'samples/drum/biab_trance_snare_2.wav', 2);
    drumKit.mapSample('D4', 'samples/drum/biab_trance_hat_6.wav', 2);
    drumKit.mapSample('D#4', 'samples/drum/biab_trance_clap_2.wav', 3);
    */



    
    piece.makeNote(pianoTrack, 0, 'C4');
    piece.makeNote(pianoTrack, 1, 'D4');
    piece.makeNote(pianoTrack, 2, 'E4');
    


    /*
    makeNote(bassTrack, 0, 'C3');
    makeNote(bassTrack, 1, 'C2');
    makeNote(bassTrack, 2, 'C2');
    makeNote(bassTrack, 3, 'C2');
    makeNote(bassTrack, 4, 'C2');

    makeNote(bassTrack, 5, 'B1');
    makeNote(bassTrack, 6, 'B1');
    makeNote(bassTrack, 7, 'B1');
    makeNote(bassTrack, 8, 'B1');
    makeNote(bassTrack, 9, 'B2');
    */



}

