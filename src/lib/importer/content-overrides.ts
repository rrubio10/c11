import type { ParsedItem, ParsedSet } from "./types";

type ItemOverride = Pick<ParsedItem, "prompt" | "options"> & Partial<Pick<ParsedItem, "baseWord" | "keyword">>;

type SetOverride = {
  instructions: string;
  fullText: string;
  transcriptionStatus?: string;
  items: Record<number, ItemOverride>;
};

const ABCD = ["A", "B", "C", "D"] as const;
const labelled = (prefix: string) => ABCD.map((key) => ({ key, label: `${prefix} ${key}` }));

const test1Part5: SetOverride = {
  instructions:
    "You are going to read an article about anthropomorphism – attributing human characteristics or behaviour to animals. For questions 31–36, choose the answer (A, B, C or D) which you think fits best according to the text.",
  transcriptionStatus: "verified_from_source_scan",
  fullText: `Science correspondent Martha Hamlin looks at whether anthropomorphism – attributing human characteristics or behaviour to animals – is necessarily a bad thing.

One night not long ago, an octopus named Inky hauled himself out of his tank at New Zealand's National Aquarium, heaved himself across the floor and squeezed into a narrow drain leading to the Pacific Ocean. It was a story fit for a children's film, and was widely shared online. Part of the fun of the story and other such tales of escape, involving creatures as diverse as rats and llamas, is indulging in a bit of knowing anthropomorphism: animals, they're just like us! In the case of octopuses, this pleasure is especially pronounced, because the creatures' great intelligence comes packaged in bodies so vastly dissimilar to our own. How is it that eight-tentacled sea creatures can open jars, recognize faces, use coconut shells as portable armor and even exhibit sophisticated play behavior?

Anthropomorphism is often thought of as unscientific, but Dr. Frans de Waal, who studies primates such as gorillas and chimpanzees, argues that it is not in fact anthropomorphizing, but its opposite – an unwillingness to recognize the human-like traits of animals, or what he terms anthropodenial – that has too often characterized our attitudes toward other species. Analysing decades of animal-cognition research, he shows that, with the exception of fully-developed language, animals have been observed exhibiting many of the key behaviors that were thought to distinguish humans from animals: the ability to consider the past and the future, to demonstrate empathy and self-awareness, and to anticipate the motives of others. Animals, in other words, are far smarter than we've been giving them credit for.

Anthropodenial, in de Waal's opinion, is a relatively modern phenomenon. In medieval and early modern Europe, the animal mind was considered sophisticated enough that animals could be put on trial for crimes. And as recently as the nineteenth century, many naturalists sought out the connections between human and animal intelligence. 'The difference in mind between man and the higher animals, great as it is, certainly is one of degree and not of kind,' one nineteenth-century naturalist wrote. And this was no radical supporter of animal rights; it was Charles Darwin, whose theory of evolution changed the way we understand our place in the world.

The advent of behaviorism in the twentieth century, with its emphasis on conditioning animals through reward and punishment, shifted public views of animal intelligence. For most of the twentieth century, the two dominant schools of thought viewed animals as either stimulus-response machines or as robots endowed with useful instincts. It is perhaps no accident that this shift occurred during the same century that saw humans tearing down animal habitats at unprecedented rates, polluting land and water, and developing methods of rearing livestock which ignored the welfare of the animals.

Happily, de Waal believes that we are emerging from this dark period and learning to think of animal cognition as being on the same spectrum, though not necessarily at the same point, as that of humans. 'The times are changing,' he writes. 'Everyone must have noticed the avalanche of knowledge emerging over the last few decades, diffused over the internet.'

The most effective tests of animal intelligence, he argues, are designed with a species' particular traits and skills in mind. Squirrels may fail at human memory tasks, but whereas we need apps to find our misplaced phones, they can remember where they've hidden tiny caches of nuts. In her book The Soul of an Octopus, naturalist Sy Montgomery points out that if an octopus were to measure human intelligence, it might test us on the number of color patterns we can produce on our skin. Seeing us fail the test, it might conclude that we are pretty stupid.

De Waal remains skeptical of Inky's happy ending. He points out that, while captive octopuses have escaped their tanks before, it's probably overly optimistic to think that Inky figured out how to get to a drain leading to the ocean. But de Waal is aware of the power of viral stories to fuel appreciation of animal intelligence. He once ran an experiment to test whether capuchin monkeys can experience envy. When the monkeys were rewarded with either cucumbers (a well-liked monkey food) or grapes (an even better one), those given cucumbers shrieked and raged at seeing their peers get the superior treat. The study was published in a prominent scientific journal soon afterwards. But what really convinced people of the findings was a one-minute video clip of the experiment, released ten years later. Just one of the oddities of our particular kind of animal mind.`,
  items: {
    31: {
      prompt: "What point does the writer make about octopuses in the first paragraph?",
      options: [
        { key: "A", label: "Their playful nature would make them a good subject for a children's film." },
        { key: "B", label: "They are no more likely to be able to escape captivity than any other creature." },
        { key: "C", label: "People still underestimate their intelligence despite what is known about their abilities." },
        { key: "D", label: "Their human-like behaviour surprises people more as they are so unlike humans in appearance." },
      ],
    },
    32: {
      prompt: "In the second paragraph, the writer says that Dr. Frans de Waal",
      options: [
        { key: "A", label: "gave a more accurate name to a changing behaviour." },
        { key: "B", label: "conducted experiments to back up his arguments." },
        { key: "C", label: "came to a conclusion based on existing data." },
        { key: "D", label: "questioned the research of other scientists." },
      ],
    },
    33: {
      prompt: "In the third paragraph, the writer emphasises the fact that",
      options: [
        { key: "A", label: "accepting de Waal's ideas requires people to alter the way they see themselves." },
        { key: "B", label: "human knowledge has progressed considerably since medieval times." },
        { key: "C", label: "putting animals on trial was not universally considered reasonable." },
        { key: "D", label: "de Waal's views are backed up by the work of respected scientists." },
      ],
    },
    34: {
      prompt: "What does 'that' in line 63 refer to?",
      options: [
        { key: "A", label: "dark period" },
        { key: "B", label: "cognition" },
        { key: "C", label: "spectrum" },
        { key: "D", label: "point" },
      ],
    },
    35: {
      prompt: "What is the main idea put forward in the fifth paragraph?",
      options: [
        { key: "A", label: "Even with technology, humans are unable to match animal abilities." },
        { key: "B", label: "Being able to test other species doesn't mean you are superior to them." },
        { key: "C", label: "It is logical to assess a species' intelligence according to its unique abilities." },
        { key: "D", label: "The internet has played a major role in changing people's views of animal intelligence." },
      ],
    },
    36: {
      prompt: "In the last paragraph, the writer thinks it is significant that",
      options: [
        { key: "A", label: "a video has more impact on people than written data." },
        { key: "B", label: "people are interested in whether monkeys can feel envy." },
        { key: "C", label: "de Waal waited ten years to release the video of his experiment." },
        { key: "D", label: "people invent a happy ending if a story doesn't already have one." },
      ],
    },
  },
};

const test1Part6: SetOverride = {
  instructions:
    "You are going to read four extracts from articles in which architects discuss their profession. For questions 37–40, choose from the architects A–D. The architects may be chosen more than once.",
  transcriptionStatus: "verified_from_source_scan",
  fullText: `A
What I love about architecture is that it's the only one of the applied arts that can change how we perceive the world around us. But however much I love buildings, even I recognise that, as much as we may want to, we will not be able to save them all. Buildings are constantly being degraded, attacked by the elements as well as by simple use. In any case, there are plenty of buildings that we wouldn't want to hold on to. Building design is a complex thing, and a space which ultimately doesn't work has never been created that way deliberately. It's just that it's impossible to predict everything before a building is complete. Going forward, there has to be a recognition of what is good for the planet in terms of building design. Our needs are changing rapidly, particularly regarding energy use, and energy efficiency will be a major theme in architecture.

B
Modern life places demands on buildings which are different from those of the past, meaning that not all heritage buildings can or should be kept. Decisions must be made as to which are of most benefit to a community. It's the same with the design of new buildings. Their primary function is to improve the lives of the occupants. What good are stunning aesthetics if someone inside is stifled by heat from a badly placed window? As to creativity, an architect has to design according to the client's brief, so self-expression, such a key factor in the world of art, plays little part. Opinions on the new building will inevitably differ, and thanks to modern technology, these can be shared far more widely and quickly than in the past – often even as a building is under construction. This immediacy of feedback is sure to play a big part in building design over the coming decades.

C
Architecture as a profession grew from the human need for shelter, but buildings have become a form of identity for the culture in which they're located, and their design must revolve around this idea. A well-designed building is a work of art which improves the appearance of the area in which it is placed. In addition, we can, and must, learn from it. How can we create a vibrant environment consisting of exciting and remarkable built forms if we allow the great achievements of the past to crumble away? Even the buildings which might be considered 'bad' still have something to offer. They are a reminder that perfect architecture doesn't exist. Architects don't have the luxury of creating a prototype, unlike, for example, a car designer, so unforeseen mistakes will creep in from time to time.

D
When I look at those buildings which are almost universally criticised, or which clearly don't work for their users, I see the hand of an arrogant architect who believes that their right to self-expression should be given priority over aspects such as local context. I'm not denying for a moment that architecture is an art form, but the primary consideration must always be the user of the building. As architects, we have both the opportunity and the responsibility to create designs in which the experience of the building's inhabitants and others who interact with it will be enriched. While I don't see that changing, other things will come into play over the next few years. As the world's population rises, space and resources are becoming more limited, so inevitably, concerns over increasing global temperatures and greenhouse gas emissions will be reflected more in the buildings we create.`,
  items: {
    37: { prompt: "Which architect has a similar opinion to D regarding future influences on architecture?", options: labelled("Architect") },
    38: { prompt: "Which architect shares an opinion with A on whether architecture should be preserved?", options: labelled("Architect") },
    39: { prompt: "Which architect expresses a different view from the other three on whether architecture is art?", options: labelled("Architect") },
    40: { prompt: "Which architect has a different opinion to B on the most important factor to consider when designing a building?", options: labelled("Architect") },
  },
};

const paragraphOptions = [
  {
    key: "A",
    label:
      "That's why the act of collecting still matters. A recent opinion piece, published in the journal Science, argued that specimen-collecting risked killing off vulnerable species, and should be supplanted by audio recordings, camera-trap images, and non-lethal tissue gathering. It drew a loud response from more than 100 biologists, who argued that none of those strategies beats having an actual specimen.",
  },
  {
    key: "B",
    label:
      "Together, the samples corroborated Hekkala's suspicions: the Nile crocodile was indeed two separate species. The Eastern one has two fewer chromosomes than the Western sacred crocodile. It seems that at one time they co-existed along the full length of the Nile, but today they stick to different parts of Africa. They only share space in museums.",
  },
  {
    key: "C",
    label:
      "Capturing this information about the environment involves a huge amount of work, so Hekkala is trying to create an army of young scientists who are willing to help her with it. 'It's great that people are still keen on going on expeditions,' she says. 'But to be honest we can achieve the same thing by simply looking in the drawers of museums.'",
  },
  {
    key: "D",
    label:
      "It's easy to view the collections kept in such places as soulless stashes, examples of humanity's hoarding instinct unleashed upon the natural world, turning vibrant wildlife into mere specimens, disassembled and dissected, pinned onto boards, crammed into cabinets, and stuffed into jars.",
  },
  {
    key: "E",
    label:
      "Many unclassified species, on the other hand, are still taking up valuable space and gathering dust in jars. The legendary naturalists of yesteryear catalogued life's grand diversity by hopping across continents and islands, but their modern counterparts don't need to put in this much effort.",
  },
  {
    key: "F",
    label:
      "Hekkala stumbled across one of these herself while sequencing DNA from Nile crocodile samples collected all over Africa, in a bid to understand differences between the various populations of this reptile. 'Because I'm a museum geek, I thought: Oh, I can get tons of Nile croc specimens from museum collections,' she says.",
  },
  {
    key: "G",
    label:
      "However, the specimens reveal more to science than the mere identities of their owners. Their sizes and shapes show how bodies adapt; how songbirds become smaller as the climate gets hotter. Their DNA reveals how some endangered species have experienced plummeting levels of diversity, while others have started to regain their lost genetic wealth.",
  },
];

const test1Part7: SetOverride = {
  instructions:
    "You are going to read an extract from a website article about the collections belonging to natural history museums. Six paragraphs have been removed from the article. Choose from paragraphs A–G the one which fits each gap (41–46). There is one extra paragraph which you do not need to use.",
  transcriptionStatus: "verified_from_source_scan",
  fullText: `Tracking them down is a globe-trotting adventure that rivals any jungle expedition.

I recently visited the American Museum of Natural History (AMNH) in New York, in the company of Evon Hekkala, a geneticist at the nearby Fordham University. She is a vocal advocate for natural history museums and the many secrets that remain locked within their drawers and displays.

[[41]]

But to Hekkala and many other scientists, they are full of riches. They are time capsules that contain records of past ecosystems that are rapidly changing or disappearing. They are archives that provide clues about raging epidemics, environmental pollution, and hidden extinctions. And they are full of unknown species.

[[42]]

She found 16 in the AMNH alone, collected almost a century ago, and dozens more from other institutions. From each specimen, she picked off fragments of dried tissue, still rich in viable DNA. She even managed to sequence DNA from seven mummified specimens from a museum in Paris. The mummies are around two thousand years old, but thanks to the Egyptians' skill at preservation, Hekkala found enough to use.

[[43]]

In the AMNH, Hekkala pulls out several drawers containing examples of both to show me. The adjacent shelves are full of other reptilian remains. 'One of my students used these collections to show that there are three species within what we thought of as the Nile monitor lizard,' she says. 'Another student is working on hinged tortoises. I predict that we probably have 100 unrecognized species in these collections, just sitting on the shelves.'

[[44]]

None of this would be possible without advances in modern technology, and in fact every development opens up fresh ways of exploiting these old treasures. Using next-generation sequencing techniques, scientists can extract DNA from the unlikeliest of sources, even animals that have been submerged in embalming liquid. They can pull out isotopes of carbon and nitrogen that reveal what an animal was eating and they can identify pollutants.

[[45]]

And by discovering entirely new species in this way, as with the Western sacred crocodile, it is possible to create plans to protect them. 'There's been tons of oil exploration in the sacred crocodile's range in West Africa,' says Hekkala. 'But now we know it's there, we can try to get protections put in place. We can still hold on to it if we know it's there.'

[[46]]

That's because the act of collecting sacrifices a few individual lives, but in return, it gives us irreplaceable information about hidden species and about how our wildlife is reacting to our changing world. The dramatic dwindling of the planet's diversity – the so-called sixth extinction – makes such work more critical, not less.`,
  items: Object.fromEntries(
    [41, 42, 43, 44, 45, 46].map((number) => [
      number,
      { prompt: `Choose the paragraph which fits gap ${number}.`, options: paragraphOptions },
    ]),
  ),
};

const test1Part8: SetOverride = {
  instructions:
    "You are going to read an article about the sources which university students can use for their essays. For questions 47–56, choose from sections A–D. The sections may be chosen more than once.",
  transcriptionStatus: "verified_from_source_scan",
  fullText: `A
A student is researching scholarly material for her essay. She finds a quote she thinks she can use. It ticks all the boxes: original and insightful, persuasively argued, provocative, and with just enough holes that a good forensic analysis will have something to expose. There's one problem, however. It does not come from an academic paper, but from a blog written by an obscure amateur. It has, technically speaking, no academic credibility. By convention, students – and academics – are supposed only to engage in critical discussion with 'academically credible' sources. What, then, is the student to do? Pretend this precious nugget doesn't exist? A terrible waste. Plagiarise it (after all, who'll know)? Completely unethical. I'm not talking here about the sourcing of facts, or the fraught issue of truth and objectivity. I'm focusing on ideas, opinions and theories and my central argument is that we do our research a disservice if we automatically exclude a source because its provenance does not match certain outmoded criteria.

B
The line between 'credible' and 'non-credible' sources is becoming ever more blurred, particularly in the era of electronic self-publishing. The internet has undoubtedly democratised the spread of ideas, weakening the assumption that university departments have some kind of monopoly on cogent, logical thinking. But if the line on permissible sources were to be moved, where should it be redrawn? If an official university department blog were deemed acceptable for students to cite, for instance, what about the personal blog of a leading professor or research student? What about publications by accredited and respected museums and galleries? And what of those whose published books and articles straddle the border between academia and general readership? Would their more popular works be considered less suitable for essay purposes than the less accessible ones? To take art theory as another example, where do we stand on those critics who write for a general readership? Is it acceptable to engage in argument only with well-established names?

C
There are no easy answers, and I wouldn't dream of suggesting that we completely cast aside the challenging and rigorous in favour of the populist and amateur. Yet the assertion that only papers and books published by universities and their partners and associates are worthy of students' critical engagement does seem to foster a kind of academic protectionism which can't easily be justified. The convention of referring to academic writers exclusively by their surname and the publication date of their text is part of the problem. The effect is to create a kind of 'them and us' attitude, the idea of the grand academic being such a renowned authority on the topic that we don't even introduce them by their full name: they simply don't need one. So you've never heard of Jones (2003)? That's because you're just not on his/her intellectual plane. The surname-only principle implies that flimsiest of notions, the 'academic community', a kind of exclusive club for those who jealously guard rigorous debate and the exchange of ideas. Arguably, this 'club' has never been a real community in any meaningful sense.

D
Far better to introduce academic writers by their full names, with a brief description of who they are, as we already do with sources from outside the so-called academic community. So Jones (2003) would be introduced as Pat Jones, senior lecturer in media studies at X University, in much the same way as we introduce, say, fashion blogger Tim Smith, jewellery designer Lena Thomas or film reviewer Mick Stuart. That way students could be actively encouraged to collate ideas and arguments from multitudinous sources from both inside and outside academia – and ultimately to decide for themselves which ones deserve closer scrutiny on the basis of intrinsic merit. It might even encourage them to become less timid about criticising theory in their own words, based on their own insights. Some will say this would lead to a horrendous free-for-all, where no distinction is made between learned discourse and undisciplined chattering. But sorting the valuable from the worthless and identifying bias, prejudice and sheer self-indulgence is always an intellectually exhilarating task that sharpens one's critical skills – wherever the debate is taking place.`,
  items: {
    47: { prompt: "In which section does the writer ask about the specific details regarding a rule change?", options: labelled("Section") },
    48: { prompt: "In which section does the writer bring the existence of a particular group into question?", options: labelled("Section") },
    49: { prompt: "In which section does the writer mention a factor which has made a distinction less clear?", options: labelled("Section") },
    50: { prompt: "In which section does the writer argue that it is useful to learn how to assess whether or not a source is valid?", options: labelled("Section") },
    51: { prompt: "In which section does the writer mention weaknesses in an extract which can be exploited?", options: labelled("Section") },
    52: { prompt: "In which section does the writer state that a particular custom leads to division and prejudice?", options: labelled("Section") },
    53: { prompt: "In which section does the writer say that a change could increase students' confidence?", options: labelled("Section") },
    54: { prompt: "In which section does the writer mention writers whose work is read by both academics and the public?", options: labelled("Section") },
    55: { prompt: "In which section does the writer explore the choices available in a particular dilemma?", options: labelled("Section") },
    56: { prompt: "In which section does the writer insist that she is not in favour of abandoning the current system?", options: labelled("Section") },
  },
};

const overrides: Record<string, SetOverride> = {
  ADV5_T1_P5: test1Part5,
  ADV5_T1_P6: test1Part6,
  ADV5_T1_P7: test1Part7,
  ADV5_T1_P8: test1Part8,
};

export function applyContentOverride(set: ParsedSet): ParsedSet {
  const override = overrides[set.setId];
  if (!override) return set;
  return {
    ...set,
    instructions: override.instructions,
    fullText: override.fullText,
    transcriptionStatus: override.transcriptionStatus ?? set.transcriptionStatus,
    items: set.items.map((item) => {
      const itemOverride = override.items[item.number];
      return itemOverride ? { ...item, ...itemOverride } : item;
    }),
  };
}
