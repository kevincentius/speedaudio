import { Component, NgZone, OnInit } from '@angular/core';
import { SegmentReader } from 'src/app/util/segment-reader';
import { SpeechGrammarList, SpeechRecognition, SpeechRecognitionEvent } from 'src/app/util/speech-util';

const normalSpeed = 1;
const slowSpeed = 0.6;

@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.scss']
})
export class RunComponent implements OnInit {
  voices: SpeechSynthesisVoice[] = [];
  voice: SpeechSynthesisVoice | undefined;
  
  results: SpeechRecognitionAlternative[] = []

  reader = new SegmentReader();

  segmentText = '';

  unsavedChanges = false;

  onSegmentTextChange() {
    console.log('change', this.segmentText);
    this.unsavedChanges = true;
  }

  saveSegmentText() {
    localStorage.setItem('segmentText', this.segmentText);
    this.reader.setSegmentText(this.segmentText);
    this.unsavedChanges = false;
  }

  constructor(
    private ngZone: NgZone,
  ) { }

  ngOnInit(): void {
    this.segmentText = localStorage.getItem('segmentText') ?? ``;
    this.reader.setSegmentText(this.segmentText);
    
    var timer = setInterval(() => {
      this.voices = speechSynthesis.getVoices();
      console.log(this.voices);
      if (this.voices.length !== 0) {
        let msg = new SpeechSynthesisUtterance();
        msg.voice = this.voices[0];
        speechSynthesis.speak(msg);
        msg.lang = 'en-US';
        clearInterval(timer);

        this.voice = this.voices.find(v => v.voiceURI == 'Microsoft Zira - English (United States)')!;
        this.voice = this.voices.find(v => v.voiceURI == 'Google US English')!;
        if (this.voice) {
          this.onVoiceChange(this.voice);
        }
      }
  }, 200);
    const colors = [ 'aqua', 'azure', 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', /* … */ ];
    const grammar = `#JSGF V1.0; grammar colors; public <color> = ${colors.join(' | ')};`

    const recognition = new SpeechRecognition();
    const speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);

    recognition.grammars = speechRecognitionList;
    recognition.continuous = true;
    recognition.lang = 'en-US';
    // recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 10;
    recognition.start();

    recognition.onresult = (event: any) => {
      console.log('onresult!', event);
      const result: SpeechRecognitionResultList = event.results;

      this.ngZone.run(() => {
        this.results = [];
        let r = result[result.length - 1];
        for (let i = 0; i < r.length; i++) {
          this.results.push(r[i]);
        }
        
        for (let i = 0; i < 3 && i < result[result.length - 1].length; i++) {
          let skipBreak = false;
          const transcript = result[result.length - 1][i].transcript.toLowerCase().trim();
          
          // next one [slow] [please]
          // repeat [it] [slow] [again] [please]
          // (previous | go back) one [slow] [please]
          // next segment [please]
          // (previous | go back one) segment [please]
          // restart segment [please]
          // 

          if (this.oneOf(transcript, 'next one', 'next one please')) {
            this.reader.nextOne(normalSpeed);
          } else if (this.oneOf(transcript, 'next one slow', 'next one slow please')) {
            this.reader.nextOne(slowSpeed);
          } else if (this.oneOf(transcript,
            'repeat it', 'repeat it please', 'repeat it again', 'repeat it again please', 'repeat', 'repeat please', 'repeat again', 'repeat again please'
          )) {
            this.reader.repeatIt(normalSpeed);
          } else if (this.oneOf(transcript,
            'repeat it slow', 'repeat it slow please', 'repeat it slow again', 'repeat it slow again please', 'repeat slow', 'repeat slow please', 'repeat slow again', 'repeat slow again please', 'repeat again slow', 'repeat again slow please'
          )) {
            this.reader.repeatIt(slowSpeed);
          } else if (this.oneOf(transcript, 'go back one', 'go back one please', 'previous one', 'previous one please')) {
            this.reader.previousOne(normalSpeed);
          } else if (this.oneOf(transcript, 'go back one slow', 'go back one slow please', 'previous one slow', 'previous one slow please')) {
            this.reader.previousOne(slowSpeed);
          } else if (this.oneOf(transcript,
            'next segment', 'next segment please',
          )) {
            this.reader.nextSegment();
          } else if (this.oneOf(transcript,
            'previous segment', 'previous segment please', 'go back one segment', 'go back one segment please',
          )) {
            this.reader.previousSegment();
          } else if (this.oneOf(transcript,
            'restart segment', 'restart segment please'
          )) {
            this.reader.restartSegment();
          } else if (this.oneOf(transcript,
            'restart from the beginning', 'restart from the beginning please'
          )) {
            this.reader.restart();
          } else if (this.oneOf(transcript,
            'read the note', 'read the note please', 'read the notes', 'read the notes please', 'info', 'info please'
          )) {
            this.reader.readNote();
          } else {
            skipBreak = true;
          }

          if (!skipBreak) {
            break;
          }
        }
      });
    }

    setInterval(() => {
      try {
        recognition.start();
      } catch (e: any) {
        
      }
    }, 500);

    recognition.onerror = (e: any) => {
      console.error('ERROR', e);
    }
    recognition.onend = (e: any) => {
      console.error('END', e);
      recognition.start();
    }
  }

  onVoiceChange(voice: SpeechSynthesisVoice) {
    this.reader.setVoice(voice);
  }

  private oneOf(transcript: string, ...options: string[]) {
    while (transcript.length > 0 && '.!?'.indexOf(transcript[transcript.length - 1]) != -1) {
      transcript = transcript.substring(0, transcript.length - 1);
    }
    return options.indexOf(transcript) != -1;
  }
}
