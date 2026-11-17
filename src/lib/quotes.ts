export type Quote = {
  before: string
  time: string
  after: string
  title: string
  author: string
}

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
]

const TENS = ["", "", "twenty", "thirty", "forty", "fifty"]

function numberWord(n: number): string {
  if (n < 20) return ONES[n]
  const ones = n % 10
  return ones ? `${TENS[Math.floor(n / 10)]}-${ONES[ones]}` : TENS[n / 10]
}

function hourWord(hours: number): string {
  const h = hours % 24
  if (h === 0) return "midnight"
  if (h === 12) return "noon"
  return numberWord(h % 12 || 12)
}

function minuteWord(minutes: number): string {
  if (minutes === 15) return "quarter"
  if (minutes === 30) return "half"
  if (minutes % 5 === 0) return numberWord(minutes)
  return `${numberWord(minutes)} ${minutes === 1 ? "minute" : "minutes"}`
}

export function timePhrase(hours: number, minutes: number): string {
  if (minutes === 0) {
    const hour = hourWord(hours)
    return hours % 12 === 0 ? hour : `${hour} o'clock`
  }
  if (minutes <= 30) return `${minuteWord(minutes)} past ${hourWord(hours)}`
  return `${minuteWord(60 - minutes)} to ${hourWord(hours + 1)}`
}

type Template = {
  before: string
  after: string
  title: string
  author: string
}

const TEMPLATES: Template[] = [
  {
    before: "It was ",
    after:
      " when the last lamp came on in the reading room, and she had not yet turned a page.",
    title: "The Lamplighter's Index",
    author: "Margaret Ellery",
  },
  {
    before: "The church bell across the green struck ",
    after: ", and Ada closed the ledger without finishing the sum.",
    title: "Accounts of a Quiet Parish",
    author: "Thomas Wren",
  },
  {
    before: "“We leave at ",
    after: ",” he said, “and not a minute after.”",
    title: "The Night Ferry",
    author: "Josephine Hale",
  },
  {
    before:
      "There is a particular kind of silence that settles over a house when everyone in it has given up pretending to sleep, and it was in that silence, at ",
    after:
      ", that Alice finally heard the letterbox clatter, and knew, before she had even reached the stairs, that the envelope would carry her mother's handwriting and that nothing in the house would be quite the same again.",
    title: "Letters from Hollow Lane",
    author: "Beatrice Morland",
  },
  {
    before: "By ",
    after: " the tea had gone cold and the argument had gone nowhere.",
    title: "A Fortnight in Grantchester",
    author: "Edwin Calloway",
  },
  {
    before: "The station clock read ",
    after:
      ". Bob checked it against his watch, then against the timetable, then against his own uneasy heart.",
    title: "Platform Nine",
    author: "Harriet Vane-Doyle",
  },
  {
    before: "Nobody in the village could remember a storm arriving at ",
    after: ", yet there it was, black over the fens.",
    title: "The Fenland Almanac",
    author: "Cecily Marsh",
  },
  {
    before:
      "She had promised herself that she would stop working at a reasonable hour, that the manuscript would still be there in the morning, that the candle was nearly gone and her eyes were nearly gone with it; and yet it was ",
    after:
      " before she set down the pen, and even then she lay awake rewriting the final paragraph in her head until the birds began.",
    title: "The Unfinished Chapter",
    author: "Ada Lovelace-Grey",
  },
]

export function quoteFor(hours: number, minutes: number): Quote {
  const template = TEMPLATES[(hours * 60 + minutes) % TEMPLATES.length]
  return { ...template, time: timePhrase(hours, minutes) }
}
