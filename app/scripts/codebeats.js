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

function initAudio()
{
    // Create a global audio context
    if (window.hasOwnProperty('AudioContext') === true)
    {
        //console.log('Audio context found');
        audioCtx = new AudioContext();
    }
    else if (window.hasOwnProperty('webkitAudioContext') === true)
    {
        //console.log('WebKit audio context found');
        audioCtx = new webkitAudioContext();
    }
    else
    {
        audioCtx = undefined;
    }

    // If no audio context was created
    if (audioCtx === undefined)
    {
        error(
            'No Web Audio API support. Sound will be disabled. ' +
            'Try this page in the latest version of Chrome'
        );
    }

    // Get the sample rate for the audio context
    var sampleRate = audioCtx.sampleRate;

    console.log('Sample rate: ' + audioCtx.sampleRate);

    // Size of the audio generation buffer
    var bufferSize = 2048;

    // JS audio node to produce audio output
    var jsAudioNode = undefined;

    // Environment in which code is evaluated
    var audioEnv = undefined;

    // Sound generation handler
    var genAudio = undefined;

    // Current playback state: playing, stopped or paused
    var playState = 'STOPPED';

    function reset()
    {
        // Initialize the audio code environment
        audioEnv = initAudioEnv();

        // Create an audio generation event handler
        genAudio = audioEnv.piece.makeHandler();
    }

    // Setup the initial audio environment
    reset();

    playAudio = function (codeStr)
    {
        console.log('entering playAudio');

        // If audio is disabled, stop
        if (audioCtx === undefined)
            return;

        if (playState === 'PAUSED')
        {
            pauseAudio();
        }

        else
        {
            // If the audio isn't stopped, stop it
            if (playState !== 'STOPPED')
                stopAudio()

            // Evaluate the audio code
            evalAudioCode(codeStr, audioEnv);

            // Set the playback time on the piece to 0 (start)
            audioEnv.piece.setTime(0);

            // Create a JS audio node and connect it to the destination
            jsAudioNode = audioCtx.createJavaScriptNode(bufferSize, 2, 2);
            jsAudioNode.onaudioprocess = genAudio;
	        jsAudioNode.connect(audioCtx.destination);

            playState = 'PLAYING';
        }
    }

    pauseAudio = function()
    {
        // If audio is disabled, stop
        if (audioCtx === undefined)
            return;

        if (playState === 'PLAYING')
        {
            // Disconnect the audio node
            jsAudioNode.disconnect();

            playState = 'PAUSED';
        }

        else if (playState === 'PAUSED')
        {
    	    jsAudioNode.connect(audioCtx.destination);
            playState = 'PLAYING';
        }
    }

    stopAudio = function ()
    {
        // If audio is disabled, stop
        if (audioCtx === undefined)
            return;

        if (playState === 'STOPPED')
            return;

        // Notify the piece that we are stopping playback
        audioEnv.piece.stop();

        // Disconnect the audio node
        jsAudioNode.disconnect();
        jsAudioNode = undefined;

        // Reset the audio environment
        reset();

        playState = 'STOPPED';
    }
}

// Register the audio init function
$(initAudio);

/**
Initialize the basic audio code environment
*/
function initAudioEnv()
{
    // Create the audio graph
    var graph = new AudioGraph(audioCtx.sampleRate);

    // Create a stereo sound output node
    var outNode = new OutNode(2);
    graph.setOutNode(outNode);

    // Create the piece
    var piece = new Piece(graph);

    // Default piece configuration
    piece.beatsPerMin = 137;
    piece.beatsPerBar = 4;
    piece.noteVal = 4;

    // Drum kit instrument
    var drumKit = new SampleKit();

    // Synth piano
    var piano = new VAnalog(2);
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
    var bass = new VAnalog(3);
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
    var lead = new VAnalog(2);
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
    mixer = new Mixer(32);
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

    // Create new tracks for the instruments
    drumTrack = piece.addTrack(new Track(drumKit));
    pianoTrack = piece.addTrack(new Track(piano));
    bassTrack = piece.addTrack(new Track(bass));
    leadTrack = piece.addTrack(new Track(lead));

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

    var audioEnv =  {
        graph: graph,
        piece: piece,
        drumKit: drumKit,
        piano: piano,
        lead: lead,
        bass: bass
    };

    audioEnv.newTrack = function (instr)
    {
        return piece.addTrack(new Track(instr));
    }

    audioEnv.makeNote = function (track, beatNo, note, len, vel)
    {
        return piece.makeNote(track, beatNo, note, len, vel);
    }

    audioEnv.makeNotes = function (track, beatNo, notes, len, vel)
    {
        if (typeof notes === 'string')
        {
            notes = notes.split(',').map(function (n) { 
                n = n.trim();
                if (n === '')
                    return undefined;
                else
                    return Note(n); 
            });
        }

        for (var i = 0; i < notes.length; ++i)
        {
            var note = notes[i];
            if (note instanceof Note)
                piece.makeNote(track, beatNo, note, len, vel);
            beatNo += 1;
        }

        return beatNo;
    }

    return audioEnv;
}

/**
Eval and run the audio code
*/
function evalAudioCode(codeStr, audioEnv)
{  
    // Evaluate the code string in the audio environment
    with (audioEnv)
    {
        eval(codeStr);
    }    

    // Order the audio graph nodes
    audioEnv.graph.orderNodes();
}

