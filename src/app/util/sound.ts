import { Howl } from "howler";

export interface Sound {
  url: string;
  howl?: Howl;
}

export enum SoundKey {
  STEP = 'step',
  ERROR = 'error',
  SEGMENT = 'segment',
  BACK = 'back',
  COMMENT = 'comment',
  REPEAT = 'repeat',
}

class SoundUtil {
  sounds: Record<SoundKey, Sound> = {
    step: { url: 'step.mp3' },
    error: { url: 'error.mp3' },
    segment: { url: 'segment.mp3' },
    back: { url: 'back.mp3' },
    comment: { url: 'comment.mp3' },
    repeat: { url: 'repeat.mp3' },
  };
  // soundsTypeCheck: ({[key: string]: Sound}) = this.sounds;  

  constructor() {
    Object.values(this.sounds).forEach(sound => sound.howl = new Howl({ src: 'assets/snd/' + sound.url }));
  }

  play(key: SoundKey) {
    this.sounds[key].howl!.play();
  }
}

export const sound = new SoundUtil();
