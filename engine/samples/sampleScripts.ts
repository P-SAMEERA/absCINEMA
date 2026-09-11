export interface SampleScript {
  id: string;
  title: string;
  author: string;
  logline: string;
  directorStyle: string;
  script: string;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'the-last-bus',
    title: 'The Last Bus',
    author: 'absCinema Originals',
    logline: 'On a rain-slicked road, a solitary figure waits for what may never arrive.',
    directorStyle: 'noir_cold',
    script: `EXT. BUS STOP — EVENING

Rain falls across the empty road. The amber glow of a distant streetlight flickers on wet tarmac.

RISHI sits alone beneath the corrugated shelter, clutching an unlit cigarette.

RISHI (V.O.)
Maybe some things are better left unsaid.

He turns his head as twin beams of headlights cut through the downpour.

A bus passes. The water spray spatters against the glass partition.

RISHI (CONT'D)
Or maybe I was just waiting for an excuse to stay.

His phone vibrates in his damp coat pocket. A single text message illuminates his face.

CUT TO:

INT. DINER - NIGHT

Fluorescent lights buzz overhead. 

VEDA sits at a corner booth, staring at two untouched cups of black coffee.

VEDA
You took your time.

RISHI (O.S.)
The roads were flooded.

Rishi slides into the opposite vinyl booth, water dripping from his collar.

VEDA
(smiling softly)
You always had an excuse for the weather.

FADE OUT.`,
  },
  {
    id: 'neon-drift',
    title: 'Neon Drift',
    author: 'K. Vance',
    logline: 'An operative negotiates the price of memories in Sector 4.',
    directorStyle: 'cyberpunk_neon',
    script: `EXT. SECTOR 4 ALLEYWAY - NIGHT

Acid rain hisses against the rusted fire escapes. Holographic advertisements cast cyan and magenta pulses onto the drenched pavement.

A hooded figure, KAI, stands beside a humming power conduit.

KAI
Did you bring the drive?

A synthetic voice speaks from the dark shadows behind the dumpster.

OPERATOR (O.S.)
Memories are expensive this century, Kai.

KAI (V.O.)
I only want the ones from before the blackout. The ones that hurt.

Lightning flashes, illuminating the chrome chassis of the OPERATOR.

SMASH CUT:

INT. SERVER VAULT - NIGHT

Silence. Thousands of optic fibres pulse like electric veins.

OPERATOR
Then take them. And forget you ever met me.

DISSOLVE TO:`,
  },
  {
    id: 'silence-at-3am',
    title: 'Silence at 3 AM',
    author: 'A24 Workshop',
    logline: 'In an empty kitchen, thoughts speak louder than words.',
    directorStyle: 'minimal_a24',
    script: `INT. APARTMENT KITCHEN - NIGHT

The faint hum of a refrigerator. A half-empty glass of tap water rests on the laminate counter.

SARAH stands motionless by the window, watching the city sleep.

SARAH (V.O.)
If you sit still enough, you can hear the buildings settling into the earth.

She taps the glass with one fingernail. Once. Twice.

SARAH
(whispering)
Tomorrow is going to be different.

She doesn't move. The silence stretches.

FADE TO BLACK.`,
  },
];
