export const upcomingTrainings = [
  {
    type: "BOOTCAMP",
    title: "Python Coding Bootcamp",
    date: "June 2026",
    duration: "4 weeks",
    format: "Hybrid",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    description:
      "A hands-on bootcamp for young learners to build real projects with Python, logic, and problem-solving.",
  },
  {
    type: "TRAINING",
    title: "Web Design Fundamentals",
    date: "July 2026",
    duration: "3 weeks",
    format: "Online + in person",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    description:
      "Learn how websites are structured and styled while creating beautiful, responsive pages from scratch.",
  },
  {
    type: "BOOTCAMP",
    title: "Robotics & IoT Starter Lab",
    date: "August 2026",
    duration: "5 weeks",
    format: "In person",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    description:
      "Build, wire, and program simple smart devices while exploring robotics, sensors, and creative engineering.",
  },
  {
    type: "TRAINING",
    title: "AI for Young Innovators",
    date: "September 2026",
    duration: "2 weeks",
    format: "Hybrid",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    description:
      "An age-appropriate introduction to AI concepts, responsible use, and creative projects with real-world impact.",
  },
];

export const programmeOptions = [
  "Young Explorers (Ages 7–9)",
  "Digital Creators (Ages 10–13)",
  "Future Innovators (Ages 14–16)",
  "Python for Beginners",
  ...upcomingTrainings.map((item) => `${item.title} (${item.type === "BOOTCAMP" ? "Bootcamp" : "Training"})`),
];
