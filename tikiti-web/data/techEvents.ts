export interface TechEvent {
  id: string;
  category: string;
  name: string;
  short: string;
  label: string;
  photo: number;
  date: string;
  dateShort: string;
  time: string;
  venue: string;
  tag: string;
  intro: string;
  about: string;
  audience: string;
  price: number;
  agenda?: [string, string, string][];
}

export const techEvents: TechEvent[] = [
  {
    id: 'builders-summit',
    category: 'Conferences',
    name: 'Future Builders Summit',
    short: 'FUTURE\nBUILDERS.',
    label: 'CONFERENCE · ACCRA',
    photo: 1,
    date: 'Saturday, 14 November 2026',
    dateShort: '14 NOV',
    time: '9:00 AM – 5:00 PM GMT',
    venue: 'Accra · venue to be announced',
    tag: 'AI / PRODUCT / ENGINEERING',
    intro: 'A day for the people building what comes next.',
    about: 'Get closer to the ideas, tools, and people shaping technology in Africa. Join practical conversations on AI, product, and engineering — then meet the builders turning those ideas into working products.',
    audience: 'For engineers, designers, founders, and anyone curious about what we can build together.',
    price: 180,
    agenda: [
      ['09:00', 'Doors open & coffee', 'Meet your fellow builders before the first session.'],
      ['10:00', 'Building AI that works', 'A keynote on taking useful AI from prototype to product.'],
      ['11:30', 'From insight to shipped product', 'A conversation across design, engineering, and product.'],
      ['13:00', 'Lunch & new connections', 'Make time for the people in the room.'],
      ['14:00', 'Build, test, learn', 'Small-group sessions and live product demos.'],
      ['16:00', 'The next chapter', 'Open discussion, closing remarks, and networking.'],
    ],
  },
  {
    id: 'ai-build-lab',
    category: 'Workshops',
    name: 'AI Build Lab',
    short: 'LESS TALK.\nMORE BUILD.',
    label: 'HANDS-ON WORKSHOP',
    photo: 2,
    date: 'Saturday, 21 November 2026',
    dateShort: '21 NOV',
    time: '10:00 AM – 2:00 PM GMT',
    venue: 'Accra · venue to be announced',
    tag: 'AI / HANDS-ON / LEARNING',
    intro: 'Bring your laptop. Leave with something working.',
    about: 'Work through a small AI project with other curious builders. Move from an idea to a tested prototype, with space to ask questions and share what you learn.',
    audience: 'For developers and curious makers with basic coding experience. Bring a laptop.',
    price: 120,
    agenda: [
      ['10:00', 'Welcome & setup', 'Get your tools ready.'],
      ['10:30', 'Build your first workflow', 'A guided, hands-on session.'],
      ['12:00', 'Break & compare notes', 'Share what is working.'],
      ['12:30', 'Test and improve', 'Refine your prototype with feedback.'],
      ['13:30', 'Show your work', 'Short demos and next steps.'],
    ],
  },
  {
    id: 'product-people',
    category: 'Meetups',
    name: 'Product People Accra',
    short: 'GOOD IDEAS.\nGREAT PEOPLE.',
    label: 'PRODUCT & DESIGN MEETUP',
    photo: 3,
    date: 'Thursday, 26 November 2026',
    dateShort: '26 NOV',
    time: '6:00 PM – 8:30 PM GMT',
    venue: 'Accra · venue to be announced',
    tag: 'PRODUCT / DESIGN / COMMUNITY',
    intro: 'Meet the people asking better product questions.',
    about: 'An informal meetup for people who care about building useful products. Hear short stories from the work, exchange perspectives, and make a few new connections.',
    audience: 'For product managers, designers, researchers, and engineers. All experience levels welcome.',
    price: 0,
    agenda: [
      ['18:00', 'Arrive & say hello', 'Settle in and meet the community.'],
      ['18:30', 'Lessons from the work', 'Short talks and honest conversations.'],
      ['19:15', 'Ask the room', 'Bring a question you are working through.'],
      ['20:00', 'Keep the conversation going', 'Open networking.'],
    ],
  },
  {
    id: 'founder-exchange',
    category: 'Startups',
    name: 'The Founder Exchange',
    short: 'START SMALL.\nTHINK BIG.',
    label: 'FOUNDERS & STARTUPS',
    photo: 3,
    date: 'Friday, 4 December 2026',
    dateShort: '04 DEC',
    time: '2:00 PM – 6:00 PM GMT',
    venue: 'Accra · venue to be announced',
    tag: 'FOUNDERS / STARTUPS / IDEAS',
    intro: 'Honest conversations about starting something.',
    about: 'A focused afternoon for early-stage founders to exchange practical lessons about customers, teams, and getting a first product into the world.',
    audience: 'For founders, aspiring founders, and early startup teams.',
    price: 100,
    agenda: [
      ['14:00', 'Welcome & introductions', 'Meet the room.'],
      ['14:45', 'Finding your first customers', 'Practical lessons from early-stage building.'],
      ['16:00', 'Founder roundtables', 'Discuss your current challenge.'],
      ['17:00', 'Open connections', 'Keep the useful conversations going.'],
    ],
  },
  {
    id: 'creative-code',
    category: 'Community',
    name: 'Creative Code Social',
    short: 'MAKE THINGS.\nMEET PEOPLE.',
    label: 'CREATIVE TECH COMMUNITY',
    photo: 2,
    date: 'Saturday, 12 December 2026',
    dateShort: '12 DEC',
    time: '1:00 PM – 5:00 PM GMT',
    venue: 'Accra · venue to be announced',
    tag: 'CREATIVITY / CODE / CONNECTION',
    intro: 'A space for experiments and the people behind them.',
    about: 'Bring a side project, a fresh idea, or just your curiosity. Spend an afternoon sharing creative experiments and exploring where design and technology meet.',
    audience: 'Open to creative technologists, designers, developers, and first-time explorers.',
    price: 0,
    agenda: [
      ['13:00', 'Welcome to the community', 'Find a seat and meet someone new.'],
      ['14:00', 'Show & tell', 'Share an experiment or work in progress.'],
      ['15:00', 'Make together', 'An open creative session.'],
      ['16:30', 'Wrap-up & connections', 'Share what you made.'],
    ],
  },
];
