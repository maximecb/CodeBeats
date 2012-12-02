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
// Audio graph core
//============================================================================

/**
Buffer size used by the audio graph
*/
var AUDIO_BUF_SIZE = 256;

/**
Buffer containing only zero data
*/
var AUDIO_ZERO_BUF = new Float64Array(AUDIO_BUF_SIZE);

/**
@class Audio node output
*/
function AudioOutput(node, name, numChans)
{
    assert (
        node[name] === undefined,
        'node already has property with this name'
    );

    // By default, one output channel
    if (numChans === undefined)
        numChans = 1;

    /**
    Parent audio node
    */
    this.node = node;

    /**
    Output name
    */
    this.name = name;

    /**
    Number of output channels
    */
    this.numChans = numChans;

    /**
    Output buffers, one per channel
    */
    this.buffers = new Array(numChans);

    /**
    Flag to indicate output was produced in the current iteration
    */
    this.hasData = false;

    /**
    Connected destination nodes
    */
    this.dsts = [];

    // Allocate the output buffers
    for (var i = 0; i < numChans; ++i)
        this.buffers[i] = new Float64Array(AUDIO_BUF_SIZE);

    // Create a field in the parent node for this output
    node[name] = this;
}

/**
Get the buffer for a given channel
*/
AudioOutput.prototype.getBuffer = function (chanIdx)
{
    assert (
        !(chanIdx === undefined && this.numChans > 1),
        'channel idx must be specified when more than 1 channel'
    );

    if (chanIdx === undefined)
        chanIdx = 0;

    // Mark this output as having data
    this.hasData = true;

    return this.buffers[chanIdx];
}

/**
Connect to an audio input
*/
AudioOutput.prototype.connect = function (dst)
{
    assert (
        dst instanceof AudioInput,
        'invalid dst'
    );

    assert (
        this.dsts.indexOf(dst) === -1,
        'already connected to input'
    );

    assert (
        dst.src === undefined,
        'dst already connected to an output'
    );

    assert (
        this.numChans === dst.numChans || 
        this.numChans === 1,
        'mismatch in the channel count'
    );

    //console.log('connecting');

    this.dsts.push(dst);
    dst.src = this;
}

/**
@class Audio node input
*/
function AudioInput(node, name, numChans)
{
    assert (
        node[name] === undefined,
        'node already has property with this name'
    );

    this.node = node;

    this.name = name;

    this.numChans = numChans;

    this.src = undefined;

    node[name] = this;
}

/**
Test if data is available
*/
AudioInput.prototype.hasData = function ()
{
    if (this.src === undefined)
        return false;

    return this.src.hasData;
}

/**
Get the buffer for a given channel
*/
AudioInput.prototype.getBuffer = function (chanIdx)
{
    assert (
        this.src instanceof AudioOutput,
        'audio input not connected to any output'
    );

    assert (
        !(chanIdx === undefined && this.numChans > 1),
        'channel idx must be specified when more than 1 channel'
    );

    assert (
        chanIdx < this.src.numChans || this.src.numChans === 1,
        'invalid chan idx: ' + chanIdx
    );

    // If the source has no data, return the zero buffer
    if (this.src.hasData === false)
        return AUDIO_ZERO_BUF;

    if (chanIdx === undefined)
        chanIdx = 0;

    if (chanIdx >= this.src.numChans)
        chanIdx = 0;

    return this.src.buffers[chanIdx];
}

/**
@class Audio graph node
*/
function AudioNode()
{
    /**
    Node name
    */
    this.name = '';
}

/**
Process an event
*/
AudioNode.prototype.processEvent = function (evt, time)
{
    // By default, do nothing
}

/**
Update the outputs based on the inputs
*/
AudioNode.prototype.update = function (time, sampleRate)
{
    // By default, do nothing
}

/**
Audio synthesis graph
*/
function AudioGraph(sampleRate)
{
    console.log('Creating audio graph');

    assert (
        isPosInt(sampleRate),
        'invalid sample rate'
    );

    /**
    Sample rate
    */
    this.sampleRate = sampleRate;

    /**
    List of nodes
    */
    this.nodes = [];

    /**
    Output node
    */
    this.outNode = null;

    /**
    Topological ordering of nodes
    */
    this.order = undefined;
}

/**
Add a node to the graph
*/
AudioGraph.prototype.addNode = function (node)
{
    assert (
        this.nodes.indexOf(node) === -1,
        'node already in graph'
    );

    assert (
        !(node instanceof OutNode && this.outNode !== null),
        'output node already in graph'
    );

    if (node instanceof OutNode)
        this.outNode = node;

    // Add the node to the graph
    this.nodes.push(node);

    // Invalidate any existing node ordering
    this.order = undefined;

    return node;
}

/**
Produce a topological ordering of the nodes
*/
AudioGraph.prototype.orderNodes = function ()
{
    console.log('Computing node ordering');

    // Set of nodes with no outgoing edges
    var S = [];

    // List sorted in reverse topological order
    var L = [];

    // Total count of input edges
    var numEdges = 0;

    // For each graph node
    for (var i = 0; i < this.nodes.length; ++i)
    {
        var node = this.nodes[i];

        //console.log('Graph node: ' + node.name);

        // List of input edges for this node
        node.inEdges = [];

        // Collect all inputs for this node
        for (k in node)
        {
            if (node[k] instanceof AudioInput)
            {
                var audioIn = node[k];

                //console.log('Input port: ' + audioIn.name);
                //console.log(audioIn.src);

                if (audioIn.src instanceof AudioOutput)
                {
                    //console.log(node.name + ': ' + audioIn.name);

                    node.inEdges.push(audioIn.src);
                    ++numEdges;
                }
            }
        }

        // If this node has no input edges, add it to S
        if (node.inEdges.length === 0)
            S.push(node);
    }

    console.log('Num edges: ' + numEdges);
    console.log('Num nodes: ' + this.nodes.length);

    // While S not empty
    while (S.length > 0)
    {
        var node = S.pop();

        console.log('Graph node: ' + node.name);

        L.push(node);

        // For each output port of this node
        for (k in node)
        {
            if (node[k] instanceof AudioOutput)
            {
                var audioOut = node[k];

                // For each destination of this port
                for (var i = 0; i < audioOut.dsts.length; ++i)
                {
                    var dstIn = audioOut.dsts[i];
                    var dstNode = dstIn.node;

                    //console.log('dst: ' + dstNode.name);

                    var idx = dstNode.inEdges.indexOf(audioOut);

                    assert (
                        idx !== -1,
                        'input port not found'
                    );

                    // Remove this edge
                    dstNode.inEdges.splice(idx, 1);
                    numEdges--;

                    // If this node now has no input edges, add it to S
                    if (dstNode.inEdges.length === 0)
                        S.push(dstNode);
                }
            }
        }
    }

    assert (
        numEdges === 0,
        'cycle in graph'
    );

    assert (
        L.length === this.nodes.length,
        'invalid ordering length'
    );

    console.log('Ordering computed');

    // Store the ordering
    this.order = L;
}

/**
Generate audio for each output channel.
@returns An array of audio samples (one per channel).
*/
AudioGraph.prototype.genOutput = function (time)
{
    assert (
        this.order instanceof Array,
        'node ordering not found'
    );

    assert (
        this.outNode instanceof AudioNode,
        'genSample: output node not found'
    );

    // For each node in the order
    for (var i = 0; i < this.order.length; ++i)
    {
        var node = this.order[i];

        // Reset the outputs for this node
        for (k in node)
            if (node[k] instanceof AudioOutput)
                node[k].hasData = false;

        // Update this node
        node.update(time, this.sampleRate);
    }

    // Return the output node
    return this.outNode;
}

//============================================================================
// Output node
//============================================================================

/**
@class Output node
@extends AudioNode
*/
function OutNode(numChans)
{
    if (numChans === undefined)
        numChans = 2;

    /**
    Number of output channels
    */
    this.numChans = numChans;

    // Audio input signal
    new AudioInput(this, 'signal', numChans);

    this.name = 'output';
}
OutNode.prototype = new AudioNode();

/**
Get the buffer for a given output channel
*/
OutNode.prototype.getBuffer = function (chanIdx)
{
    return this.signal.getBuffer(chanIdx);
}

