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

/**
@class Instrument defined using a sampling generating function 
@extends AudioNode
*/
function FnInstr(sampleFn, name)
{
    if (name === undefined)
        name = "fn-instr";

    this.name = name;

    /**
    Sample generating function
    */
    this.sampleFn = sampleFn;

    /**
    Active/on note array
    */
    this.actNotes = [];

    // Sound output
    new AudioOutput(this, 'output');
}
FnInstr.prototype = new AudioNode();

/**
Process an event
*/
FnInstr.prototype.processEvent = function (evt, time)
{
    // Note-on event
    if (evt instanceof NoteOnEvt)
    {
        // Get the note
        var note = evt.note;

        console.log('NOTE ON!');

        // Try to find the note among the active list
        var noteState = undefined;
        for (var i = 0; i < this.actNotes.length; ++i)
        {
            var state = this.actNotes[i];

            if (state.note === note)
            {
                noteState = state;
                break;
            }
        }

        // If the note was not active before
        if (noteState === undefined)
        {
            noteState = {};

            // Note being played
            noteState.note = note;

            // Note velocity
            noteState.vel = evt.vel;

            // Time a note-on was received
            noteState.onTime = time;

            // Time a note-off was received
            noteState.offTime = 0;

            // Add the note to the active list
            this.actNotes.push(noteState);
        }

        // If the note was active before
        else
        {
            // Note velocity
            noteState.vel = evt.vel;

            // Set the on and off times
            noteState.onTime = time;
            noteState.offTime = 0;
        }

        //console.log('on time: ' + noteState.onTime);
    }

    // Note-off event
    else if (evt instanceof NoteOffEvt)
    {
        // Get the note
        var note = evt.note;

        // Try to find the note among the active list
        var noteState = undefined;
        for (var i = 0; i < this.actNotes.length; ++i)
        {
            var state = this.actNotes[i];

            if (state.note === note)
            {
                noteState = state;
                break;
            }
        }

        // If the note is active
        if (noteState !== undefined)
        {
            // Set the note-off time
            noteState.offTime = time;
        }
    }

    // All notes off event
    else if (evt instanceof AllNotesOffEvt)
    {
        this.actNotes = [];
    }

    // By default, do nothing
}

/**
Update the outputs based on the inputs
*/
FnInstr.prototype.update = function (time, sampleRate)
{
    // If there are no active notes, do nothing
    if (this.actNotes.length === 0)
        return;

    // Get the output buffer
    var outBuf = this.output.getBuffer(0);

    // Initialize the output to 0
    for (var i = 0; i < outBuf.length; ++i)
        outBuf[i] = 0;

    // Get the time at the end of the buffer
    var deltaTime = 1 / sampleRate;
    
    // For each active note
    for (var i = 0; i < this.actNotes.length; ++i)
    {
        var noteState = this.actNotes[i];
        var noteFreq = noteState.note.getFreq(0);

        var curTime = time;

        for (var j = 0; j < outBuf.length; ++j)
        {
            var sample = this.sampleFn(noteFreq, curTime, noteState);

            if (sample === false)
            {
                console.log('killing note');
                this.actNotes.splice(i, 1);
                i--;
                break;
            }

            outBuf[j] += sample;

            curTime += deltaTime;
        }
    }
}

