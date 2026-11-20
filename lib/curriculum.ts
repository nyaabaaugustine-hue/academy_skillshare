export type LessonKind = "reading" | "quiz" | "code";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explain: string;
};

export type CodeTask = {
  prompt: string;
  starter: string;
  expected: string;
  hints: string[];
};

export type Lesson = {
  slug: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  summary: string;
  body: string[];
  sample?: string;
  quiz?: QuizQuestion[];
  task?: CodeTask;
};

/**
 * Unit 1 of the web course. The wording is deliberately short and concrete:
 * every lesson fits one sitting on a phone-sized screen.
 */
export const lessons: Lesson[] = [
  {
    slug: "hello-python",
    title: "Hello, Python",
    kind: "reading",
    minutes: 4,
    summary: "What a program is, and your first print().",
    body: [
      "A program is a list of instructions the computer carries out in order, from the top down. Python is one of the friendliest languages to start with because the instructions look almost like English.",
      "The function `print()` sends text to the screen. Text goes inside quotes, and the quotes themselves never appear in the output. Everything after a `#` is a comment — Python ignores it, so it is a note for humans.",
      "Try changing the greeting in the editor below one word at a time. Nothing you type here can break anything.",
    ],
    sample: `# Your first program\nprint("Hello, world")\nprint("My name is Ama")\n\n# This line does nothing\n# print("I am hidden")`,
  },
  {
    slug: "variables",
    title: "Variables",
    kind: "code",
    minutes: 6,
    summary: "Names for values, and f-strings that read like sentences.",
    body: [
      "A variable is a name for a value. You create one with `=`, and Python works out the type from what you put on the right: `14` is a whole number, `3.5` is a decimal, `\"Ama\"` is text.",
      "An f-string puts values straight into text. Put an `f` before the opening quote and wrap the variable in curly braces: `f\"Hello, {name}\"`.",
    ],
    sample: `name = "Ama"\nage = 14\nprint(f"{name} is {age}")`,
    task: {
      prompt:
        'Create the variables `name` and `age`, then print exactly "Ama is 14" using one f-string.',
      starter: 'name = "Ama"\nage = 14\n\n# Print the sentence using an f-string\n',
      expected: "Ama is 14",
      hints: [
        "An f-string starts with f before the quote: f\"...\".",
        "Put the variable name inside curly braces: {name}.",
      ],
    },
  },
  {
    slug: "arithmetic",
    title: "Arithmetic",
    kind: "code",
    minutes: 6,
    summary: "Numbers, operators, and the difference between ÷ and //.",
    body: [
      "Python does arithmetic the way a calculator does. `+`, `-`, `*` and `/` behave as you expect, but `/` always gives a decimal: `10 / 4` is `2.5`.",
      "For whole-number division use `//` — `10 // 4` is `2`. The `%` operator gives the remainder: `10 % 4` is `2`. That remainder is how you test whether a number is even.",
    ],
    sample: `print(7 * 8)      # 56\nprint(17 % 5)     # 2\nprint(10 / 4)     # 2.5\nprint(10 // 4)    # 2`,
    task: {
      prompt: "Print 7 × 8 on the first line, then the remainder of 17 ÷ 5 on the second.",
      starter: "# Line 1: multiplication\n\n# Line 2: remainder\n",
      expected: "56\n2",
      hints: ["Multiplication uses the * operator.", "The remainder operator is %."],
    },
  },
  {
    slug: "conditions",
    title: "Conditions",
    kind: "quiz",
    minutes: 6,
    summary: "if / elif / else, comparisons and indentation.",
    body: [
      "Conditions let a program choose a path. `if` runs a block when something is true, `elif` checks another case, and `else` catches everything left over.",
      "Python compares with `==`, `!=`, `<`, `>`, `<=` and `>=`. Note the double equals: a single `=` assigns, `==` compares.",
      "The indented lines under an `if` are what actually runs. Indentation is part of the language, not decoration.",
    ],
    sample: `score = 85\n\nif score >= 90:\n    print("distinction")\nelif score >= 50:\n    print("pass")\nelse:\n    print("try again")`,
    quiz: [
      {
        question: "What does `10 >= 10` evaluate to?",
        options: ["True", "False", "An error", "10"],
        answer: 0,
        explain: ">= means greater than or equal, and 10 equals 10, so the result is True.",
      },
      {
        question: "Which keyword checks a second condition after a failed `if`?",
        options: ["else", "elif", "then", "switch"],
        answer: 1,
        explain: "elif is Python's 'else if'. else takes no condition of its own.",
      },
      {
        question: "What is wrong with `if score = 90:`?",
        options: [
          "Nothing, it is valid",
          "It should be `==` to compare",
          "score must be a string",
          "It needs a semicolon",
        ],
        answer: 1,
        explain: "A single = assigns a value; == compares two values.",
      },
    ],
  },
  {
    slug: "loops",
    title: "Loops",
    kind: "code",
    minutes: 7,
    summary: "for, range() and while — repeating work without repeating code.",
    body: [
      "A `for` loop walks over a sequence. `range(1, 6)` produces 1, 2, 3, 4, 5 — the end value is never included.",
      "A `while` loop repeats as long as a condition stays true. Use it when you do not know in advance how many turns you need, and always make sure something inside changes the condition.",
    ],
    sample: `for number in range(1, 4):\n    print(number)\n\ncount = 0\nwhile count < 2:\n    print("tick")\n    count = count + 1`,
    task: {
      prompt: "Print the numbers 1 to 5, one per line, using a for loop and range().",
      starter: "for number in range(/* start */, /* stop */):\n    print(number)\n",
      expected: "1\n2\n3\n4\n5",
      hints: ["range(1, 6) starts at 1 and stops before 6."],
    },
  },
  {
    slug: "functions",
    title: "Functions",
    kind: "code",
    minutes: 7,
    summary: "def, parameters and return — named blocks you can reuse.",
    body: [
      "A function is a named block of code. Define it once with `def`, give it parameters, and send a result back with `return`.",
      "Calling `greet(\"Ada\")` hands the value `\"Ada\"` to the parameter `name`. Without `return`, the function gives back `None`, which is Python's way of saying 'nothing'.",
    ],
    sample: `def greet(name):\n    return f"Hi {name}!"\n\nprint(greet("Ada"))`,
    task: {
      prompt: 'Write a function `greet(name)` that returns "Hi <name>!" and print greet("Ada").',
      starter: 'def greet(name):\n    # return the greeting\n\n\nprint(greet("Ada"))\n',
      expected: "Hi Ada!",
      hints: [
        "Return an f-string: return f\"Hi {name}!\"",
        "Return sends the value back; print only displays it.",
      ],
    },
  },
  {
    slug: "lists",
    title: "Lists",
    kind: "code",
    minutes: 7,
    summary: "Ordered collections, indexes, append() and sum().",
    body: [
      "A list holds several values in order. Square brackets create one, and indexes start at 0, so `scores[0]` is the first item.",
      "`append()` adds to the end. `len()` counts the items, and `sum()` adds up numbers — both are quicker and safer than looping by hand.",
    ],
    sample: `scores = [90, 75, 88]\nscores.append(100)\nprint(scores[0])   # 90\nprint(len(scores)) # 4\nprint(sum(scores)) # 353`,
    task: {
      prompt: "Start with [10, 20, 30], append 40, then print the total.",
      starter: "scores = [10, 20, 30]\n# append 40, then print the total\n",
      expected: "100",
      hints: ["scores.append(40) changes the list.", "sum(scores) adds every number."],
    },
  },
  {
    slug: "dictionaries",
    title: "Dictionaries",
    kind: "quiz",
    minutes: 6,
    summary: "Key-value pairs, .get() and looping over items().",
    body: [
      "A dictionary stores pairs: a key that points to a value. Curly braces create one, and a colon separates each key from its value.",
      "Read or write a key with square brackets. If the key might be missing, `.get(key)` returns `None` instead of crashing, and `.items()` loops over both halves of each pair.",
    ],
    sample: `student = {"name": "Ada", "xp": 120}\nprint(student["name"])       # Ada\nstudent["xp"] = student["xp"] + 10\nprint(student.get("age"))    # None`,
    quiz: [
      {
        question: "How do you read the value stored under the key `name`?",
        options: ["student(name)", "student.name", 'student["name"]', "student->name"],
        answer: 2,
        explain: "Square brackets with the key read a dictionary value.",
      },
      {
        question: "What does `student.get(\"age\")` return when there is no age key?",
        options: ["0", "None", "An error", '""'],
        answer: 1,
        explain: "get() returns None for a missing key; square brackets would raise KeyError.",
      },
      {
        question: "Which loop gives you both the key and the value?",
        options: [
          "for item in student:",
          "for key, value in student.items():",
          "for key in student.keys():",
          "for value in student:",
        ],
        answer: 1,
        explain: ".items() yields (key, value) pairs you can unpack in the loop.",
      },
    ],
  },
  {
    slug: "input-output",
    title: "Input & output",
    kind: "reading",
    minutes: 5,
    summary: "input(), converting text to numbers, and printing nicely.",
    body: [
      "`input()` pauses the program, shows a prompt, and returns whatever the learner types — always as text. Wrap it in `int()` or `float()` before doing maths with it.",
      "The web runner in this preview has no keyboard attached, so `input()` will raise an error here. The Android app feeds it lines of sample input so exercises that read from the learner still work.",
      "Printing is the other half of the conversation: `print()` accepts several values separated by commas, and f-strings keep longer sentences readable.",
    ],
    sample: `# Works in the app, where sample input is supplied\nname = input("What is your name? ")\nage = int(input("How old are you? "))\nprint(f"Next year you turn {age + 1}, {name}.")`,
  },
  {
    slug: "errors",
    title: "Errors & debugging",
    kind: "quiz",
    minutes: 6,
    summary: "Reading a traceback from the bottom up.",
    body: [
      "Errors are information, not failure. Python names the kind of problem on the last line of the traceback, and the line above it shows where the problem happened.",
      "The three you will meet first: `SyntaxError` (the code could not be parsed at all), `NameError` (a name was used before it existed, often a typo), and `TypeError` (two values that cannot be combined, such as text plus a number).",
    ],
    sample: `user = "Ada"\n# print(useer)   # NameError: name 'useer' is not defined\nprint(user)\n\n# print("Age: " + 14)   # TypeError: can only concatenate str\nprint("Age: " + str(14))`,
    quiz: [
      {
        question: "You typed `prnt(\"hi\")`. Which error appears?",
        options: ["SyntaxError", "NameError", "TypeError", "ValueError"],
        answer: 1,
        explain: "prnt is an unknown name, so Python raises NameError. The syntax itself is fine.",
      },
      {
        question: 'Why does `"Age: " + 14` fail?',
        options: [
          "14 must be a float",
          "You cannot add str and int",
          "The quotes are unbalanced",
          "print is missing",
        ],
        answer: 1,
        explain: "Python will not silently join text and a number — convert with str(14) first.",
      },
      {
        question: "Where is the real error named in a traceback?",
        options: [
          "On the first line",
          "In the middle",
          "On the last line",
          "It is not shown",
        ],
        answer: 2,
        explain: "The final line carries the exception type and message; above it is the location.",
      },
    ],
  },
  {
    slug: "fizzbuzz",
    title: "Mini project: FizzBuzz",
    kind: "code",
    minutes: 8,
    summary: "Loops, conditions and modulo in one small program.",
    body: [
      "FizzBuzz is the classic first program that combines everything so far. Count from 1 to 15. Multiples of 3 become `fizz`, multiples of 5 become `buzz`, and multiples of both become `fizzbuzz`.",
      "The trick is order: check the 'both' case first, otherwise 15 will match 3 and never reach the combined branch.",
    ],
    sample: `for number in range(1, 6):\n    if number % 15 == 0:\n        print("fizzbuzz")\n    elif number % 3 == 0:\n        print("fizz")\n    elif number % 5 == 0:\n        print("buzz")\n    else:\n        print(number)`,
    task: {
      prompt: "Print FizzBuzz for the numbers 1 to 15, one value per line.",
      starter:
        'for number in range(1, 16):\n    # fizzbuzz first, then fizz, then buzz, then the number\n    print(number)\n',
      expected:
        "1\n2\nfizz\n4\nbuzz\nfizz\n7\n8\nfizz\nbuzz\n11\nfizz\n13\n14\nfizzbuzz",
      hints: [
        "Check number % 15 == 0 before the % 3 case.",
        "An if / elif / else chain prints exactly one value per number.",
      ],
    },
  },
  {
    slug: "review",
    title: "Review & next steps",
    kind: "quiz",
    minutes: 5,
    summary: "A quick check, then what to build next.",
    body: [
      "You have covered variables, arithmetic, conditions, loops, functions, lists, dictionaries and errors — the working vocabulary of Python.",
      "The best next step is not more reading: it is changing a program until it does something you want. Start from any lesson's editor, break it on purpose, and read the error.",
    ],
    quiz: [
      {
        question: "Which value does `len([3, 1, 4])` return?",
        options: ["3", "8", "[3, 1, 4]", "1"],
        answer: 0,
        explain: "len() counts items, not their sum.",
      },
      {
        question: "What does `17 // 5` give?",
        options: ["3.4", "3", "2", "4"],
        answer: 1,
        explain: "// is floor division: 17 divided by 5 is 3 whole times.",
      },
      {
        question: "A function with no `return` statement gives back…",
        options: ["0", '""', "None", "an error"],
        answer: 2,
        explain: "Python returns None when a function falls off the end without returning.",
      },
    ],
  },
];

export const getLesson = (slug: string) => lessons.find((lesson) => lesson.slug === slug);

export const lessonIndex = (slug: string) =>
  lessons.findIndex((lesson) => lesson.slug === slug);

export const nextLesson = (slug: string) => {
  const index = lessonIndex(slug);
  return index >= 0 && index + 1 < lessons.length ? lessons[index + 1] : null;
};
