import { Segment, SegmentStep } from "src/app/util/segment";
import { sound, SoundKey } from "src/app/util/sound";

export class SegmentReader {
  private voice: SpeechSynthesisVoice | undefined;
  
  // view model
  segments: Segment[] = [];
  segmentNo = 0;
  stepNo = 0;

  utterance?: SpeechSynthesisUtterance;
  
  nextOne(speed: number) {
    window.speechSynthesis.cancel();

    if (this.stepNo + 1 < this.segments[this.segmentNo].steps.length) {
      sound.play(SoundKey.STEP);
      this.stepNo++;
      this.readStep(speed, false);
    } else if (this.segmentNo + 1 < this.segments.length) {
      sound.play(SoundKey.SEGMENT);
      sound.play(SoundKey.STEP);
      this.segmentNo++;
      this.stepNo = 0;
      this.readStep(speed, true);
    } else {
      this.readText('The end.');
    }
  }
  
  previousOne(speed: number) {
    window.speechSynthesis.cancel();

    if (this.stepNo > 0) {
      sound.play(SoundKey.BACK);
      this.stepNo--;
      this.readStep(speed, false);
    } else if (this.segmentNo > 0) {
      sound.play(SoundKey.SEGMENT);
      sound.play(SoundKey.BACK);
      this.segmentNo--;
      this.stepNo = this.segments[this.segmentNo].steps.length - 1;
      this.readStep(speed, true);
    } else {
      this.readText('No.');
    }
  }

  repeatIt(speed: number) {
    sound.play(SoundKey.REPEAT);
    this.readStep(speed, false);
  }

  readStep(speed: number, readSegment: boolean) {
    const segment = this.segments[this.segmentNo];
    const step = segment.steps[this.stepNo];
    const text = (readSegment ? segment.name + '. ' : '') + step.text;
    this.readText(text, speed, !!step.note);
  }

  private readText(text: string, speed=1, commentBell = false) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    if (this.voice) {
      utterance.voice = this.voice;
    }
    this.utterance = utterance; // workaround due to garbage collection related bug
    
    if (commentBell) {
      utterance.onend = e => sound.play(SoundKey.COMMENT);
    }
    speechSynthesis.speak(utterance);
  }

  nextSegment() {
    if (this.segmentNo + 1 < this.segments.length) {
      this.stepNo = this.segments[this.segmentNo].steps.length;
      this.nextOne(1);
    } else {
      this.readText('No.');
    }
  }

  previousSegment() {
    if (this.segmentNo > 0) {
      this.stepNo = 0;
      this.previousOne(1);
    } else {
      this.readText('No.');
    }
  }

  restartSegment() {
    sound.play(SoundKey.REPEAT);
    sound.play(SoundKey.SEGMENT);
    this.stepNo = 0;
    this.readStep(1, true);
  }

  restart() {
    sound.play(SoundKey.REPEAT);
    sound.play(SoundKey.SEGMENT);
    this.segmentNo = 0;
    this.stepNo = 0;
    this.readStep(1, true);
  }

  readNote() {
    const segment = this.segments[this.segmentNo];
    const step = segment.steps[this.stepNo];
    if (step.note) {
      sound.play(SoundKey.COMMENT);
      this.readText(step.note);
    }
  }

  /**
   * # comment
   * > segment name
   * * step
   * 
   */
  private parse(data: string) {
    const lines = data.split('\n').map(line => line.trim()); // data.split(/\n\s*\n/);

    this.segments = [];
    let segment!: Segment;
    let step!: SegmentStep;
    for (const line of lines) {
      if (line.length == 0) {
        // ignore empty lines
      } else if (line.startsWith('#')) {
        // ignore comment lines
      } else if (line.startsWith('> ')) {
        if (segment && segment.steps.length == 0) {
          console.error('Empty segment: ' + segment.name);
        }

        segment = {
          name: line.substring(2),
          steps: [],
        };
        this.segments.push(segment);
      } else if (line.startsWith('* ')) {
        if (step && !step.text) {
          console.error('Empty step: ' + line);
        } else if (step && step.note) {
          console.error('Multiple comments on a step: ' + line);
        }
        
        if (step) {
          step.note = line.substring(2);
        } else {
          console.error('Comment outside of a step: ' + line);
        }
      } else {
        if (!segment) {
          console.error('Step without declaring a segment first: ' + line);
        } else {
          step = {
            text: line,
          };
          segment.steps.push(step);
        }
      }
    }

    console.log(this.segments);

    this.reset();
  }

  reset() {
    this.segmentNo = 0;
    this.stepNo = 0;
  }

  setVoice(voice: SpeechSynthesisVoice) {
    if (voice) {
      this.voice = voice;
    }
  }

  setSegmentText(segmentText: string) {
    this.parse(segmentText);

    this.segmentNo = Math.max(0, this.segmentNo);
    this.stepNo = Math.max(0, this.stepNo);
  }
}
