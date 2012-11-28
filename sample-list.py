#!/usr/bin/env python

import wave
import struct
import os

sampleDir = 'app/samples'
outFile = 'app/scripts/sample-list.js'

def main():

    sampleList = []

    for dirname, dirnames, filenames in os.walk(sampleDir):
        for filename in filenames:

            fname = os.path.join(dirname, filename)
            
            print(fname)

            sampleList.append(fname)

    print('num samples: ' + str(len(sampleList)))

    ofile = open(outFile, 'w')

    ofile.write('sampleList = [\n')

    for fname in sampleList:
        ofile.write('"' + fname + '",\n');

    ofile.write('];\n')

    ofile.close()

main()
